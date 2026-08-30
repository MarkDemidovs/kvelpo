import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, getPriceMembershipMap, resolveOrigin, syncMembershipFromSubscription } from "~/server/stripe";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { priceId } = body as { priceId?: string };

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const membershipMap = getPriceMembershipMap();
    const membership = membershipMap[priceId];

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Unknown or unconfigured priceId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = getStripe();
    const origin = resolveOrigin();

    const profile = await db
      .select({ stripeCustomerId: profiles.stripeCustomerId, stripeSubscriptionId: profiles.stripeSubscriptionId })
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .then((rows) => rows[0]);

    // Already on a paid plan: change the existing subscription's price in place
    // instead of starting a second Checkout Session, which would leave the old
    // subscription active and double-bill the customer.
    if (profile?.stripeSubscriptionId) {
      const existing = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
      if (ACTIVE_SUBSCRIPTION_STATUSES.has(existing.status)) {
        const item = existing.items.data[0];
        if (!item) {
          return new Response(JSON.stringify({ error: "Existing subscription has no items" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const updated = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: "create_prorations",
        });

        await syncMembershipFromSubscription(updated, userId);

        return new Response(JSON.stringify({ updated: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: profile?.stripeCustomerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId,
        membership,
      },
      client_reference_id: userId,
      success_url: `${origin}/profile/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile/subscription`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
