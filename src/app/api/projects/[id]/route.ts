import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { applications, projects, profiles, projectRolesNeeded } from "~/server/db/schema";
import { eq, sql, and, gt, inArray } from "drizzle-orm";
import { isProjectCategory } from "~/lib/categories";
import { getAdminUserId } from "~/server/admin";
import { isBoosted } from "~/server/boost";
import { recordProjectView } from "~/server/views";
import { isPro } from "~/lib/membership";

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
        category: projects.category,
        isDraft: projects.isDraft,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        userFullName: profiles.fullName,
        ownerBannedAt: profiles.bannedAt,
        ownerMembership: profiles.membership,
        boostedUntil: projects.boostedUntil,
        rolesNeededCount: sql<number>`coalesce(sum(${projectRolesNeeded.slotsNeeded}), 0)`,
      })
      .from(projects)
      .leftJoin(profiles, eq(projects.clerkUserId, profiles.clerkUserId))
      .leftJoin(projectRolesNeeded, eq(projects.id, projectRolesNeeded.projectId))
      .where(eq(projects.id, projectId))
      .groupBy(projects.id, profiles.fullName, profiles.bannedAt, profiles.membership);

    const project = projectData[0];
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

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

    const viewerIsAdmin = userId ? Boolean(await getAdminUserId()) : false;

    if (!isPublic && projectOwnerId !== userId && !viewerIsAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (project?.ownerBannedAt && !viewerIsAdmin) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = projectOwnerId === userId;

    // Count the visit (signed-in, non-owner, non-admin viewers only). A failure
    // here must never break loading the project.
    if (userId && !isOwner && !viewerIsAdmin) {
      try {
        await recordProjectView(projectId, userId);
      } catch (error) {
        console.error("Failed to record project view:", error);
      }
    }

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

    const { ownerBannedAt, ownerMembership, ...publicProject } = project;
    return Response.json({
      ...publicProject,
      featured: isBoosted(project.boostedUntil),
      ownerVerified: isPro(ownerMembership),
      // Only admins learn about moderation state.
      ...(viewerIsAdmin ? { viewerIsAdmin: true, ownerBanned: Boolean(ownerBannedAt) } : {}),
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
const MAX_TITLE_LENGTH = 256;
const MAX_ROLE_SLOTS = 100;

type RoleInput = { id?: unknown; title?: unknown; description?: unknown; slotsNeeded?: unknown };

/** Owner edits: any of name, description, category, tags, visibility, draft state and the roles list. */
export async function PATCH(
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

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const existing = await db
      .select({ clerkUserId: projects.clerkUserId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0]);

    // Same answer for "missing" and "not yours" so ids can't be probed.
    if (existing?.clerkUserId !== userId) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const updates: Partial<typeof projects.$inferInsert> = {};

    if ("name" in body) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
      if (name.length > MAX_TITLE_LENGTH) {
        return Response.json({ error: `Name must be at most ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
      }
      updates.name = name;
    }
    if ("description" in body) {
      updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }
    if ("category" in body) {
      updates.category = isProjectCategory(body.category) ? body.category : null;
    }
    if (Array.isArray(body.tags)) {
      updates.tags = body.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 3);
    }
    if (typeof body.isPublic === "boolean") {
      updates.isPublic = body.isPublic;
    }
    if (typeof body.isDraft === "boolean") {
      updates.isDraft = body.isDraft;
      // Posting a draft makes it public unless the owner said otherwise.
      if (!body.isDraft && typeof body.isPublic !== "boolean") updates.isPublic = true;
      if (body.isDraft) updates.isPublic = false;
    }

    let roleInputs: Array<{ id: number | null; title: string; description: string | null; slotsNeeded: number }> | null = null;
    if (Array.isArray(body.rolesNeeded)) {
      roleInputs = [];
      for (const raw of body.rolesNeeded as RoleInput[]) {
        if (typeof raw !== "object" || raw === null) continue;
        const title = typeof raw.title === "string" ? raw.title.trim() : "";
        if (!title) continue;
        if (title.length > MAX_TITLE_LENGTH) {
          return Response.json({ error: `Role titles must be at most ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
        }
        roleInputs.push({
          id: typeof raw.id === "number" && Number.isInteger(raw.id) ? raw.id : null,
          title,
          description: typeof raw.description === "string" ? raw.description.trim() || null : null,
          slotsNeeded: Math.min(MAX_ROLE_SLOTS, Math.max(1, Math.floor(Number(raw.slotsNeeded)) || 1)),
        });
      }
    }

    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.update(projects).set(updates).where(eq(projects.id, projectId));
      }

      if (roleInputs) {
        const current = await tx
          .select({ id: projectRolesNeeded.id })
          .from(projectRolesNeeded)
          .where(eq(projectRolesNeeded.projectId, projectId));
        const currentIds = new Set(current.map((role) => role.id));
        const keptIds = new Set(roleInputs.filter((role) => role.id !== null && currentIds.has(role.id)).map((role) => role.id!));

        for (const role of roleInputs) {
          if (role.id !== null && currentIds.has(role.id)) {
            await tx
              .update(projectRolesNeeded)
              .set({ title: role.title, description: role.description, slotsNeeded: role.slotsNeeded })
              .where(and(eq(projectRolesNeeded.id, role.id), eq(projectRolesNeeded.projectId, projectId)));
          } else {
            await tx.insert(projectRolesNeeded).values({ projectId, title: role.title, description: role.description, slotsNeeded: role.slotsNeeded });
          }
        }

        // Roles left out are closed (0 spots) if people already applied, so their
        // applications survive; otherwise they are deleted.
        const removed = [...currentIds].filter((roleId) => !keptIds.has(roleId));
        if (removed.length > 0) {
          const withApplications = await tx
            .select({ roleId: applications.projectRoleNeededId })
            .from(applications)
            .where(inArray(applications.projectRoleNeededId, removed));
          const protectedIds = new Set(withApplications.map((row) => row.roleId));
          const toClose = removed.filter((roleId) => protectedIds.has(roleId));
          const toDelete = removed.filter((roleId) => !protectedIds.has(roleId));
          if (toClose.length > 0) {
            await tx.update(projectRolesNeeded).set({ slotsNeeded: 0 }).where(inArray(projectRolesNeeded.id, toClose));
          }
          if (toDelete.length > 0) {
            await tx.delete(projectRolesNeeded).where(inArray(projectRolesNeeded.id, toDelete));
          }
        }
      }
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error updating project:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
