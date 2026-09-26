import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import skillDefinitions from "~/data/skills.json";

const defaultProfileValues = {
  fullName: null,
  bio: null,
  isPublic: true,
  membership: "free" as const,
  link1: null,
  link2: null,
  link3: null,
  skills: [] as string[],
};

const allowedSkillNames = new Set(skillDefinitions.map((skill) => skill.name));

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const existingProfile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.clerkUserId, userId),
  });

  if (existingProfile) {
    return NextResponse.json(existingProfile);
  }

  await db.insert(profiles).values({ clerkUserId: userId, ...defaultProfileValues }).onConflictDoNothing({ target: profiles.clerkUserId });

  const profile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.clerkUserId, userId),
  });

  if (!profile) {
    return new NextResponse("Unable to create profile", { status: 500 });
  }

  return NextResponse.json(profile);
}

type MembershipType = "free" | "pro" | "team";

type ProfileUpdateRequest = {
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isPublic?: boolean;
  membership?: MembershipType;
  link1?: string | null;
  link2?: string | null;
  link3?: string | null;
  skills?: string[] | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isObject(body)) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const rawSkills = Array.isArray(body.skills) ? body.skills : undefined;
  const parsedSkills = rawSkills?.filter((skill): skill is string => typeof skill === "string");
  const uniqueSkills = rawSkills ? [...new Set(parsedSkills ?? [])] : undefined;

  if (uniqueSkills && uniqueSkills.length > 15) {
    return new NextResponse("A profile may include at most 15 skills", { status: 400 });
  }

  if (uniqueSkills?.some((skill) => !allowedSkillNames.has(skill))) {
    return new NextResponse("One or more selected skills are invalid", { status: 400 });
  }

  const links = [body.link1, body.link2, body.link3].map((link) =>
    typeof link === "string" && link.trim() ? link.trim() : null,
  );
  // Links are rendered as <a href> on the public profile, so only allow web
  // URLs (no javascript:/data: etc.).
  if (links.some((link) => link && (link.length > 512 || !isHttpUrl(link)))) {
    return new NextResponse("Links must be http(s) URLs of at most 512 characters", { status: 400 });
  }

  if (typeof body.fullName === "string" && body.fullName.length > 256) {
    return new NextResponse("Name must be at most 256 characters", { status: 400 });
  }

  const parsedBody: ProfileUpdateRequest = {
    fullName: typeof body.fullName === "string" ? body.fullName : null,
    bio: typeof body.bio === "string" ? body.bio : null,
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : null,
    isPublic: typeof body.isPublic === "boolean" ? body.isPublic : undefined,
    link1: links[0] ?? null,
    link2: links[1] ?? null,
    link3: links[2] ?? null,
    skills: uniqueSkills,
  };

  const updateData: Record<string, unknown> = {
    fullName: parsedBody.fullName,
    bio: parsedBody.bio,
    avatarUrl: parsedBody.avatarUrl,
    isPublic: parsedBody.isPublic,
    link1: parsedBody.link1,
    link2: parsedBody.link2,
    link3: parsedBody.link3,
  };

  if (parsedBody.membership !== undefined) {
    updateData.membership = parsedBody.membership;
  }

  if (parsedBody.skills !== undefined) {
    updateData.skills = parsedBody.skills;
  }

  const result = await db.update(profiles)
    .set(updateData)
    .where(eq(profiles.clerkUserId, userId))
    .returning();

  const updated = result[0];

  if (!updated) {
    await db.insert(profiles).values({ clerkUserId: userId, ...defaultProfileValues, ...updateData }).onConflictDoNothing({ target: profiles.clerkUserId });
    const createdProfile = await db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.clerkUserId, userId),
    });

    if (!createdProfile) {
      return new NextResponse("Unable to save profile", { status: 500 });
    }

    return NextResponse.json(createdProfile);
  }

  return NextResponse.json(updated);
}
