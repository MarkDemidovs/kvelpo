import type Stripe from "stripe";
import { getStripe } from "../../../../../src/server/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId } = body as { priceId?: string };

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return new Response(JSON.stringify({ error: "Stripe secret key not configured." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const stripe = getStripe();

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const line_items = getLineItems(priceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: line_items as Stripe.Checkout.SessionCreateParams.LineItem[],
      success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

function getLineItems(priceId: string) {
  if (priceId.startsWith("price_")) {
    return [{ price: priceId, quantity: 1 }];
  }

  if (priceId.startsWith("prod_")) {
    const productPricing: Record<string, { unit_amount: number; currency: string }> = {
      prod_UjZ9bGau4TRDpx: { unit_amount: 1000, currency: "usd" },
      prod_UjZAZkazu0bMDv: { unit_amount: 3000, currency: "usd" },
    };

    const priceData = productPricing[priceId];
    if (!priceData) {
      throw new Error(
        "Unsupported Stripe product ID. Use a price_ ID or add the product mapping for this product." 
      );
    }

    return [
      {
        price_data: {
          currency: priceData.currency,
          product: priceId,
          unit_amount: priceData.unit_amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ];
  }

  throw new Error("Invalid Stripe ID. Expected a price_ or prod_ ID.");
}
