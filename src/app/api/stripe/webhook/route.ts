import type Stripe from "stripe";
import { NextResponse } from "next/server";
import getStripe, { syncMembershipFromSubscription } from "~/server/stripe";

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

    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionRef = session.subscription;

        if (!userId || !subscriptionRef) {
          console.log("⚠️ Checkout session completed without user metadata or subscription", session.id);
          break;
        }

        // The webhook payload only ever carries the subscription as a string
        // ID — it must be retrieved separately to get plan/period details.
        const subscription =
          typeof subscriptionRef === "string"
            ? await stripe.subscriptions.retrieve(subscriptionRef)
            : subscriptionRef;

        await syncMembershipFromSubscription(subscription, userId);
        console.log(`✅ Synced membership for ${userId} from checkout session ${session.id}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncMembershipFromSubscription(subscription);
        console.log(`✅ Synced membership for subscription ${subscription.id} (${event.type})`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncMembershipFromSubscription(subscription);
        console.log(`✅ Synced membership after cancellation for subscription ${subscription.id}`);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        // Intentionally a no-op: entitlement is driven entirely by the
        // subscription's own status (handled above), which Stripe transitions
        // through past_due -> canceled/unpaid on repeated payment failure.
        // Duplicating that logic here would just be two sources of truth.
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? "unknown");
        console.log(`ℹ️ ${event.type} for customer ${customerId} (no action needed)`);
        break;
      }

      default: {
        console.log(`ℹ️ Unhandled event type ${event.type}`);
      }
    }

    return new NextResponse("Received", { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Webhook error:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }
}
