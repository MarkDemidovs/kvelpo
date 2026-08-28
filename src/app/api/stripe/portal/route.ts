import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, resolveOrigin } from "~/server/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db
    .select({ stripeCustomerId: profiles.stripeCustomerId })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .then((rows) => rows[0]);

  if (!profile?.stripeCustomerId) {
    return Response.json({ error: "No billing account found for this user" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${resolveOrigin()}/profile/subscription`,
    });

    return Response.json({ url: portalSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
