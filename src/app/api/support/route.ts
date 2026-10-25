import { auth } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { supportMessages } from "~/server/db/schema";
import { isSupportTopic, isValidEmail, MAX_SUPPORT_MESSAGE } from "~/lib/support";

const MAX_MESSAGES_PER_DAY = 5;

/** Salted hash of the caller's IP, only for rate limiting signed-out senders. */
function hashIp(req: Request): string | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
  if (!ip) return null;
  return createHash("sha256")
    .update(`${process.env.CLERK_SECRET_KEY ?? "kvelpo"}:${ip}`)
    .digest("hex");
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const text = (key: string) => {
    const value = body?.[key];
    return typeof value === "string" ? value.trim() : "";
  };

  // Honeypot: a field hidden from people that bots tend to fill in. Pretend
  // success so they don't learn to avoid it.
  if (text("website")) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const name = text("name");
  const email = text("email");
  const topic = body?.topic;
  const message = text("message");

  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address so we can reply" }, { status: 400 });
  }
  if (!isSupportTopic(topic)) {
    return Response.json({ error: "Please pick a topic" }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "Please write a message" }, { status: 400 });
  }
  if (message.length > MAX_SUPPORT_MESSAGE || name.length > 256) {
    return Response.json({ error: `Messages must be at most ${MAX_SUPPORT_MESSAGE} characters` }, { status: 400 });
  }

  const ipHash = hashIp(req);

  try {
    const created = await db.transaction(async (tx) => {
      const limiter = userId ?? ipHash ?? "anonymous";
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"support:" + limiter}))`);

      const [recent] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(supportMessages)
        .where(
          and(
            userId ? eq(supportMessages.clerkUserId, userId) : ipHash ? eq(supportMessages.ipHash, ipHash) : sql`false`,
            gt(supportMessages.createdAt, sql`now() - interval '1 day'`),
          ),
        );
      if ((recent?.count ?? 0) >= MAX_MESSAGES_PER_DAY) {
        return false;
      }

      await tx.insert(supportMessages).values({
        clerkUserId: userId ?? null,
        name: name.length > 0 ? name : null,
        email,
        topic,
        message,
        ipHash,
      });
      return true;
    });

    if (!created) {
      return Response.json(
        { error: "You've sent several messages today. We'll get back to you; for anything urgent, email us directly." },
        { status: 429 },
      );
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving support message:", error);
    return Response.json({ error: "Couldn't send your message. Please email us directly." }, { status: 500 });
  }
}
