"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Insights {
  canSeeViewers: boolean;
  totalViews: number;
  days: { date: string; views: number }[];
  viewers: { userId: string | null; name: string; viewedOn: string }[] | null;
}

const weekday = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });

/** Owner-only: how many signed-in people looked at the project, and (Pro) who. */
export default function ProjectInsights({ projectId }: { projectId: number }) {
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

  if (failed) return null;

  const max = Math.max(1, ...(insights?.days.map((day) => day.views) ?? [1]));
  const weekTotal = insights?.days.reduce((sum, day) => sum + day.views, 0) ?? 0;

  return (
    <div>
      <p className="label-eyebrow">Insights</p>
      <div className="card-raised !transform-none mt-4 p-5">
        {insights === null ? (
          <div className="h-32 animate-pulse rounded-xl bg-dark-tertiary" />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-fg">{insights.totalViews}</p>
                <p className="text-sm text-fg-secondary">
                  {insights.totalViews === 1 ? "person has" : "people have"} viewed this project
                  {weekTotal > 0 ? ` (${weekTotal} in the last 7 days)` : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 flex h-28 items-end gap-2" aria-hidden="true">
              {insights.days.map((day, index) => (
                <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span
                    className={`w-full rounded-md ${index === insights.days.length - 1 ? "bg-accent-blue" : "bg-accent-blue/30"}`}
                    style={{ height: `${Math.max(day.views === 0 ? 4 : 10, (day.views / max) * 100)}%` }}
                    title={`${day.views} view${day.views === 1 ? "" : "s"}`}
                  />
                  <span className="text-[10px] text-dark-muted">{weekday(day.date)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-dark-subtle pt-4">
              {insights.canSeeViewers && insights.viewers ? (
                insights.viewers.length === 0 ? (
                  <p className="text-sm text-fg-secondary">No one has viewed it yet. A Boost can help.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {insights.viewers.map((viewer, index) => (
                      <li key={`${viewer.viewedOn}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        {viewer.userId ? (
                          <Link href={`/profile/${encodeURIComponent(viewer.userId)}`} className="min-w-0 truncate font-medium text-fg hover:text-accent-blue">
                            {viewer.name}
                          </Link>
                        ) : (
                          <span className="min-w-0 truncate text-fg-secondary">{viewer.name}</span>
                        )}
                        <span className="shrink-0 text-xs text-dark-muted">{new Date(`${viewer.viewedOn}T12:00:00`).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-sm text-fg-secondary">
                  Want to know who is looking?{" "}
                  <Link href="/profile/subscription" className="font-semibold text-accent-blue hover:underline">
                    Pro shows who viewed your project
                  </Link>
                  , so you can reach out first.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
