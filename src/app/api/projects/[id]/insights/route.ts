import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { profiles, projects } from "~/server/db/schema";
import { getProjectInsights } from "~/server/views";

/** View insights for a project. Only its owner can read them. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = Number.parseInt(id, 10);
  if (Number.isNaN(projectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  try {
    const project = await db
      .select({ ownerId: projects.clerkUserId, ownerMembership: profiles.membership })
      .from(projects)
      .leftJoin(profiles, eq(projects.clerkUserId, profiles.clerkUserId))
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0]);

    if (project?.ownerId !== userId) {
      // Same answer for "missing" and "not yours" so ids can't be probed.
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json(await getProjectInsights(projectId, project.ownerMembership));
  } catch (error) {
    console.error("Failed to load project insights:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
