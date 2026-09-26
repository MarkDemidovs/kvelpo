import { auth } from "@clerk/nextjs/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { profiles, projects, reports } from "~/server/db/schema";
import { isReportReason, isReportTargetType, MAX_REPORT_DETAILS } from "~/lib/reports";

const MAX_REPORTS_PER_DAY = 10;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to report content" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const targetType = body?.targetType;
  const rawTargetId = typeof body?.targetId === "string" || typeof body?.targetId === "number" ? String(body.targetId).trim() : "";
  const reason = body?.reason;
  const details = typeof body?.details === "string" ? body.details.trim() : "";

  if (!isReportTargetType(targetType) || !rawTargetId || rawTargetId.length > 256) {
    return Response.json({ error: "Invalid report target" }, { status: 400 });
  }
  if (!isReportReason(reason)) {
    return Response.json({ error: "Please pick a reason" }, { status: 400 });
  }
  if (details.length > MAX_REPORT_DETAILS) {
    return Response.json({ error: `Details must be at most ${MAX_REPORT_DETAILS} characters` }, { status: 400 });
  }

  try {
    // The target must exist, and people can't report their own content.
    if (targetType === "project") {
      const projectId = Number(rawTargetId);
      const project = Number.isInteger(projectId)
        ? await db
            .select({ ownerId: projects.clerkUserId, isPublic: projects.isPublic })
            .from(projects)
            .where(eq(projects.id, projectId))
            .then((rows) => rows[0])
        : undefined;
      if (!project || (!project.isPublic && project.ownerId !== userId)) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      if (project.ownerId === userId) {
        return Response.json({ error: "You can't report your own project" }, { status: 400 });
      }
    } else {
      if (rawTargetId === userId) {
        return Response.json({ error: "You can't report your own profile" }, { status: 400 });
      }
      const profile = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.clerkUserId, rawTargetId))
        .then((rows) => rows[0]);
      if (!profile) {
        return Response.json({ error: "Profile not found" }, { status: 404 });
      }
    }

    const result = await db.transaction(async (tx) => {
      // Serialize per reporter so the duplicate/daily-limit checks hold under
      // concurrent submissions.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"report:" + userId}))`);

      const [existing] = await tx
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.reporterClerkUserId, userId),
            eq(reports.targetType, targetType),
            eq(reports.targetId, rawTargetId),
            eq(reports.status, "open"),
          ),
        )
        .limit(1);
      if (existing) {
        return "duplicate" as const;
      }

      const [recent] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(reports)
        .where(and(eq(reports.reporterClerkUserId, userId), gt(reports.createdAt, sql`now() - interval '1 day'`)));
      if ((recent?.count ?? 0) >= MAX_REPORTS_PER_DAY) {
        return "limited" as const;
      }

      await tx.insert(reports).values({
        reporterClerkUserId: userId,
        targetType,
        targetId: rawTargetId,
        reason,
        details: details.length > 0 ? details : null,
      });
      return "created" as const;
    });

    if (result === "duplicate") {
      // Not an error from the reporter's point of view: it's already queued.
      return Response.json({ ok: true, alreadyReported: true });
    }
    if (result === "limited") {
      return Response.json({ error: "You've sent a lot of reports today. Please try again tomorrow." }, { status: 429 });
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
