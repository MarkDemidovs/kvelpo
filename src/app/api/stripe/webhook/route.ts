import { NextResponse } from "next/server";
import getStripe from "../../../../server/stripe";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const stripe = getStripe();

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    // Handle relevant events
    switch (event.type) {
      case "checkout.session.completed":
        // TODO: fulfill subscription — update DB, send welcome email, etc.
        console.log("Checkout session completed", event.data.object);
        break;
      case "invoice.payment_failed":
        console.log("Invoice payment failed", event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return new NextResponse("Received", { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }
}
