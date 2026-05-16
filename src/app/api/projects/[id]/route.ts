import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, projects, profiles, projectMembers, projectRolesNeeded } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  try {
    // Next.js 15: params must be awaited
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const projectData = await db
      .select({
        id: projects.id,
        clerkUserId: projects.clerkUserId,
        name: projects.name,
        description: projects.description,
        isPublic: projects.isPublic,
        tags: projects.tags,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        userFullName: profiles.fullName,
        rolesNeededCount: sql<number>`coalesce(sum(${projectRolesNeeded.slotsNeeded}), 0)`,
      })
      .from(projects)
      .leftJoin(profiles, eq(projects.clerkUserId, profiles.clerkUserId))
      .leftJoin(projectRolesNeeded, eq(projects.id, projectRolesNeeded.projectId))
      .where(eq(projects.id, projectId))
      .groupBy(projects.id, profiles.fullName);

    // 1. Check if the array is empty
    if (!projectData || projectData.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Grab the first result
    const project = projectData[0];

    // 3. Destructure specifically to handle potential nulls from the Join
    // This tells TypeScript: "If these are null, we handle them here"
    const isPublic = project?.isPublic;
    const projectOwnerId = project?.clerkUserId;

    // 4. Perform the authorization check safely
    if (!isPublic && projectOwnerId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isOwner = projectOwnerId === userId;

    const rolesNeeded = await db
      .select({
        id: projectRolesNeeded.id,
        title: projectRolesNeeded.title,
        description: projectRolesNeeded.description,
        slotsNeeded: projectRolesNeeded.slotsNeeded,
      })
      .from(projectRolesNeeded)
      .where(eq(projectRolesNeeded.projectId, projectId));

    let applicationsList: Array<{
      id: number;
      clerkUserId: string;
      message: string | null;
      status: string;
      projectRoleNeededId: number;
      roleTitle: string | null;
      applicantFullName: string | null;
      createdAt: Date;
      updatedAt: Date | null;
    }> = [];
    if (isOwner) {
      applicationsList = await db
        .select({
          id: applications.id,
          clerkUserId: applications.clerkUserId,
          message: applications.message,
          status: applications.status,
          projectRoleNeededId: applications.projectRoleNeededId,
          roleTitle: projectRolesNeeded.title,
          applicantFullName: profiles.fullName,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
        })
        .from(applications)
        .leftJoin(projectRolesNeeded, eq(applications.projectRoleNeededId, projectRolesNeeded.id))
        .leftJoin(profiles, eq(applications.clerkUserId, profiles.clerkUserId))
        .where(eq(projectRolesNeeded.projectId, projectId));
    }

    return Response.json({
      ...project,
      rolesNeeded,
      isOwner,
      applications: isOwner ? applicationsList : undefined,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}