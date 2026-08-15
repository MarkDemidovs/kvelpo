import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects, profiles, projectRolesNeeded } from "~/server/db/schema";
import { eq, or, sql } from "drizzle-orm";

type ClerkAvatarUser = {
  id: string;
  imageUrl?: string | null;
};

type RolePayload = {
  title: string;
  description?: string | null;
  slotsNeeded?: number | string;
};

type ProjectListItem = {
  id: number;
  clerkUserId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: unknown;
  createdAt: Date;
  updatedAt: Date;
  userFullName: string | null;
  avatarUrl: string | null;
  rolesNeededCount: number;
};

async function attachClerkAvatars(projects: ProjectListItem[]): Promise<ProjectListItem[]> {
  if (projects.length === 0) {
    return projects.map((project) => ({ ...project, avatarUrl: null }));
  }

  const ownerIds = Array.from(new Set(projects.map((project) => project.clerkUserId)));
  try {
    const clerk = await clerkClient();
    const userListResponse = await clerk.users.getUserList({ userId: ownerIds });
    const users = (userListResponse as unknown as { data: ClerkAvatarUser[] }).data ?? [];
    const avatarById = new Map(users.map((user) => [user.id, user.imageUrl ?? null]));
    return projects.map((project) => ({ ...project, avatarUrl: avatarById.get(project.clerkUserId) ?? null }));
  } catch (error) {
    console.error("Failed to fetch Clerk user avatars:", error);
    return projects.map((project) => ({ ...project, avatarUrl: null }));
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "public";
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "12", 10);
    const offset = (page - 1) * limit;

    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "not set");

    const baseQuery = db
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
      .limit(limit)
      .offset(offset);

    let projectsData: ProjectListItem[] = [];
    if (mode === "own") {
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      projectsData = await baseQuery.where(() => eq(projects.clerkUserId, userId)).groupBy(projects.id, profiles.fullName) as ProjectListItem[];
    } else if (userId) {
      projectsData = await baseQuery.where(() => or(eq(projects.isPublic, true), eq(projects.clerkUserId, userId))).groupBy(projects.id, profiles.fullName) as ProjectListItem[];
    } else {
      projectsData = await baseQuery.where(() => eq(projects.isPublic, true)).groupBy(projects.id, profiles.fullName) as ProjectListItem[];
    }

    // Sort by creation date in memory
    projectsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Response.json(await attachClerkAvatars(projectsData));
  } catch (error) {
    console.error("Full error:", error);
    return Response.json(
      {
        error: String(error),
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      isPublic?: unknown;
      tags?: unknown;
      rolesNeeded?: unknown;
    };

    const name = typeof body.name === "string" ? body.name : undefined;
    const description = typeof body.description === "string" ? body.description : null;
    const isPublic = Boolean(body.isPublic);
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags.filter((tag): tag is string => typeof tag === "string").slice(0, 3);
    const rolesNeeded = body.rolesNeeded;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const existingProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.clerkUserId, userId));

    const membership = (await db.select({ status: profiles.membership }).from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))?.[0]?.status as MembershipStatus ?? "free";

    type MembershipStatus = "free" | "pro" | "team";

    const membershipProjectLimits: Record<MembershipStatus, number> = {
      free: 1,
      pro: 3,
      team: 10,
    };

    if (existingProjects.length >= membershipProjectLimits[membership]) {
      return Response.json({ error: `Your membership status is ${membership}, which means that you can make a maximum of ${membershipProjectLimits[membership]} projects` }, { status: 400 });
    }

    const [newProject] = await db.insert(projects).values({
      clerkUserId: userId,
      name,
      description,
      isPublic,
      tags,
    }).returning();

    if (!newProject) {
      return Response.json({ error: "Failed to create project" }, { status: 500 });
    }

    const filteredRoles = Array.isArray(rolesNeeded)
      ? rolesNeeded.filter((role): role is RolePayload => {
        if (typeof role !== "object" || role === null) {
          return false;
        }

        const maybeRole = role as Record<string, unknown>;
        return (
          typeof maybeRole.title === "string" &&
          maybeRole.title.trim().length > 0
        );
      })
      : [];

    if (filteredRoles.length > 0) {
      await db.insert(projectRolesNeeded).values(
        filteredRoles.map((role) => ({
          projectId: newProject.id,
          title: role.title.trim(),
          description: role.description?.trim() ?? null,
          slotsNeeded: Math.max(1, Number(role.slotsNeeded) || 1),
        }))
      );
    }

    const [profile] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId));

    let avatarUrl: string | null = null;
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userId) as ClerkAvatarUser;
      avatarUrl = clerkUser.imageUrl ?? null;
    } catch (error) {
      console.error("Failed to fetch Clerk avatar for new project:", error);
    }

    const totalSlots = filteredRoles.reduce(
      (sum, role) => sum + Math.max(1, Number(role.slotsNeeded) || 1),
      0,
    );

    return Response.json({
      ...newProject,
      userFullName: profile?.fullName ?? null,
      avatarUrl,
      rolesNeededCount: totalSlots,
    }, { status: 201 });
  } catch (error) {
    console.error("Full error:", error);
    return Response.json(
      {
        error: String(error),
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}