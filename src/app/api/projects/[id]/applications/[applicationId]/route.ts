import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, projectMembers, projectRolesNeeded, projects } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, applicationId } = await params;
    const projectId = parseInt(id);
    const appId = parseInt(applicationId);
    if (isNaN(projectId) || isNaN(appId)) {
      return Response.json({ error: "Invalid project or application ID" }, { status: 400 });
    }

    const body = await request.json();
    const status = body.status === "accepted" ? "accepted" : body.status === "rejected" ? "rejected" : undefined;
    if (!status) {
      return Response.json({ error: "Status must be accepted or rejected" }, { status: 400 });
    }

    const application = await db
      .select({ id: applications.id, clerkUserId: applications.clerkUserId, projectRoleNeededId: applications.projectRoleNeededId, status: applications.status })
      .from(applications)
      .where(eq(applications.id, appId))
      .then((rows) => rows[0]);

    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    const role = await db
      .select({ id: projectRolesNeeded.id, projectId: projectRolesNeeded.projectId, slotsNeeded: projectRolesNeeded.slotsNeeded })
      .from(projectRolesNeeded)
      .where(eq(projectRolesNeeded.id, application.projectRoleNeededId))
      .then((rows) => rows[0]);

    if (!role || role.projectId !== projectId) {
      return Response.json({ error: "Application does not belong to this project" }, { status: 400 });
    }

    const project = await db
      .select({ clerkUserId: projects.clerkUserId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0]);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.clerkUserId !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (application.status !== "pending") {
      return Response.json({ error: "Only pending applications can be updated" }, { status: 400 });
    }

    let updatedApplication;
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(applications)
        .set({ status })
        .where(eq(applications.id, appId))
        .returning();

      updatedApplication = updated;

      if (status === "accepted") {
        if (role.slotsNeeded <= 0) {
          throw new Error("Role is already filled");
        }

        const slotsLeft = role.slotsNeeded - 1;
        if (slotsLeft > 0) {
          await tx
            .update(projectRolesNeeded)
            .set({ slotsNeeded: slotsLeft })
            .where(eq(projectRolesNeeded.id, role.id));
        } else {
          await tx.delete(projectRolesNeeded).where(eq(projectRolesNeeded.id, role.id));
        }

        const existingMember = await tx
          .select({ id: projectMembers.id })
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, projectId),
              eq(projectMembers.clerkUserId, application.clerkUserId),
            ),
          )
          .then((rows) => rows[0]);

        if (!existingMember) {
          await tx.insert(projectMembers).values({
            projectId,
            clerkUserId: application.clerkUserId,
            role: "member",
          });
        }
      }
    });

    return Response.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
