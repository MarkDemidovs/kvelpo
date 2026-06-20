"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type MembershipType = "free" | "pro" | "team";

type Plan = {
  key: MembershipType;
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId?: string;
};

type SessionData = {
  status: string;
  payment_status: string | null;
  subscription: { id: string; status: string; current_period_end: number } | null;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  metadata: Record<string, string> | null;
};

type ProfileResponse = {
  membership?: MembershipType;
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [membership, setMembership] = useState<MembershipType>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionData | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const plans = useMemo<Plan[]>(
    () => [
      {
        key: "free",
        name: "Free",
        price: "$0/month",
        description: "Basic access for solo use with one active project.",
        features: ["Create up to 1 project", "Public profile", "Basic support"],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$10/month",
        description: "Good for power users who want more projects and priority access.",
        features: ["Create up to 3 projects", "Private profile options", "Priority support"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      },
      {
        key: "team",
        name: "Team",
        price: "$30/month",
        description: "For teams that need expanded collaboration and more projects.",
        features: ["Create up to 10 projects", "Team collaboration tools", "Dedicated support"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
      },
    ],
    []
  );

  const selectedPlan = useMemo(() => plans.find((plan) => plan.key === membership), [membership, plans]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unable to load profile");
        const data = (await res.json()) as ProfileResponse;
        if (data.membership === "free" || data.membership === "pro" || data.membership === "team") {
          setMembership(data.membership);
        }
      } catch (err: unknown) {
        console.error(err);
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      return;
    }

    const loadSession = async () => {
      try {
        setSessionError(null);
        const res = await fetch(`/api/stripe/session/${sessionId}`);
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `Session lookup failed: ${res.status}`);
        }

        const data = (await res.json()) as SessionData;
        setSessionStatus(data);

        const membershipValue = data.metadata?.membership;
        if (membershipValue === "free" || membershipValue === "pro" || membershipValue === "team") {
          if (data.payment_status === "paid") {
            setMembership(membershipValue);
          }
        }
      } catch (err: unknown) {
        setSessionError(err instanceof Error ? err.message : String(err));
      }
    };

    void loadSession();
  }, [searchParams]);

  const createCheckout = async (priceId?: string) => {
    setError(null);
    if (!priceId) {
      setError("This plan is not available for checkout yet.");
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

      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No checkout URL returned from server.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Subscription</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your membership</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Pick a plan that matches your workflow, then complete checkout securely with Stripe.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current plan</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{membership.toUpperCase()}</p>
            <p className="text-xs text-slate-500">{selectedPlan?.description}</p>
          </div>
        </div>

        {sessionStatus ? (
          <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-slate-900 shadow-inner">
            <p className="text-sm font-semibold">Checkout completed</p>
            <p className="mt-2 text-sm text-slate-600">Your Stripe checkout was processed successfully.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payment status</p>
                <p className="mt-1 font-medium">{sessionStatus.payment_status ?? "unknown"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Subscription status</p>
                <p className="mt-1 font-medium">{sessionStatus.subscription?.status ?? "pending"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Email</p>
                <p className="mt-1 font-medium">{sessionStatus.customer_email ?? "unknown"}</p>
              </div>
            </div>
          </div>
        ) : sessionError ? (
          <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-rose-900 shadow-inner">
            <p className="font-semibold">Unable to verify checkout session</p>
            <p className="mt-2 text-sm text-rose-700">{sessionError}</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.key === membership;
              return (
                <div key={plan.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{plan.price}</p>
                    </div>
                    {isCurrent ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Current</span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void createCheckout(plan.priceId)}
                    disabled={loading || isCurrent || !plan.priceId}
                  >
                    {isCurrent ? "Current plan" : plan.priceId ? "Choose plan" : "Not available"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Why upgrade?</p>
          <div className="mt-5 space-y-5 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">More projects, more control</p>
              <p className="mt-2">Pro and Team plans increase your project limits and let you keep multiple active listings.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Professional presentation</p>
              <p className="mt-2">Upgrade to remove basic restrictions and get access to advanced profile and sharing features.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Secure Stripe billing</p>
              <p className="mt-2">Checkout is handled by Stripe, and your card information is never stored on this app.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
