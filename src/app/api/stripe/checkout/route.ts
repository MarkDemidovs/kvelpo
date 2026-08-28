import { auth } from "@clerk/nextjs/server";
import { getStripe, getPriceMembershipMap, resolveOrigin } from "~/server/stripe";

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
