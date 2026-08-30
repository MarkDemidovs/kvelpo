"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SubscriptionSkeleton } from "~/app/_components/Skeleton";

type MembershipType = "free" | "pro" | "team";

type Plan = {
  key: MembershipType;
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
};

type SessionData = {
  status: string;
  payment_status: string | null;
  subscription: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
  } | null;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  metadata: Record<string, string> | null;
};

type ProfileResponse = {
  membership?: MembershipType;
  stripeSubscriptionId?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
};

function SubscriptionPageContent() {
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [membership, setMembership] = useState<MembershipType>("free");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionData | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [subscriptionStart, setSubscriptionStart] = useState<Date | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);

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
        highlight: true,
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

  const daysUntilRenewal = useMemo(() => {
    if (!subscriptionEnd) return null;
    const now = new Date();
    const diff = subscriptionEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  }, [subscriptionEnd]);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unable to load profile");
        const data = (await res.json()) as ProfileResponse;
        if (data.membership === "free" || data.membership === "pro" || data.membership === "team") {
          setMembership(data.membership);
        }
        if (data.subscriptionStartDate) {
          setSubscriptionStart(new Date(data.subscriptionStartDate));
        }
        if (data.subscriptionEndDate) {
          setSubscriptionEnd(new Date(data.subscriptionEndDate));
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setPageLoading(false);
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
        if (res.status === 401) {
          throw new Error("Please sign in to upgrade your plan.");
        }
        const text = await res.text();
        let message = text;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed?.error) message = parsed.error;
        } catch {
          // not JSON, keep raw text
        }
        throw new Error(message || `Checkout creation failed: ${res.status}`);
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

  const openBillingPortal = async () => {
    setError(null);
    try {
      setPortalLoading(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Unable to open billing portal: ${res.status}`);
      }

      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No billing portal URL returned from server.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPortalLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="card-raised p-10 text-center">
          <h1 className="text-2xl font-semibold text-dark-primary mb-4">Sign in to manage subscription</h1>
          <p className="text-dark-secondary">You need to be signed in to view your subscription details.</p>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return <SubscriptionSkeleton />;
  }

  return (
    <div className="space-y-7 p-4">
      <section className="card-raised p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-eyebrow">Subscription</p>
            <h1 className="mt-2.5 text-[30px] font-bold tracking-tight text-dark-primary">Manage your plan</h1>
            <p className="mt-1 max-w-2xl text-[15px] text-dark-secondary">
              Pick a plan that matches your workflow, then complete checkout securely with Stripe.
            </p>
          </div>

          {membership !== "free" ? (
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              disabled={portalLoading}
              className="btn-secondary shrink-0 !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Manage billing"}
            </button>
          ) : null}
        </div>

        {sessionStatus ? (
          <div className="mt-6 rounded-2xl bg-emerald-900/25 p-5 text-dark-primary">
            <p className="text-sm font-semibold">Checkout completed</p>
            <p className="mt-2 text-sm text-dark-secondary">Your Stripe checkout was processed successfully.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Payment status</p>
                <p className="mt-1 font-medium">{sessionStatus.payment_status ?? "unknown"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Subscription status</p>
                <p className="mt-1 font-medium">{sessionStatus.subscription?.status ?? "pending"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Email</p>
                <p className="mt-1 font-medium">{sessionStatus.customer_email ?? "unknown"}</p>
              </div>
            </div>
          </div>
        ) : sessionError ? (
          <div className="mt-6 rounded-2xl bg-red-900/25 p-5 text-red-400">
            <p className="font-semibold">Unable to verify checkout session</p>
            <p className="mt-2 text-sm text-red-300">{sessionError}</p>
          </div>
        ) : null}

        {membership !== "free" && (subscriptionStart || subscriptionEnd) ? (
          <div className="mt-6 rounded-2xl border border-dark-subtle bg-dark-tertiary p-5 text-dark-primary">
            <p className="text-sm font-semibold">Subscription details</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subscriptionStart ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Start date</p>
                  <p className="mt-1 font-medium">{formatDate(subscriptionStart)}</p>
                </div>
              ) : null}
              {subscriptionEnd ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Renewal date</p>
                  <p className="mt-1 font-medium">{formatDate(subscriptionEnd)}</p>
                </div>
              ) : null}
              {daysUntilRenewal !== null ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Days remaining</p>
                  <p className="mt-1 font-medium text-lg">{daysUntilRenewal}</p>
                </div>
              ) : null}
              {subscriptionEnd && daysUntilRenewal !== null && daysUntilRenewal <= 7 ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-red-400">⚠ Renews soon</p>
                  <p className="mt-1 font-medium text-red-400">Update payment method</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {error ? <div className="rounded-2xl bg-red-900/30 p-4 text-sm text-red-400">{error}</div> : null}

          <div className="grid gap-5 sm:grid-cols-3 sm:items-stretch">
            {plans.map((plan) => {
              const isCurrent = plan.key === membership;
              return (
                <div
                  key={plan.key}
                  className={`card-raised relative flex flex-col gap-5 p-6 ${plan.highlight ? "!border-accent-blue sm:-translate-y-2.5" : ""}`}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent-blue px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
                      Most popular
                    </span>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-dark-primary">{plan.name}</h2>
                      <p className="mt-2.5 text-[28px] font-bold text-dark-primary">{plan.price}</p>
                    </div>
                    {isCurrent ? (
                      <span className="shrink-0 rounded-full bg-dark-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-dark-muted">Current</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-dark-secondary">{plan.description}</p>
                  <div className="h-px bg-dark-subtle" />
                  <ul className="flex flex-1 flex-col gap-2.5 text-sm text-dark-secondary">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    className={isCurrent ? "btn-secondary w-full cursor-default" : "btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"}
                    onClick={() => void createCheckout(plan.priceId)}
                    disabled={loading || isCurrent || !plan.priceId}
                  >
                    {isCurrent ? "Your current plan" : plan.priceId ? `Upgrade to ${plan.name}` : "Not available"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-raised p-6">
          <p className="label-eyebrow">Why upgrade?</p>
          <div className="mt-5 space-y-5 text-sm text-dark-secondary">
            <div>
              <p className="font-semibold text-dark-primary">More projects, more control</p>
              <p className="mt-2">Pro and Team plans increase your project limits and let you keep multiple active listings.</p>
            </div>
            <div>
              <p className="font-semibold text-dark-primary">Professional presentation</p>
              <p className="mt-2">Upgrade to remove basic restrictions and get access to advanced profile and sharing features.</p>
            </div>
            <div>
              <p className="font-semibold text-dark-primary">Secure Stripe billing</p>
              <p className="mt-2">Checkout is handled by Stripe, and your card information is never stored on this app.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 bg-dark-primary">
      <Suspense fallback={<div className="p-10 text-center text-dark-primary">Loading Subscription Details...</div>}>
        <SubscriptionPageContent />
      </Suspense>
    </main>
  );
}
