import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import getStripe, { syncMembershipFromSubscription } from "~/server/stripe";
import type Stripe from "stripe";

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer_details"],
    });

    const subscription = session.subscription as string | Stripe.Subscription | null | undefined;

    const subscriptionItem = subscription && typeof subscription !== 'string' ? subscription.items?.data[0] : undefined;

    const sessionUserId = session.metadata?.userId;

    // Persist the membership on the success redirect. This makes the upgrade
    // durable even when the Stripe webhook is delayed. We only trust the
    // session if it's paid and its metadata belongs to the signed-in user.
    if (
      session.payment_status === "paid" &&
      subscription &&
      typeof subscription !== "string" &&
      sessionUserId &&
      sessionUserId === userId
    ) {
      await syncMembershipFromSubscription(subscription, userId);
    }

    let subscriptionData = null;
    if (subscription && typeof subscription !== 'string') {
      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscriptionItem?.current_period_start ?? null,
        current_period_end: subscriptionItem?.current_period_end ?? null,
      };
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: subscriptionData,
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
