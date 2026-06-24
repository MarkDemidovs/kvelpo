import { NextResponse } from "next/server";
import getStripe from "~/server/stripe";
import type Stripe from "stripe";

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Await the params before using them (Next.js requirement)
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
    
    // Access the first line item to get the period timestamps
    const subscriptionItem = subscription?.items?.data[0];

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            // Accessing them safely from the items data array due to newer Stripe API updates
            current_period_start: subscriptionItem?.current_period_start ?? null,
            current_period_end: subscriptionItem?.current_period_end ?? null,
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