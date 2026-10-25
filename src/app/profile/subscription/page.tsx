"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SubscriptionSkeleton } from "~/app/_components/Skeleton";
import { normalizeMembership, type Membership } from "~/lib/membership";
import {
  formatPrice,
  PRICING,
  PRO_YEARLY_PER_MONTH,
  PRO_YEARLY_SAVINGS,
  PRO_YEARLY_SAVINGS_PERCENT,
} from "~/lib/pricing";

type Billing = "monthly" | "yearly";

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
  membership?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
};

type OwnProject = {
  id: number;
  name: string;
  isPublic: boolean;
  boostedUntil?: string | null;
  featured?: boolean;
};

// NEXT_PUBLIC_STRIPE_PRICE_PRO is the original name of the monthly price, still set in production.
const PRICE_PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
const PRICE_PRO_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY;
const BOOST_AVAILABLE = Boolean(process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST);

const Check = () => (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Features({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-sm text-fg">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <Check />
          {item}
        </li>
      ))}
    </ul>
  );
}

const formatDate = (date: Date | null) =>
  date ? date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

function SubscriptionPageContent() {
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [membership, setMembership] = useState<Membership>("free");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionData | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [boostApplied, setBoostApplied] = useState(false);
  const [subscriptionStart, setSubscriptionStart] = useState<Date | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null);
  const [boostPickerOpen, setBoostPickerOpen] = useState(false);
  const [ownProjects, setOwnProjects] = useState<OwnProject[] | null>(null);

  // Current cycle, inferred from the length of the current billing period.
  const currentCycle: Billing | null = useMemo(() => {
    if (membership !== "pro" || !subscriptionStart || !subscriptionEnd) return null;
    const days = (subscriptionEnd.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24);
    return days > 60 ? "yearly" : "monthly";
  }, [membership, subscriptionStart, subscriptionEnd]);

  const daysUntilRenewal = useMemo(() => {
    if (!subscriptionEnd) return null;
    const days = Math.ceil((subscriptionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  }, [subscriptionEnd]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unable to load profile");
        const data = (await res.json()) as ProfileResponse;
        setMembership(normalizeMembership(data.membership));
        if (data.subscriptionStartDate) setSubscriptionStart(new Date(data.subscriptionStartDate));
        if (data.subscriptionEndDate) setSubscriptionEnd(new Date(data.subscriptionEndDate));
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };

    void loadProfile();
  }, []);

  // Back from Stripe Checkout: confirm the session (subscription or Boost).
  useEffect(() => {
    const sessionId = searchParams.get("session_id") ?? searchParams.get("boost_session");
    if (!sessionId) return;
    const isBoost = searchParams.has("boost_session");

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

        if (data.payment_status === "paid") {
          if (isBoost) setBoostApplied(true);
          else if (data.metadata?.membership === "pro") setMembership("pro");
        }
      } catch (err: unknown) {
        setSessionError(err instanceof Error ? err.message : String(err));
      }
    };

    void loadSession();
  }, [searchParams]);

  const postCheckout = async (payload: Record<string, unknown>) => {
    setError(null);
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      const data = (await res.json()) as { url?: string; updated?: boolean };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      if (data?.updated) {
        window.location.reload();
        return;
      }

      throw new Error("No checkout URL returned from server.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const startProCheckout = (cycle: Billing) => {
    const priceId = cycle === "yearly" ? PRICE_PRO_YEARLY : PRICE_PRO_MONTHLY;
    if (!priceId) {
      setError("This plan is not available for checkout yet.");
      return;
    }
    void postCheckout({ priceId });
  };

  const openBoostPicker = async () => {
    setBoostPickerOpen(true);
    if (ownProjects) return;
    try {
      const res = await fetch("/api/projects?mode=own&limit=100");
      const data = (await res.json()) as OwnProject[];
      setOwnProjects(Array.isArray(data) ? data : []);
    } catch {
      setOwnProjects([]);
      setError("Couldn't load your projects. Please try again.");
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
          <h1 className="text-2xl font-semibold text-fg mb-4">Sign in to manage your membership</h1>
          <p className="text-fg-secondary">You need to be signed in to view your plan.</p>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return <SubscriptionSkeleton />;
  }

  const isPro = membership === "pro";
  const proPrice = billing === "yearly" ? PRICING.proYearly : PRICING.proMonthly;
  const proSelectedIsCurrent = isPro && currentCycle === billing;
  const periodWord = billing === "yearly" ? "year" : "month";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 pt-20">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
          <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Settings
      </Link>

      <section className="text-center">
        <p className="label-eyebrow justify-center">Membership</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg">Choose your plan</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-fg-secondary">
          Free gets you started. Pro and Boost help the right people find your projects faster.
        </p>

        <div role="radiogroup" aria-label="Billing period" className="mt-6 inline-flex rounded-full bg-dark-tertiary p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={billing === option}
              onClick={() => setBilling(option)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                billing === option ? "bg-dark-primary text-fg shadow-sm" : "text-fg-secondary hover:text-fg"
              }`}
            >
              {option === "monthly" ? "Monthly" : "Yearly"}
              {option === "yearly" ? (
                <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">
                  Save {PRO_YEARLY_SAVINGS_PERCENT}%
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {isPro ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              disabled={portalLoading}
              className="btn-secondary !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Manage billing"}
            </button>
          </div>
        ) : null}
      </section>

      {sessionStatus ? (
        <div className="rounded-2xl bg-success-bg p-5 text-fg">
          <p className="text-sm font-semibold">
            {boostApplied ? "Your project is boosted" : "Checkout completed"}
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            {boostApplied
              ? `It now sits at the top of Explore for ${PRICING.boostDays} days with a Featured label.`
              : "Your Stripe checkout was processed successfully."}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Payment status</p>
              <p className="mt-1 font-medium">{sessionStatus.payment_status ?? "unknown"}</p>
            </div>
            {!boostApplied ? (
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Subscription status</p>
                <p className="mt-1 font-medium">{sessionStatus.subscription?.status ?? "pending"}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Email</p>
              <p className="mt-1 font-medium">{sessionStatus.customer_email ?? "unknown"}</p>
            </div>
          </div>
        </div>
      ) : sessionError ? (
        <div className="rounded-2xl bg-danger-bg p-5 text-danger">
          <p className="font-semibold">Unable to verify checkout session</p>
          <p className="mt-2 text-sm">{sessionError}</p>
        </div>
      ) : null}

      {isPro && (subscriptionStart ?? subscriptionEnd) ? (
        <div className="rounded-2xl border border-dark-subtle bg-dark-card p-5 text-fg">
          <p className="text-sm font-semibold">Your Pro subscription</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {subscriptionStart ? (
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Started</p>
                <p className="mt-1 font-medium">{formatDate(subscriptionStart)}</p>
              </div>
            ) : null}
            {subscriptionEnd ? (
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Renews</p>
                <p className="mt-1 font-medium">{formatDate(subscriptionEnd)}</p>
              </div>
            ) : null}
            {daysUntilRenewal !== null ? (
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-dark-muted">Days left</p>
                <p className="mt-1 text-lg font-medium">{daysUntilRenewal}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-2xl bg-danger-bg p-4 text-sm text-danger">{error}</div> : null}

      <section className="grid items-stretch gap-5 md:grid-cols-3">
        {/* Free */}
        <div className="card-raised !transform-none flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Free</h2>
            {!isPro ? (
              <span className="rounded-full bg-success-bg px-3 py-1 text-[11px] font-semibold text-success">Your plan</span>
            ) : null}
          </div>
          <div>
            <p className="text-[40px] font-bold leading-none text-fg">
              {PRICING.currencySymbol}0 <span className="text-sm font-normal text-fg-secondary">per {periodWord}</span>
            </p>
            <p className="mt-2 text-xs text-dark-muted">Free forever</p>
          </div>
          <p className="text-sm text-fg-secondary">Everything you need to start your first projects.</p>
          {isPro ? (
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              disabled={portalLoading}
              className="btn-secondary w-full disabled:opacity-50"
            >
              Switch to Free
            </button>
          ) : (
            <button type="button" disabled className="btn-secondary w-full cursor-default opacity-70">
              Current plan
            </button>
          )}
          <div className="h-px bg-dark-subtle" />
          <Features
            items={[
              `${PRICING.freeProjects} active projects`,
              "Apply to any project",
              "Public profile",
              "See how many people viewed your project",
              "Basic support",
            ]}
          />
        </div>

        {/* Pro */}
        <div className="relative flex flex-col gap-5 rounded-2xl border-2 border-[var(--btn-primary-bg)] bg-dark-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Pro</h2>
            <span className="rounded-full bg-accent-blue/12 px-3 py-1 text-[11px] font-semibold text-accent-blue">Recommended</span>
          </div>
          <div>
            <p className="text-[40px] font-bold leading-none text-fg">
              {formatPrice(proPrice)} <span className="text-sm font-normal text-fg-secondary">per {periodWord}</span>
            </p>
            <p className="mt-2 text-xs font-medium text-success">
              {billing === "yearly"
                ? `That's ${formatPrice(PRO_YEARLY_PER_MONTH)} a month. You save ${formatPrice(PRO_YEARLY_SAVINGS)}.`
                : `or ${formatPrice(PRICING.proYearly)} per year, which is ${formatPrice(PRO_YEARLY_PER_MONTH)} a month`}
            </p>
          </div>
          <p className="text-sm text-fg-secondary">For people who want the right teammates to find them faster.</p>
          <button
            type="button"
            onClick={() => startProCheckout(billing)}
            disabled={loading || proSelectedIsCurrent}
            className={
              proSelectedIsCurrent
                ? "btn-secondary w-full cursor-default"
                : "btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {proSelectedIsCurrent
              ? "Your current plan"
              : isPro
                ? `Switch to ${billing} billing`
                : "Upgrade to Pro"}
          </button>
          <div className="h-px bg-dark-subtle" />
          <Features
            items={[
              "Everything in Free",
              "Unlimited projects",
              "See who viewed your projects",
              "Featured placement in Explore",
              "Verified badge on your profile",
              "Priority support",
            ]}
          />
        </div>

        {/* Boost */}
        <div className="card-raised !transform-none flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-fg">
              <svg className="h-4 w-4 text-accent-blue" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
              </svg>
              Boost
            </h2>
            <span className="rounded-full bg-dark-tertiary px-3 py-1 text-[11px] font-semibold text-fg-secondary">One time</span>
          </div>
          <div>
            <p className="text-[40px] font-bold leading-none text-fg">
              {formatPrice(PRICING.boost)} <span className="text-sm font-normal text-fg-secondary">per project</span>
            </p>
            <p className="mt-2 text-xs text-dark-muted">One time payment, no subscription</p>
          </div>
          <p className="text-sm text-fg-secondary">Push one project to the top of Explore for {PRICING.boostDays} days.</p>
          <button
            type="button"
            onClick={() => void openBoostPicker()}
            disabled={!BOOST_AVAILABLE || loading}
            className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {BOOST_AVAILABLE ? "Boost a project" : "Coming soon"}
          </button>
          <div className="h-px bg-dark-subtle" />
          <Features
            items={[
              `Top of Explore and search for ${PRICING.boostDays} days`,
              "“Featured” label on your project",
              "Works on Free and Pro",
              "See the extra views in Insights",
            ]}
          />
        </div>
      </section>

      {boostPickerOpen ? (
        <section className="card-raised !transform-none p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-fg">Which project should we boost?</h2>
              <p className="mt-1 text-sm text-fg-secondary">
                {formatPrice(PRICING.boost)} one time. It goes to the top of Explore for {PRICING.boostDays} days. Boosting a project that is already boosted adds another {PRICING.boostDays} days.
              </p>
            </div>
            <button type="button" onClick={() => setBoostPickerOpen(false)} className="text-sm font-semibold text-fg-secondary hover:text-fg">
              Close
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {ownProjects === null ? (
              <p className="text-sm text-fg-secondary">Loading your projects...</p>
            ) : ownProjects.length === 0 ? (
              <p className="text-sm text-fg-secondary">
                You don&apos;t have any projects yet.{" "}
                <Link href="/?create=true" className="font-semibold text-accent-blue hover:underline">
                  Post your idea
                </Link>{" "}
                first.
              </p>
            ) : (
              ownProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dark-subtle bg-dark-tertiary px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{project.name}</p>
                    <p className="text-xs text-dark-muted">
                      {!project.isPublic
                        ? "Private projects can't be boosted"
                        : project.featured && project.boostedUntil
                          ? `Boosted until ${formatDate(new Date(project.boostedUntil))}`
                          : "Not boosted"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!project.isPublic || loading}
                    onClick={() => void postCheckout({ type: "boost", projectId: project.id })}
                    className="btn-primary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Boost
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-dark-secondary p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Get seen faster", body: "Pro and Boost put your projects in front of more people." },
            { title: "Know who's interested", body: "Pro shows who viewed your project, so you can reach out first." },
            { title: "Secure payments", body: "Checkout is handled by Stripe. Your card details are never stored on Kvelpo." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-semibold text-fg">{item.title}</p>
              <p className="mt-1.5 text-sm text-fg-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <main className="bg-dark-primary">
      <Suspense fallback={<div className="p-10 text-center text-fg">Loading membership...</div>}>
        <SubscriptionPageContent />
      </Suspense>
    </main>
  );
}
