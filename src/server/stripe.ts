import Stripe from "stripe";

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  return new Stripe(secret, { apiVersion: "2026-05-27.dahlia" });
}

export default getStripe;
