import type Stripe from "stripe";
import { NextResponse } from "next/server";
import getStripe from "~/server/stripe";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const body = await req.text();
  const stripe = getStripe();

  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const membership = session.metadata?.membership as "pro" | "team" | undefined;
        const userId = session.metadata?.userId;
        const subscription = session.subscription as Stripe.Subscription | undefined;

        if (membership && userId) {
          const updateData: Record<string, unknown> = { membership };
          if (session.customer) {
            updateData.stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          }
          if (subscription) {
            updateData.stripeSubscriptionId = subscription.id;
            updateData.subscriptionStartDate = new Date(subscription.current_period_start * 1000);
            updateData.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          }
          await db.update(profiles).set(updateData).where(eq(profiles.clerkUserId, userId));
          console.log(`Updated membership for ${userId} to ${membership}`, updateData);
        } else {
          console.log("Checkout session completed without user metadata", session.id);
        }
        break;
      }
      case "invoice.payment_failed": {
        console.log("Invoice payment failed", event.data.object);
        break;
      }
      default: {
        console.log(`Unhandled event type ${event.type}`);
      }
    }
    return new NextResponse("Received", { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }
}
