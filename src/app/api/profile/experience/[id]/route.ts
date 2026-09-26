import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { experiences } from "~/server/db/schema";
import { experienceColumns } from "~/server/experience";
import { parseExperienceInput } from "~/lib/experience";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return Response.json({ error: "Invalid experience ID" }, { status: 400 });
  }

  const parsed = parseExperienceInput(await req.json().catch(() => null));
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(experiences)
      .set(parsed.value)
      .where(and(eq(experiences.id, id), eq(experiences.clerkUserId, userId)))
      .returning(experienceColumns);

    if (!updated) {
      return Response.json({ error: "Experience not found" }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    console.error("Error updating experience:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return Response.json({ error: "Invalid experience ID" }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(experiences)
      .where(and(eq(experiences.id, id), eq(experiences.clerkUserId, userId)))
      .returning({ id: experiences.id });

    if (!deleted) {
      return Response.json({ error: "Experience not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting experience:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
