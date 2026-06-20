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

        if (membership && userId) {
          await db.update(profiles).set({ membership }).where(eq(profiles.clerkUserId, userId));
          console.log(`Updated membership for ${userId} to ${membership}`);
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
