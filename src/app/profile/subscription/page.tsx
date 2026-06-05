"use client";

import { useState } from "react";

type Plan = { key: string; name: string; price: string; priceId?: string };

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans: Plan[] = [
    { key: "free", name: "Free", price: "$0/month", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE },
    { key: "pro", name: "Pro", price: "$10/month", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO },
    { key: "team", name: "Team", price: "$30/month", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM },
  ];

  type CheckoutResponse = {
    url?: string;
    error?: string;
  };

  const createCheckout = async (priceId?: string) => {
    setError(null);
    if (!priceId) {
      setError("Price ID not configured. Please set environment variables.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Checkout creation failed: ${res.status}`);
      }

      const data = (await res.json()) as CheckoutResponse;
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(data.error ?? "No checkout URL returned from server.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border bg-white/80 shadow-sm">
      <h1 className="text-2xl font-semibold">Subscription plans</h1>
      <p className="text-sm text-slate-600">Choose a plan to manage your membership. Payments go through Stripe.</p>

      {error ? <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.key} className="rounded-2xl border p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="text-sm text-slate-500">{plan.price}</p>
              </div>
            </div>

            <div className="mt-4">
              <button
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={() => void createCheckout(plan.priceId)}
                disabled={loading || !plan.priceId}
              >
                {plan.priceId ? (loading ? "Processing…" : "Choose plan") : "Not configured"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
