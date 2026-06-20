import type Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "~/server/stripe";

const productPricing: Record<string, { membership: "pro" | "team"; unit_amount: number; currency: string }> = {
  prod_UjZ9bGau4TRDpx: { membership: "pro", unit_amount: 1000, currency: "usd" },
  prod_UjZAZkazu0bMDv: { membership: "team", unit_amount: 3000, currency: "usd" },
};

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

    const stripe = getStripe();
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const result = getLineItems(priceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: result.lineItems,
      metadata: {
        userId,
        membership: result.membership,
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

function getLineItems(priceId: string): {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  membership: "pro" | "team" | "free";
} {
  if (priceId.startsWith("price_")) {
    return {
      lineItems: [{ price: priceId, quantity: 1 }],
      membership: "free",
    };
  }

  if (productPricing[priceId]) {
    const priceData = productPricing[priceId];
    return {
      lineItems: [
        {
          price_data: {
            currency: priceData.currency,
            product: priceId,
            unit_amount: priceData.unit_amount,
            recurring: { interval: "month" as const },
          },
          quantity: 1,
        },
      ],
      membership: priceData.membership,
    };
  }

  throw new Error("Invalid Stripe ID. Expected a price_ or prod_ ID.");
}
