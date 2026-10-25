import { auth } from "@clerk/nextjs/server";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "~/server/db";
import { dmThreads, profiles } from "~/server/db/schema";
import { getOrCreateThread } from "~/server/dm";

/** My direct-message threads, newest activity first. */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // A thread that was just opened has no messages yet; `include` keeps it in the list.
    const includeId = Number.parseInt(new URL(request.url).searchParams.get("include") ?? "", 10);
    const threads = await db
      .select()
      .from(dmThreads)
      .where(or(eq(dmThreads.userA, userId), eq(dmThreads.userB, userId)))
      .orderBy(desc(dmThreads.lastMessageAt), desc(dmThreads.createdAt));

    const otherIds = threads.map((thread) => (thread.userA === userId ? thread.userB : thread.userA));
    const people = otherIds.length
      ? await db.select({ id: profiles.clerkUserId, name: profiles.fullName }).from(profiles).where(inArray(profiles.clerkUserId, otherIds))
      : [];
    const nameById = new Map(people.map((person) => [person.id, person.name]));

    return Response.json(
      threads
        // Empty threads (opened but never written in) stay out of the list.
        .filter((thread) => thread.lastMessageAt !== null || thread.id === includeId)
        .map((thread) => {
          const mine = thread.userA === userId;
          const otherUserId = mine ? thread.userB : thread.userA;
          const lastRead = mine ? thread.userALastReadAt : thread.userBLastReadAt;
          return {
            id: thread.id,
            otherUserId,
            otherName: nameById.get(otherUserId)?.trim() ? nameById.get(otherUserId)!.trim() : "kvelpo member",
            lastMessageAt: thread.lastMessageAt,
            unread: Boolean(thread.lastMessageAt && (!lastRead || lastRead < thread.lastMessageAt)),
          };
        }),
    );
  } catch (error) {
    console.error("Failed to list direct messages:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Open (or find) the thread with another person. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
    const otherId = typeof body?.userId === "string" ? body.userId : "";
    if (!otherId || otherId === userId) {
      return Response.json({ error: "Choose someone else to message." }, { status: 400 });
    }

    const other = await db
      .select({ bannedAt: profiles.bannedAt })
      .from(profiles)
      .where(eq(profiles.clerkUserId, otherId))
      .then((rows) => rows[0]);
    if (!other || other.bannedAt) {
      return Response.json({ error: "That person can't be messaged." }, { status: 404 });
    }

    const thread = await getOrCreateThread(userId, otherId);
    return Response.json({ id: thread.id });
  } catch (error) {
    console.error("Failed to open direct message thread:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
