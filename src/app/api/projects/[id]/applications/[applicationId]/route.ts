import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, notifications, projectMembers, projectRolesNeeded, projects } from "~/server/db/schema";
import { eq, and, gt, sql, TransactionRollbackError } from "drizzle-orm";

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

    const body = (await request.json()) as { status?: string };
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
      .select({ id: projectRolesNeeded.id, projectId: projectRolesNeeded.projectId, title: projectRolesNeeded.title })
      .from(projectRolesNeeded)
      .where(eq(projectRolesNeeded.id, application.projectRoleNeededId))
      .then((rows) => rows[0]);

    if (role?.projectId !== projectId) {
      return Response.json({ error: "Application does not belong to this project" }, { status: 400 });
    }

    const project = await db
      .select({ clerkUserId: projects.clerkUserId, name: projects.name })
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

    const result = await db.transaction(async (tx) => {
      // Conditional updates make this safe against double-clicks/concurrent
      // owners: only one request can move the application out of "pending",
      // and only one can take each remaining slot.
      const [updated] = await tx
        .update(applications)
        .set({ status })
        .where(and(eq(applications.id, appId), eq(applications.status, "pending")))
        .returning();

      if (!updated) {
        return { error: "Only pending applications can be updated" } as const;
      }

      if (status === "accepted") {
        // Filled roles are kept at 0 slots rather than deleted: deleting the
        // role would cascade-delete every application for it, including the
        // one being accepted here.
        const [claimedSlot] = await tx
          .update(projectRolesNeeded)
          .set({ slotsNeeded: sql`${projectRolesNeeded.slotsNeeded} - 1` })
          .where(and(eq(projectRolesNeeded.id, role.id), gt(projectRolesNeeded.slotsNeeded, 0)))
          .returning({ id: projectRolesNeeded.id });

        if (!claimedSlot) {
          tx.rollback();
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

      await tx.insert(notifications).values({
        clerkUserId: application.clerkUserId,
        projectId,
        type: status === "accepted" ? "application_accepted" : "application_rejected",
        message:
          status === "accepted"
            ? `You've been accepted as ${role.title} on ${project.name}! You can now chat with the team.`
            : `Your application for ${role.title} on ${project.name} was declined.`,
        isRead: false,
      });

      return { application: updated } as const;
    }).catch((error: unknown) => {
      if (error instanceof TransactionRollbackError) {
        return { error: "This role is already filled" } as const;
      }
      throw error;
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.application);
  } catch (error) {
    console.error("Error updating application:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}