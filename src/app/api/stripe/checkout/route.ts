import Stripe from "stripe";

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

    const stripe = new Stripe(secret, { apiVersion: "2022-11-15" });

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
