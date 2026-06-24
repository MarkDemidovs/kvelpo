import { NextResponse } from "next/server";
import getStripe from "~/server/stripe";
import type Stripe from "stripe"; // Ensure Stripe type is imported

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> } // 1. Typed as a Promise
) {
  // 2. Await the params before using them
  const { sessionId } = await params;

  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer_details"],
    });

    const subscription = session.subscription as Stripe.Subscription | undefined;
    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: subscription
        ? {
          id: subscription.id,
          status: subscription.status,
          // Accessing them from the items data array:
          current_period_start: subscription.items.data[0]?.current_period_start ?? null,
          current_period_end: subscription.items.data[0]?.current_period_end ?? null,
        }
        : null,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email ?? null,
      metadata: session.metadata ?? null,
      url: session.url ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Unable to retrieve session: ${message}`, { status: 400 });
  }
}