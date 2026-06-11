import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: { id: string } };

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: { id: string } };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const clerkUserId = evt.data.id;

    try {
      await db.insert(profiles).values({
        clerkUserId,
        fullName: null,
        bio: null,
        isPublic: true,
        skills: [],
      }).onConflictDoNothing({
        target: profiles.clerkUserId,
      });
      console.log(`Profile created for user: ${clerkUserId}`);
    } catch (error) {
      console.error("Failed to create profile:", error);
      return new NextResponse("Failed to create profile", { status: 500 });
    }
  }

  return new NextResponse("Webhook processed", { status: 200 });
}