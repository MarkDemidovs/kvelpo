import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { experiences } from "~/server/db/schema";
import { experienceColumns } from "~/server/experience";
import { MAX_EXPERIENCES, parseExperienceInput, sortExperiences } from "~/lib/experience";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db.select(experienceColumns).from(experiences).where(eq(experiences.clerkUserId, userId));
    return Response.json(sortExperiences(rows));
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseExperienceInput(await req.json().catch(() => null));
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await db.transaction(async (tx) => {
      // Serialize per user so concurrent requests can't exceed the cap.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"experience:" + userId}))`);
      const [existing] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(experiences)
        .where(eq(experiences.clerkUserId, userId));
      if ((existing?.count ?? 0) >= MAX_EXPERIENCES) {
        return null;
      }
      const [row] = await tx
        .insert(experiences)
        .values({ clerkUserId: userId, ...parsed.value })
        .returning(experienceColumns);
      return row ?? null;
    });

    if (!created) {
      return Response.json({ error: `You can add at most ${MAX_EXPERIENCES} experiences` }, { status: 400 });
    }
    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
