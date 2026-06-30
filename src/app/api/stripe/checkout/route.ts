import { auth } from "@clerk/nextjs/server";
import { getStripe } from "~/server/stripe";

type PaidMembership = "pro" | "team";

/**
 * Maps a Stripe price ID to the membership tier it grants. Built from the
 * public price env vars so the client and server stay in sync. The membership
 * is derived on the server so the client can never tamper with which tier a
 * checkout grants.
 */
function getPriceMembershipMap(): Record<string, PaidMembership> {
  const map: Record<string, PaidMembership> = {};
  const proPrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const teamPrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM;
  if (proPrice) map[proPrice] = "pro";
  if (teamPrice) map[teamPrice] = "team";
  return map;
}

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
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
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
