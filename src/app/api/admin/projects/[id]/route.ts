import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { notifications, projects } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";
import { logModerationAction, MAX_MODERATION_REASON, readReason } from "~/server/moderation";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => new Response("Not found", { status: 404 });

async function loadProject(params: RouteContext["params"]) {
  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return null;
  const [project] = await db
    .select({ id: projects.id, name: projects.name, ownerId: projects.clerkUserId })
    .from(projects)
    .where(eq(projects.id, id));
  return project ?? null;
}

/** Admin edit of a project's name, description and/or visibility. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const adminId = await getAdminUserId();
  if (!adminId) return notFound();

  const project = await loadProject(params);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const update: { name?: string; description?: string | null; isPublic?: boolean } = {};

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 256) {
      return Response.json({ error: "Name is required and must be at most 256 characters" }, { status: 400 });
    }
    update.name = name;
  }
  if (body?.description !== undefined) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    update.description = description.length > 0 ? description : null;
  }
  if (body?.isPublic !== undefined) {
    if (typeof body.isPublic !== "boolean") {
      return Response.json({ error: "Invalid visibility" }, { status: 400 });
    }
    update.isPublic = body.isPublic;
  }
  const reason = readReason(body);
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to change" }, { status: 400 });
  }
  if (reason.length > MAX_MODERATION_REASON) {
    return Response.json({ error: `Reason must be at most ${MAX_MODERATION_REASON} characters` }, { status: 400 });
  }

  try {
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(projects).set(update).where(eq(projects.id, project.id)).returning();
      await tx.insert(notifications).values({
        clerkUserId: project.ownerId,
        projectId: project.id,
        type: "admin_edit",
        message: `The kvelpo team edited your project "${row?.name ?? project.name}".${reason ? ` Reason: ${reason}` : ""}`,
      });
      await logModerationAction(
        { adminClerkUserId: adminId, action: "edit", targetClerkUserId: project.ownerId, projectId: project.id, projectName: row?.name ?? project.name, reason },
        tx,
      );
      return row;
    });
    return Response.json(updated);
  } catch (error) {
    console.error("Admin project edit failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Admin deletion of any project, with a reason sent to the owner. */
export async function DELETE(req: Request, { params }: RouteContext) {
  const adminId = await getAdminUserId();
  if (!adminId) return notFound();

  const project = await loadProject(params);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const reason = readReason((await req.json().catch(() => null)) as Record<string, unknown> | null);
  if (!reason) {
    return Response.json({ error: "Please give a reason; it's sent to the owner" }, { status: 400 });
  }
  if (reason.length > MAX_MODERATION_REASON) {
    return Response.json({ error: `Reason must be at most ${MAX_MODERATION_REASON} characters` }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(projects).where(eq(projects.id, project.id));
      // projectId stays null: it would be cascade-deleted with the project.
      await tx.insert(notifications).values({
        clerkUserId: project.ownerId,
        projectId: null,
        type: "admin_delete",
        message: `The kvelpo team removed your project "${project.name}". Reason: ${reason}`,
      });
      await logModerationAction(
        { adminClerkUserId: adminId, action: "delete", targetClerkUserId: project.ownerId, projectId: project.id, projectName: project.name, reason },
        tx,
      );
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Admin project delete failed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
