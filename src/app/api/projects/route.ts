import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects, profiles, projectRolesNeeded } from "~/server/db/schema";
import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { isPro, normalizeMembership, projectLimitFor } from "~/lib/membership";
import { isBoosted } from "~/server/boost";

const MAX_TITLE_LENGTH = 256;
const MAX_ROLE_SLOTS = 100;

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
  boostedUntil: Date | null;
  ownerMembership: string | null;
};

/** What the list endpoint returns: the row plus the derived Explore flags. */
type ProjectListResponseItem = Omit<ProjectListItem, "ownerMembership"> & {
  /** Currently boosted: shows the "Featured" label and sorts first. */
  featured: boolean;
  /** Owner is on Pro: shows the verified badge. */
  ownerVerified: boolean;
};

function toListResponse(project: ProjectListItem): ProjectListResponseItem {
  const { ownerMembership, ...rest } = project;
  return { ...rest, featured: isBoosted(project.boostedUntil), ownerVerified: isPro(ownerMembership) };
}

async function attachClerkAvatars<T extends { clerkUserId: string; avatarUrl: string | null }>(projects: T[]): Promise<T[]> {
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

/** Escapes the characters that are special inside a LIKE/ILIKE pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function GET(request: Request) {
  const { userId } = await auth();

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "public";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "12", 10) || 12));
    const offset = (page - 1) * limit;

    const search = url.searchParams.get("q")?.trim().slice(0, 100) ?? "";
    const searchCondition: SQL | undefined = search
      ? or(
          ilike(projects.name, `%${escapeLike(search)}%`),
          ilike(projects.description, `%${escapeLike(search)}%`),
          sql`${projects.tags}::text ilike ${`%${escapeLike(search)}%`}`,
        )
      : undefined;

    const featuredRank = sql<number>`case when ${projects.boostedUntil} > now() then 2 when ${profiles.membership} in ('pro', 'team') and ${projects.createdAt} > now() - interval '30 days' then 1 else 0 end`;

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
        boostedUntil: projects.boostedUntil,
        ownerMembership: profiles.membership,
      })
      .from(projects)
      .leftJoin(profiles, eq(projects.clerkUserId, profiles.clerkUserId))
      .leftJoin(projectRolesNeeded, eq(projects.id, projectRolesNeeded.projectId))
      // Order in SQL (not after fetching) so pages are stable and don't
      // repeat or skip projects during infinite scroll. Boosted projects come
      // first, then fresh Pro projects ("featured placement"), then newest.
      .orderBy(desc(featuredRank), desc(projects.createdAt), desc(projects.id))
      .limit(limit)
      .offset(offset);

    let projectsData: ProjectListItem[] = [];
    if (mode === "own") {
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      projectsData = await baseQuery.where(() => and(eq(projects.clerkUserId, userId), searchCondition)).groupBy(projects.id, profiles.fullName, profiles.membership) as ProjectListItem[];
    } else if (userId) {
      projectsData = await baseQuery.where(() => and(or(eq(projects.isPublic, true), eq(projects.clerkUserId, userId)), isNull(profiles.bannedAt), searchCondition)).groupBy(projects.id, profiles.fullName, profiles.membership) as ProjectListItem[];
    } else {
      // Projects of banned users are hidden from everyone browsing.
      projectsData = await baseQuery.where(() => and(eq(projects.isPublic, true), isNull(profiles.bannedAt), searchCondition)).groupBy(projects.id, profiles.fullName, profiles.membership) as ProjectListItem[];
    }

    return Response.json(await attachClerkAvatars(projectsData.map(toListResponse)));
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

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    const isPublic = Boolean(body.isPublic);
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags.filter((tag): tag is string => typeof tag === "string").slice(0, 3);
    const rolesNeeded = body.rolesNeeded;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > MAX_TITLE_LENGTH) {
      return Response.json({ error: `Name must be at most ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
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

    if (filteredRoles.some((role) => role.title.trim().length > MAX_TITLE_LENGTH)) {
      return Response.json({ error: `Role titles must be at most ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }

    const roleRows = filteredRoles.map((role) => ({
      title: role.title.trim(),
      description: typeof role.description === "string" ? role.description.trim() || null : null,
      slotsNeeded: Math.min(MAX_ROLE_SLOTS, Math.max(1, Math.floor(Number(role.slotsNeeded)) || 1)),
    }));

    const result = await db.transaction(async (tx) => {
      // Serialize project-creation checks per user so two concurrent requests
      // can't both pass the count check before either insert commits.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

      const existingProjects = await tx.select({ id: projects.id }).from(projects).where(eq(projects.clerkUserId, userId));

      const storedMembership = (await tx.select({ status: profiles.membership }).from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))?.[0]?.status;
      const membership = normalizeMembership(storedMembership);
      const limit = projectLimitFor(membership);

      if (existingProjects.length >= limit) {
        return { limitReached: true as const, membership, limit };
      }

      const [created] = await tx.insert(projects).values({
        clerkUserId: userId,
        name,
        description,
        isPublic,
        tags,
      }).returning();

      // Same transaction as the project, so a failed role insert can't leave
      // behind a project with no roles.
      if (created && roleRows.length > 0) {
        await tx.insert(projectRolesNeeded).values(roleRows.map((role) => ({ ...role, projectId: created.id })));
      }

      return { limitReached: false as const, project: created };
    });

    if (result.limitReached) {
      const planLabel = result.membership.charAt(0).toUpperCase() + result.membership.slice(1);
      const nextTip = "Delete an existing project, or upgrade to Pro for unlimited projects.";

      return Response.json(
        {
          error: `You've reached the ${result.limit}-project limit for the ${planLabel} plan. ${nextTip}`,
          code: "PROJECT_LIMIT_REACHED",
          membership: result.membership,
          limit: result.limit,
        },
        { status: 403 }
      );
    }

    const newProject = result.project;

    if (!newProject) {
      return Response.json({ error: "Failed to create project" }, { status: 500 });
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

    const totalSlots = roleRows.reduce((sum, role) => sum + role.slotsNeeded, 0);

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