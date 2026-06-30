import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import getStripe from "~/server/stripe";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
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

    const subscription = session.subscription as Stripe.Subscription | undefined;
    
    const subscriptionItem = subscription?.items?.data[0];

    const membership = session.metadata?.membership as "pro" | "team" | undefined;
    const sessionUserId = session.metadata?.userId;

    // Persist the membership on the success redirect. This makes the upgrade
    // durable even when the Stripe webhook isn't configured. We only trust the
    // session if it's paid and its metadata belongs to the signed-in user.
    if (
      session.payment_status === "paid" &&
      membership &&
      sessionUserId &&
      sessionUserId === userId
    ) {
      const updateData: Record<string, unknown> = { membership };

      if (session.customer) {
        updateData.stripeCustomerId =
          typeof session.customer === "string" ? session.customer : session.customer.id;
      }

      if (subscription) {
        updateData.stripeSubscriptionId = subscription.id;
        updateData.subscriptionStartDate = subscriptionItem?.current_period_start
          ? new Date(subscriptionItem.current_period_start * 1000)
          : new Date();
        updateData.subscriptionEndDate = subscriptionItem?.current_period_end
          ? new Date(subscriptionItem.current_period_end * 1000)
          : null;
      }

      await db.update(profiles).set(updateData).where(eq(profiles.clerkUserId, userId));
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
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
