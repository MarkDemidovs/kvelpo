import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { profiles, projects, applications, projectRolesNeeded, projectMembers, messages, notifications, userConsent, experiences, reports, supportMessages } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { getStripe } from "./stripe";

const DELETED_USER_SENTINEL = "deleted-user";



export async function createProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [profile] = await db
    .insert(profiles)
    .values({
      clerkUserId: userId,
      fullName: null,
      bio: null,
      avatarUrl: null,
      isPublic: true,
    })
    .onConflictDoNothing({ target: profiles.clerkUserId }) // Prevents error if exists
    .returning();

  if (!profile) {
    return await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.clerkUserId, userId),
    });
  }

  return profile;
}

/**
 * A user may read/post project chat if they own the project, are an accepted
 * applicant, or are a project member.
 */
export async function canAccessProjectChat(projectId: number, userId: string): Promise<boolean> {
  const project = await db
    .select({ clerkUserId: projects.clerkUserId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .then((rows) => rows[0]);

  if (!project) return false;
  if (project.clerkUserId === userId) return true;

  const acceptedApplication = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(projectRolesNeeded, eq(applications.projectRoleNeededId, projectRolesNeeded.id))
    .where(
      and(
        eq(projectRolesNeeded.projectId, projectId),
        eq(applications.clerkUserId, userId),
        eq(applications.status, "accepted"),
      ),
    )
    .then((rows) => rows[0]);

  if (acceptedApplication) return true;

  const membership = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.clerkUserId, userId)))
    .then((rows) => rows[0]);

  return Boolean(membership);
}

/**
 * Full account-deletion cleanup, shared by the user-initiated delete action and
 * the Clerk `user.deleted` webhook (safety net for deletions triggered outside
 * the app). Safe to call more than once for the same user.
 *
 * - Projects the user owns are deleted outright (cascades away their roles,
 *   members, messages, and notifications via the schema's FK cascades).
 * - Rows the user left inside *other* people's projects (messages,
 *   applications, project memberships) are anonymized rather than deleted, so
 *   the remaining participants don't lose their conversation/roster history.
 * - Rows that belong exclusively to the user (their own notifications,
 *   experience timeline, support messages, consent record, profile) are
 *   hard-deleted.
 * - Any active Stripe subscription is canceled so deleting an account also
 *   stops billing; the Stripe customer object itself is left alone since
 *   invoice/billing records have their own retention requirements.
 */
export async function eraseUserAccountData(clerkUserId: string): Promise<void> {
  const profile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.clerkUserId, clerkUserId),
  });

  if (profile?.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
    } catch (error) {
      console.error(`Failed to cancel Stripe subscription for ${clerkUserId}:`, error);
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.clerkUserId, clerkUserId));

    await tx.update(messages).set({ clerkUserId: DELETED_USER_SENTINEL }).where(eq(messages.clerkUserId, clerkUserId));
    await tx.update(applications).set({ clerkUserId: DELETED_USER_SENTINEL }).where(eq(applications.clerkUserId, clerkUserId));
    await tx.update(projectMembers).set({ clerkUserId: DELETED_USER_SENTINEL }).where(eq(projectMembers.clerkUserId, clerkUserId));
    // Reports they filed stay for moderation history but lose their identity;
    // reports about their (now deleted) profile have nothing left to review.
    await tx.update(reports).set({ reporterClerkUserId: DELETED_USER_SENTINEL }).where(eq(reports.reporterClerkUserId, clerkUserId));
    await tx.delete(reports).where(and(eq(reports.targetType, "profile"), eq(reports.targetId, clerkUserId)));

    await tx.delete(notifications).where(eq(notifications.clerkUserId, clerkUserId));
    await tx.delete(experiences).where(eq(experiences.clerkUserId, clerkUserId));
    await tx.delete(supportMessages).where(eq(supportMessages.clerkUserId, clerkUserId));
    await tx.delete(userConsent).where(eq(userConsent.userId, clerkUserId));
    await tx.delete(profiles).where(eq(profiles.clerkUserId, clerkUserId));
  });
}