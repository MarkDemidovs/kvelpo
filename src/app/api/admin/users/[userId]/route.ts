import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { notifications, profiles, projects } from "~/server/db/schema";
import { getAdminUserId, isAdminUser } from "~/server/admin";
import { logModerationAction, MAX_MODERATION_REASON, readReason } from "~/server/moderation";

type RouteContext = { params: Promise<{ userId: string }> };

/**
 * Warn, ban or unban a user.
 * Body: { action: "warn" | "ban" | "unban", reason?: string, projectId?: number }
 * (projectId only adds context to the log/notification, e.g. "from project X").
 */
export async function POST(req: Request, { params }: RouteContext) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return new Response("Not found", { status: 404 });
  }

  const targetId = decodeURIComponent((await params).userId);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  const reason = readReason(body);
  const projectId = typeof body?.projectId === "number" && Number.isInteger(body.projectId) ? body.projectId : null;

  if (action !== "warn" && action !== "ban" && action !== "unban") {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  if ((action === "warn" || action === "ban") && !reason) {
    return Response.json({ error: "Please give a reason; it's shown to the user" }, { status: 400 });
  }
  if (reason.length > MAX_MODERATION_REASON) {
    return Response.json({ error: `Reason must be at most ${MAX_MODERATION_REASON} characters` }, { status: 400 });
  }
  if (targetId === adminId) {
    return Response.json({ error: "You can't do that to your own account" }, { status: 400 });
  }
  if (action !== "unban" && (await isAdminUser(targetId))) {
    return Response.json({ error: "Other kvelpo team accounts can't be warned or banned here" }, { status: 400 });
  }

  const projectName = projectId
    ? await db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId)).then((rows) => rows[0]?.name ?? null)
    : null;
  const log = { adminClerkUserId: adminId, targetClerkUserId: targetId, projectId, projectName, reason: reason || null };

  try {
    if (action === "warn") {
      await db.transaction(async (tx) => {
        await tx.insert(notifications).values({
          clerkUserId: targetId,
          projectId,
          type: "admin_warning",
          message: `Warning from the kvelpo team${projectName ? ` about "${projectName}"` : ""}: ${reason}`,
        });
        await logModerationAction({ ...log, action: "warn" }, tx);
      });
      return Response.json({ ok: true });
    }

    const clerk = await clerkClient();
    if (action === "ban") {
      // Clerk ban signs them out everywhere and blocks new sign-ins.
      await clerk.users.banUser(targetId);
      await db.transaction(async (tx) => {
        // Upsert: the user may never have opened their profile page.
        await tx
          .insert(profiles)
          .values({ clerkUserId: targetId, bannedAt: new Date(), bannedReason: reason })
          .onConflictDoUpdate({ target: profiles.clerkUserId, set: { bannedAt: new Date(), bannedReason: reason } });
        await logModerationAction({ ...log, action: "ban" }, tx);
      });
      return Response.json({ ok: true, banned: true });
    }

    await clerk.users.unbanUser(targetId);
    await db.transaction(async (tx) => {
      await tx.update(profiles).set({ bannedAt: null, bannedReason: null }).where(eq(profiles.clerkUserId, targetId));
      await logModerationAction({ ...log, action: "unban" }, tx);
    });
    return Response.json({ ok: true, banned: false });
  } catch (error) {
    console.error(`Admin ${action} failed for ${targetId}:`, error);
    return Response.json({ error: `Couldn't ${action} this user. They may have deleted their account.` }, { status: 500 });
  }
}
