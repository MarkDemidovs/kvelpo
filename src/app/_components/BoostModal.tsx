"use client";

import { useEffect, useState } from "react";
import { formatPrice, PRICING } from "~/lib/pricing";

export interface BoostableProject {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  ownerName: string;
  openRoles: number;
}

/** "Boost your project": one-time Stripe payment that puts the project at the top of Explore. */
export default function BoostModal({ project, onClose }: { project: BoostableProject; onClose: () => void }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = Boolean(process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !paying) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, paying]);

  const pay = async () => {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "boost", projectId: project.id }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) throw new Error(data?.error ?? "Couldn't start checkout. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-scrim p-4 backdrop-blur-sm sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && !paying && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Boost your project" className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-dark-primary p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue/12 text-accent-blue">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
          </span>
          <button type="button" onClick={onClose} disabled={paying} aria-label="Close" className="rounded-full bg-dark-tertiary p-2 text-fg-secondary transition hover:text-fg">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-fg">Boost your project</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
          {project.name} moves to the top of Explore and search, with a Featured label.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-[var(--btn-primary-bg)] p-4">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-[6px] border-[var(--btn-primary-bg)]" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-fg">{PRICING.boostDays} days</p>
            <p className="text-xs text-fg-secondary">About a week at the top</p>
          </div>
          <p className="text-lg font-bold text-fg">{formatPrice(PRICING.boost)}</p>
        </div>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-muted">How it will look in Explore</p>
        <div className="mt-3 rounded-2xl border border-dark-subtle p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/12 text-[11px] font-semibold uppercase text-accent-blue">{project.ownerName.slice(0, 2)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{project.ownerName}</p>
              <p className="text-xs text-dark-muted">Posted recently</p>
            </div>
            <span className="rounded-full bg-accent-blue/12 px-2.5 py-1 text-[11px] font-semibold text-accent-blue">Featured</span>
          </div>
          <p className="mt-3 text-[16px] font-semibold text-fg">{project.name}</p>
          {project.description ? <p className="mt-1 line-clamp-2 text-sm text-fg-secondary">{project.description}</p> : null}
          {project.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-fg-secondary">{tag}</span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between border-t border-dark-subtle pt-3 text-[13px]">
            <span className="text-dark-muted">{project.openRoles} role{project.openRoles === 1 ? "" : "s"} open</span>
            <span className="font-semibold text-accent-blue">View project</span>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={paying} className="btn-secondary !px-5 !py-2.5 text-sm">
            Cancel
          </button>
          <button type="button" onClick={() => void pay()} disabled={paying || !available} className="btn-primary !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            {available ? (paying ? "Opening checkout..." : `Pay ${formatPrice(PRICING.boost)}`) : "Coming soon"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-dark-muted">One time payment through Stripe. No subscription.</p>
      </div>
    </div>
  );
}
