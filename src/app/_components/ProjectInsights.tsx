"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, PRICING } from "~/lib/pricing";

interface Insights {
  canSeeViewers: boolean;
  totalViews: number;
  days: { date: string; views: number }[];
  previousWeekViews: number;
  viewers: { userId: string | null; name: string; viewedOn: string }[] | null;
}

const weekday = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

interface Props {
  projectId: number;
  applications: number;
  pendingApplications: number;
  spotsFilled: number;
  spotsTotal: number;
  featured: boolean;
  onBoost: () => void;
}

/** Owner-only Insights tab: how many signed-in people looked at the project, and (Pro) who. */
export default function ProjectInsights({ projectId, applications, pendingApplications, spotsFilled, spotsTotal, featured, onBoost }: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/projects/${projectId}/insights`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Insights>) : Promise.reject(new Error(String(res.status)))))
      .then(setInsights)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setFailed(true);
      });
    return () => controller.abort();
  }, [projectId]);

  if (failed) return <p className="rounded-2xl bg-dark-secondary p-6 text-sm text-fg-secondary">Insights couldn&apos;t be loaded. Please try again later.</p>;

  const weekTotal = insights?.days.reduce((sum, day) => sum + day.views, 0) ?? 0;
  const max = Math.max(1, ...(insights?.days.map((day) => day.views) ?? [1]));
  const delta = insights ? weekTotal - insights.previousWeekViews : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-dark-secondary p-5">
            <p className="text-xs text-fg-secondary">Views this week</p>
            <p className="mt-2 text-[32px] font-bold leading-none text-fg">{insights ? weekTotal : "-"}</p>
            <p className={`mt-2 text-xs ${delta > 0 ? "text-success" : "text-dark-muted"}`}>
              {!insights ? " " : delta > 0 ? `${delta} more than last week` : delta < 0 ? `${-delta} fewer than last week` : "Same as last week"}
            </p>
          </div>
          <div className="rounded-2xl bg-dark-secondary p-5">
            <p className="text-xs text-fg-secondary">Applications</p>
            <p className="mt-2 text-[32px] font-bold leading-none text-fg">{applications}</p>
            <p className={`mt-2 text-xs ${pendingApplications > 0 ? "text-accent-blue" : "text-dark-muted"}`}>
              {pendingApplications > 0 ? `${pendingApplications} waiting for your reply` : "Nothing waiting"}
            </p>
          </div>
          <div className="rounded-2xl bg-dark-secondary p-5">
            <p className="text-xs text-fg-secondary">Spots filled</p>
            <p className="mt-2 text-[32px] font-bold leading-none text-fg">{spotsFilled} of {spotsTotal}</p>
            <p className="mt-2 text-xs text-dark-muted">Accept applicants to fill spots</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-subtle p-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-fg">Views, last 7 days</p>
            <p className="text-xs text-dark-muted">{insights?.totalViews ?? 0} total</p>
          </div>
          {insights === null ? (
            <div className="mt-5 h-32 animate-pulse rounded-xl bg-dark-tertiary" />
          ) : (
            <div className="mt-5 flex h-36 items-end gap-2 sm:gap-3" role="img" aria-label={`Views per day: ${insights.days.map((day) => `${weekday(day.date)} ${day.views}`).join(", ")}`}>
              {insights.days.map((day, index) => (
                <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span
                    className={`w-full rounded-lg ${index === insights.days.length - 1 ? "bg-accent-blue" : "bg-accent-blue/15"}`}
                    style={{ height: `${Math.max(day.views === 0 ? 4 : 10, (day.views / max) * 100)}%` }}
                    title={`${day.views} view${day.views === 1 ? "" : "s"}`}
                  />
                  <span className="text-[11px] text-dark-muted">{weekday(day.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dark-subtle p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-fg">Who viewed your project</p>
              <p className="mt-0.5 text-xs text-dark-muted">{weekTotal} {weekTotal === 1 ? "person" : "people"} this week</p>
            </div>
            <span className="rounded-full bg-[var(--btn-primary-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--btn-primary-fg)]">Pro</span>
          </div>

          {insights?.canSeeViewers && insights.viewers ? (
            insights.viewers.length === 0 ? (
              <p className="mt-4 text-sm text-fg-secondary">No one has viewed it yet. A Boost can help.</p>
            ) : (
              <ul className="mt-4 divide-y divide-dark-subtle">
                {insights.viewers.map((viewer, index) => (
                  <li key={`${viewer.viewedOn}-${index}`} className="flex items-center gap-3 py-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/12 text-[11px] font-semibold text-accent-blue">{initials(viewer.name)}</span>
                    {viewer.userId ? (
                      <Link href={`/profile/${encodeURIComponent(viewer.userId)}`} className="min-w-0 flex-1 truncate font-medium text-fg hover:text-accent-blue">{viewer.name}</Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-fg-secondary">{viewer.name}</span>
                    )}
                    <span className="shrink-0 text-xs text-dark-muted">{new Date(`${viewer.viewedOn}T12:00:00`).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="relative mt-4">
              <ul className="select-none space-y-3 blur-[5px]" aria-hidden="true">
                {["Laura Berzina", "Janis Ozols", "Elina Kalna", "Miranda P."].map((name) => (
                  <li key={name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/12 text-[11px] font-semibold text-accent-blue">{initials(name)}</span>
                    <span className="flex-1 text-fg">{name}</span>
                    <span className="text-xs text-dark-muted">Today</span>
                  </li>
                ))}
              </ul>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="mx-4 max-w-xs rounded-2xl border border-dark-subtle bg-dark-primary p-5 text-center shadow-[var(--shadow-card)]">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-dark-tertiary text-fg">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 118 0v3" />
                    </svg>
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-fg">See who&apos;s interested</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">Upgrade to Pro to see the names and skills of people who viewed your project.</p>
                  <Link href="/profile/subscription" className="btn-primary mt-4 !px-4 !py-2 text-[13px]">
                    Upgrade to Pro, {formatPrice(PRICING.proMonthly)} a month
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-[var(--btn-primary-bg)] p-6 text-[var(--btn-primary-fg)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
          </span>
          <p className="mt-4 text-lg font-semibold">{featured ? "Keep it at the top" : "Get more people to see this"}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            {featured
              ? `Boost again to add another ${PRICING.boostDays} days at the top of Explore.`
              : `Boost puts this project at the top of Explore for ${PRICING.boostDays} days, with a Featured label.`}
          </p>
          <p className="mt-4 text-2xl font-bold">{formatPrice(PRICING.boost)} <span className="text-xs font-normal opacity-70">one time</span></p>
          <button type="button" onClick={onBoost} className="mt-4 w-full rounded-full bg-[var(--bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:opacity-90">
            Boost for {formatPrice(PRICING.boost)}
          </button>
        </div>
        <div className="flex gap-3 rounded-2xl bg-dark-secondary p-4 text-sm text-fg-secondary">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
          </svg>
          Keep your description short and your roles specific. It helps people decide faster.
        </div>
      </div>
    </div>
  );
}
