import Stripe from "stripe";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  return new Stripe(secret, { apiVersion: "2026-05-27.dahlia" });
}

export default getStripe;

export type PaidMembership = "pro" | "team";

/**
 * Maps a Stripe price ID to the membership tier it grants. Built from the
 * public price env vars so the client and server stay in sync. The membership
 * is derived on the server so the client can never tamper with which tier a
 * checkout grants.
 */
export function getPriceMembershipMap(): Record<string, PaidMembership> {
  const map: Record<string, PaidMembership> = {};
  const proPrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const teamPrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM;
  if (proPrice) map[proPrice] = "pro";
  if (teamPrice) map[teamPrice] = "team";
  return map;
}

/**
 * The app's own origin, for building Stripe redirect/return URLs. Never derived
 * from request headers (Host/X-Forwarded-Host are client-controllable) — only a
 * fixed, developer-configured value is trusted here.
 */
export function resolveOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);
const DOWNGRADE_STATUSES = new Set<Stripe.Subscription.Status>([
  "canceled",
  "unpaid",
  "incomplete_expired",
]);

/**
 * Single source of truth for reflecting a Stripe subscription's current state
 * onto a profile. Idempotent by design (it only ever sets fields to the
 * subscription's current values), so it's safe to call from multiple webhook
 * events without a processed-events table.
 *
 * `past_due` / `incomplete` are treated as a grace period and intentionally
 * leave `membership` untouched — Stripe will move the subscription to either
 * `active` (payment recovered) or `canceled`/`unpaid` (grace period exhausted),
 * both of which this function does react to.
 *
 * `clerkUserId` is only known directly right after checkout (from the session's
 * metadata); every later webhook only carries the Stripe customer ID, so this
 * resolves it from `profiles.stripeCustomerId` when not provided.
 */
export async function syncMembershipFromSubscription(
  subscription: Stripe.Subscription,
  clerkUserId?: string,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const targetUserId =
    clerkUserId ??
    (await db
      .select({ clerkUserId: profiles.clerkUserId })
      .from(profiles)
      .where(eq(profiles.stripeCustomerId, customerId))
      .then((rows) => rows[0]?.clerkUserId));

  if (!targetUserId) {
    console.error(`syncMembershipFromSubscription: no profile found for Stripe customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const mappedMembership = priceId ? getPriceMembershipMap()[priceId] : undefined;
  const subscriptionItem = subscription.items.data[0];

  const updateData: Record<string, unknown> = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStartDate: subscriptionItem?.current_period_start
      ? new Date(subscriptionItem.current_period_start * 1000)
      : null,
    subscriptionEndDate: subscriptionItem?.current_period_end
      ? new Date(subscriptionItem.current_period_end * 1000)
      : null,
  };

  if (ACTIVE_STATUSES.has(subscription.status) && mappedMembership) {
    updateData.membership = mappedMembership;
  } else if (DOWNGRADE_STATUSES.has(subscription.status)) {
    updateData.membership = "free";
    updateData.stripeSubscriptionId = null;
    updateData.subscriptionEndDate = null;
  }
  // past_due / incomplete / other statuses: leave membership as-is (grace period).

  await db.update(profiles).set(updateData).where(eq(profiles.clerkUserId, targetUserId));
}
