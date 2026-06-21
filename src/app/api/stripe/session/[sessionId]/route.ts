import { NextResponse } from "next/server";
import getStripe from "~/server/stripe";

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
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
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
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
