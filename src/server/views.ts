import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { profiles, projectViews } from "~/server/db/schema";
import { isPro } from "~/lib/membership";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Records that a signed-in person looked at a project: one row per viewer per
 * day. Owners' own views and anonymous visitors are not recorded (no tracking of
 * people who aren't signed in). A viewer with "browse privately" is still
 * counted, but the owner only ever sees their top skill, never who they are.
 */
export async function recordProjectView(projectId: number, viewerId: string): Promise<void> {
  const viewer = await db
    .select({ browsePrivately: profiles.browsePrivately, skills: profiles.skills })
    .from(profiles)
    .where(eq(profiles.clerkUserId, viewerId))
    .then((rows) => rows[0]);

  const skills = Array.isArray(viewer?.skills) ? (viewer.skills as unknown[]) : [];
  const topSkill = skills.find((skill): skill is string => typeof skill === "string") ?? null;

  await db
    .insert(projectViews)
    .values({
      projectId,
      viewerClerkUserId: viewerId,
      viewedOn: sql`current_date`,
      isPrivate: viewer?.browsePrivately ?? false,
      viewerSkill: topSkill,
    })
    .onConflictDoNothing();
}

export type ProjectInsights = {
  /** Whether the owner can see who viewed (Pro). Free owners only get counts. */
  canSeeViewers: boolean;
  totalViews: number;
  /** Last 7 days, oldest first, with zero-filled gaps. */
  days: { date: string; views: number }[];
  /** Views in the 7 days before `days`, for the week-over-week comparison. */
  previousWeekViews: number;
  viewers: { userId: string | null; name: string; viewedOn: string }[] | null;
};

export async function getProjectInsights(projectId: number, ownerMembership: string | null): Promise<ProjectInsights> {
  const canSeeViewers = isPro(ownerMembership);
  const since = new Date(Date.now() - 6 * DAY_MS).toISOString().slice(0, 10);

  const [{ total } = { total: 0 }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(projectViews)
    .where(eq(projectViews.projectId, projectId));

  const perDay = await db
    .select({ date: sql<string>`${projectViews.viewedOn}::text`, views: sql<number>`count(*)::int` })
    .from(projectViews)
    .where(and(eq(projectViews.projectId, projectId), gte(projectViews.viewedOn, since)))
    .groupBy(projectViews.viewedOn);

  const previousStart = new Date(Date.now() - 13 * DAY_MS).toISOString().slice(0, 10);
  const [{ previous } = { previous: 0 }] = await db
    .select({ previous: sql<number>`count(*)::int` })
    .from(projectViews)
    .where(and(eq(projectViews.projectId, projectId), gte(projectViews.viewedOn, previousStart), lt(projectViews.viewedOn, since)));

  const countByDate = new Map(perDay.map((row) => [row.date, row.views]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * DAY_MS).toISOString().slice(0, 10);
    return { date, views: countByDate.get(date) ?? 0 };
  });

  let viewers: ProjectInsights["viewers"] = null;
  if (canSeeViewers) {
    const rows = await db
      .select({
        userId: projectViews.viewerClerkUserId,
        isPrivate: projectViews.isPrivate,
        skill: projectViews.viewerSkill,
        viewedOn: sql<string>`${projectViews.viewedOn}::text`,
        fullName: profiles.fullName,
      })
      .from(projectViews)
      .leftJoin(profiles, eq(projectViews.viewerClerkUserId, profiles.clerkUserId))
      .where(eq(projectViews.projectId, projectId))
      .orderBy(sql`${projectViews.viewedOn} desc`, sql`${projectViews.id} desc`)
      .limit(30);

    viewers = rows.map((row) => {
      if (row.isPrivate) {
        return {
          userId: null,
          name: row.skill ? `Someone with ${row.skill.toLowerCase()} skills` : "Someone browsing privately",
          viewedOn: row.viewedOn,
        };
      }
      const name = row.fullName?.trim();
      return { userId: row.userId, name: name?.length ? name : "A kvelpo member", viewedOn: row.viewedOn };
    });
  }

  return { canSeeViewers, totalViews: total, days, previousWeekViews: previous, viewers };
}
