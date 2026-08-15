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
    
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const membership = session.metadata?.membership as "pro" | "team" | undefined;
        const userId = session.metadata?.userId;

        const subscription = session.subscription as string | Stripe.Subscription | null | undefined;

        if (membership && userId) {
          const updateData: Record<string, unknown> = { membership };
          
          if (session.customer) {
            updateData.stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          }

          if (subscription && typeof subscription !== 'string') {
            updateData.stripeSubscriptionId = subscription.id;

            const subscriptionItem = subscription.items?.data[0];

            updateData.subscriptionStartDate = subscriptionItem?.current_period_start
              ? new Date(subscriptionItem.current_period_start * 1000)
              : new Date();

            updateData.subscriptionEndDate = subscriptionItem?.current_period_end
              ? new Date(subscriptionItem.current_period_end * 1000)
              : new Date();
          }

          await db.update(profiles).set(updateData).where(eq(profiles.clerkUserId, userId));
          console.log(`✅ Updated membership for ${userId} to ${membership}`, updateData);
        } else {
          console.log("⚠️ Checkout session completed without user metadata", session.id);
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        console.log(`✅ Invoice payment succeeded for customer ${customerId}`);
        // You could update subscription end dates here if needed
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        console.log(`❌ Invoice payment failed for customer ${customerId}`);
        
        // Optionally downgrade user to free tier or send notification
        // This would require looking up the user by stripeCustomerId
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        
        console.log(`🗑️ Subscription deleted for customer ${customerId}`);
        
        // Downgrade user to free tier
        try {
          const result = await db.select()
            .from(profiles)
            .where(eq(profiles.stripeCustomerId, customerId))
            .limit(1);
          
          if (result.length > 0) {
            const profile = result[0];
            if (profile?.clerkUserId) {
              await db.update(profiles)
                .set({ 
                  membership: "free",
                  stripeSubscriptionId: null,
                  subscriptionEndDate: null
                })
                .where(eq(profiles.clerkUserId, profile.clerkUserId));
              console.log(`✅ Downgraded user ${profile.clerkUserId} to free tier`);
            }
          }
        } catch (error) {
          console.error("Failed to downgrade user:", error);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        
        console.log(`🔄 Subscription updated for customer ${customerId}`);
        
        // Update subscription end dates
        try {
          const result = await db.select()
            .from(profiles)
            .where(eq(profiles.stripeCustomerId, customerId))
            .limit(1);
          
          if (result.length > 0 && subscription.items?.data[0]) {
            const profile = result[0];
            if (profile?.clerkUserId) {
              const subscriptionItem = subscription.items.data[0];
              await db.update(profiles)
                .set({
                  subscriptionStartDate: new Date(subscriptionItem.current_period_start * 1000),
                  subscriptionEndDate: new Date(subscriptionItem.current_period_end * 1000)
                })
                .where(eq(profiles.clerkUserId, profile.clerkUserId));
              console.log(`✅ Updated subscription dates for user ${profile.clerkUserId}`);
            }
          }
        } catch (error) {
          console.error("Failed to update subscription dates:", error);
        }
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