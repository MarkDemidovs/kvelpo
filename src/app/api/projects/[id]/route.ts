import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, projects, profiles, projectRolesNeeded } from "~/server/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  try {
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

    if (!projectData || projectData.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectData[0];
    const isPublic = project?.isPublic;
    const projectOwnerId = project?.clerkUserId;
    let avatarUrl: string | null = null;
    if (projectOwnerId) {
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(projectOwnerId) as { imageUrl?: string | null };
        avatarUrl = clerkUser.imageUrl ?? null;
      } catch (error) {
        console.error("Failed to fetch Clerk avatar for project owner:", error);
      }
    }

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
      // Filled roles stay in the table (at 0 slots) so their applications
      // survive, but they're no longer open.
      .where(and(eq(projectRolesNeeded.projectId, projectId), gt(projectRolesNeeded.slotsNeeded, 0)));

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
      avatarUrl,
      rolesNeeded,
      isOwner,
      applications: isOwner ? applicationsList : undefined,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const projectOwner = await db
      .select({ clerkUserId: projects.clerkUserId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0]);

    if (!projectOwner) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (projectOwner.clerkUserId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.clerkUserId, userId)));
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}