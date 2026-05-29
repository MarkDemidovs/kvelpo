import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, notifications, profiles, projectRolesNeeded, projects } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(
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

    const body = (await request.json()) as { projectRoleNeededId?: number; message?: string };
    const projectRoleNeededId = typeof body.projectRoleNeededId === "number" ? body.projectRoleNeededId : undefined;
    const message = typeof body.message === "string" ? body.message.trim() : null;

    if (!projectRoleNeededId) {
      return Response.json({ error: "Role selection is required" }, { status: 400 });
    }

    const role = await db
      .select({
        id: projectRolesNeeded.id,
        projectId: projectRolesNeeded.projectId,
        title: projectRolesNeeded.title,
        slotsNeeded: projectRolesNeeded.slotsNeeded,
      })
      .from(projectRolesNeeded)
      .where(eq(projectRolesNeeded.id, projectRoleNeededId))
      .then((rows) => rows[0]);

    if (role?.projectId !== projectId) {
      return Response.json({ error: "Role not found for this project" }, { status: 404 });
    }

    if (role.slotsNeeded <= 0) {
      return Response.json({ error: "This role is already filled" }, { status: 400 });
    }

    const project = await db
      .select({ clerkUserId: projects.clerkUserId, isPublic: projects.isPublic })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0]);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.isPublic && project.clerkUserId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (project.clerkUserId === userId) {
      return Response.json({ error: "You cannot apply to your own project" }, { status: 403 });
    }

    const existingApplication = await db
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(
        and(
          eq(applications.clerkUserId, userId),
          eq(applications.projectRoleNeededId, projectRoleNeededId)
        )
      )
      .then((rows) => rows[0]);

    if (existingApplication && existingApplication.status !== "rejected") {
      return Response.json({ error: "You already have an active application for this role" }, { status: 400 });
    }

    const activeApplications = await db
      .select({ projectId: projectRolesNeeded.projectId, status: applications.status })
      .from(applications)
      .leftJoin(projectRolesNeeded, eq(applications.projectRoleNeededId, projectRolesNeeded.id))
      .where(
        and(
          eq(applications.clerkUserId, userId),
          inArray(applications.status, ["pending", "accepted"])
        )
      );

    const activeProjectIds = new Set(
      activeApplications
        .map((app) => app.projectId)
        .filter((id): id is number => typeof id === "number")
    );
    if (activeProjectIds.size >= 3 && !activeProjectIds.has(projectId)) {
      return Response.json({ error: "You can only apply to 3 active projects. Withdraw or resolve an existing application before applying to another." }, { status: 400 });
    }

    const applicantProfile = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .then((rows) => rows[0]);

    const applicantName = applicantProfile?.fullName ?? "Someone";

    const [newApplication] = await db.insert(applications).values({
      clerkUserId: userId,
      projectRoleNeededId,
      status: "pending",
      message,
    }).returning();

    await db.insert(notifications).values({
      clerkUserId: project.clerkUserId,
      projectId,
      type: "application",
      message: `${applicantName} applied for ${role.title}`,
      isRead: false,
    });

    return Response.json(newApplication, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}