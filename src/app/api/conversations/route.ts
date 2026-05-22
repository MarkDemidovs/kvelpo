import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects, applications, projectRolesNeeded, projectMembers } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Get all projects where user is owner
    const ownedProjects: Array<{ id: number; name: string | null }> = await db
      .select({
        id: projects.id,
        name: projects.name,
      })
      .from(projects)
      .where(eq(projects.clerkUserId, userId));

    // Get project IDs where user has accepted applications
    const acceptedApplications = await db
      .select({ projectId: projectRolesNeeded.projectId })
      .from(applications)
      .innerJoin(projectRolesNeeded, eq(applications.projectRoleNeededId, projectRolesNeeded.id))
      .where(
        and(eq(applications.clerkUserId, userId), eq(applications.status, "accepted"))
      );

    const acceptedProjectIds = [...new Set(acceptedApplications.map((a) => a.projectId))];

    // Get accepted projects
    const acceptedProjects: Array<{ id: number; name: string | null }> = acceptedProjectIds.length
      ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, acceptedProjectIds))
      : [];

    // Get project IDs where user is a member
    const membershipRecords = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.clerkUserId, userId));

    const memberProjectIds = [...new Set(membershipRecords.map((m) => m.projectId))];

    // Get member projects
    const memberProjects: Array<{ id: number; name: string | null }> = memberProjectIds.length
      ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, memberProjectIds))
      : [];

    // Combine and deduplicate
    const allProjects = Array.from(
      new Map([...ownedProjects, ...acceptedProjects, ...memberProjects].map((p) => [p.id, p])).values()
    );

    return new Response(JSON.stringify(allProjects), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
