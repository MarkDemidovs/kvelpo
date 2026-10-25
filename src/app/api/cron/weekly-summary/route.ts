import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { applications, notifications, profiles, projectRolesNeeded, projectViews, projects } from "~/server/db/schema";

/**
 * Weekly (Monday, see vercel.json): tells each project owner how many views and
 * applications their project got in the last 7 days. Vercel calls this with
 * `Authorization: Bearer $CRON_SECRET`; without that secret set, nobody can run it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sinceDay = since.toISOString().slice(0, 10);

    const rows = await db
      .select({
        projectId: projects.id,
        ownerId: projects.clerkUserId,
        name: projects.name,
        views: sql<number>`(select count(*)::int from ${projectViews} where ${projectViews.projectId} = ${projects.id} and ${projectViews.viewedOn} >= ${sinceDay})`,
        applications: sql<number>`(select count(*)::int from ${applications} join ${projectRolesNeeded} on ${projectRolesNeeded.id} = ${applications.projectRoleNeededId} where ${projectRolesNeeded.projectId} = ${projects.id} and ${applications.createdAt} >= ${since})`,
      })
      .from(projects)
      .innerJoin(profiles, eq(profiles.clerkUserId, projects.clerkUserId))
      .where(and(eq(projects.isPublic, true), eq(projects.isDraft, false), sql`${profiles.bannedAt} is null`));

    const summaries = rows.filter((row) => row.views > 0 || row.applications > 0);
    if (summaries.length > 0) {
      await db.insert(notifications).values(
        summaries.map((row) => ({
          clerkUserId: row.ownerId,
          projectId: row.projectId,
          type: "weekly_summary",
          message: `Your weekly summary: ${row.name} got ${row.views} view${row.views === 1 ? "" : "s"} and ${row.applications} application${row.applications === 1 ? "" : "s"} this week.`,
          isRead: false,
        })),
      );
    }

    return Response.json({ projects: rows.length, notified: summaries.length });
  } catch (error) {
    console.error("Weekly summary failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
