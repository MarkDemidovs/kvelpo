import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { projects, profiles, projectRolesNeeded } from "~/server/db/schema";
import { eq, or, sql, inArray } from "drizzle-orm";

type RolePayload = {
  title: string;
  description?: string | null;
  slotsNeeded?: number | string;
};

export async function GET(request: Request) {
  const { userId } = await auth();

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "public";

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
      .leftJoin(projectRolesNeeded, eq(projects.id, projectRolesNeeded.projectId));

    let projectsData;
    if (mode === "own") {
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      projectsData = await baseQuery.where(() => eq(projects.clerkUserId, userId)).groupBy(projects.id, profiles.fullName);
    } else if (userId) {
      projectsData = await baseQuery.where(() => or(eq(projects.isPublic, true), eq(projects.clerkUserId, userId))).groupBy(projects.id, profiles.fullName);
    } else {
      projectsData = await baseQuery.where(() => eq(projects.isPublic, true)).groupBy(projects.id, profiles.fullName);
    }
    // If user is signed in and requesting public feed, compute match scores
    if (userId && mode === "public") {
      // fetch profile skills
      const [profile] = await db.select({ skills: profiles.skills }).from(profiles).where(eq(profiles.clerkUserId, userId));
      const userSkills: string[] = Array.isArray(profile?.skills) ? profile.skills.map((s: any) => String(s).toLowerCase()) : [];

      // fetch roles for returned projects
      if (!projectsData || projectsData.length === 0) {
        return Response.json(projectsData);
      }
      const projectIds = projectsData.map((p: any) => p.id);
      let rolesByProject: Record<number, string[]> = {};
      if (projectIds.length > 0) {
        const roles = await db.select({ projectId: projectRolesNeeded.projectId, title: projectRolesNeeded.title }).from(projectRolesNeeded).where(inArray(projectRolesNeeded.projectId, projectIds));
        for (const r of roles) {
          const projectRoles = rolesByProject[r.projectId] ?? [];
          projectRoles.push(String(r.title).toLowerCase());
          rolesByProject[r.projectId] = projectRoles;
        }
      }

      // compute recency bounds
      const now = Date.now();
      const createdAts = projectsData.map((p: any) => new Date(p.createdAt).getTime());
      const maxCreated = Math.max(...createdAts);
      const minCreated = Math.min(...createdAts);
      const createdRange = Math.max(1, maxCreated - minCreated);

      const scored = projectsData.map((p: any) => {
        const roles = rolesByProject[p.id] ?? [];
        const tags = Array.isArray(p.tags) ? p.tags.map((t: any) => String(t).toLowerCase()) : [];

        // match count: count of userSkills that appear in role titles or tags
        let matchCount = 0;
        for (const skill of userSkills) {
          const inRoles = roles.some((r) => r.includes(skill));
          const inTags = tags.some((t: string) => t.includes(skill));
          if (inRoles || inTags) matchCount += 1;
        }

        // recency normalized 0..1
        const created = new Date(p.createdAt).getTime();
        const recency = (created - minCreated) / createdRange;

        // score weights: match heavy
        const score = matchCount * 2 + recency;
        return { project: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const sorted = scored.map((s) => s.project);
      return Response.json(sorted);
    }

    return Response.json(projectsData);
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
    if (existingProjects.length >= 1) {
      return Response.json({ error: "Only one active project is allowed. Delete an existing project before creating another." }, { status: 400 });
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

    const totalSlots = filteredRoles.reduce(
      (sum, role) => sum + Math.max(1, Number(role.slotsNeeded) || 1),
      0,
    );

    return Response.json({
      ...newProject,
      userFullName: profile?.fullName ?? null,
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