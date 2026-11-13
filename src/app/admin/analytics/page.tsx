import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  applications,
  boostPurchases,
  dmMessages,
  messages,
  pageviewDaily,
  profiles,
  projects,
  projectViews,
} from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = 30;

type Point = { date: string; value: number };

const isoDay = (offsetDays: number) => new Date(Date.now() - offsetDays * DAY_MS).toISOString().slice(0, 10);

/** One value per day for the last RANGE_DAYS days (UTC), gaps filled with 0. */
function fillDays(rows: { day: string; value: number }[]): Point[] {
  const byDay = new Map(rows.map((row) => [row.day, row.value]));
  return Array.from({ length: RANGE_DAYS }, (_, index) => {
    const date = isoDay(RANGE_DAYS - 1 - index);
    return { date, value: byDay.get(date) ?? 0 };
  });
}

const sum = (points: Point[]) => points.reduce((total, point) => total + point.value, 0);
const last7 = (points: Point[]) => sum(points.slice(-7));
const previous7 = (points: Point[]) => sum(points.slice(-14, -7));

function Delta({ points }: { points: Point[] }) {
  const now = last7(points);
  const before = previous7(points);
  const diff = now - before;
  return (
    <p className={`mt-1.5 text-xs ${diff > 0 ? "text-success" : "text-dark-muted"}`}>
      {diff === 0 ? "Same as the week before" : `${diff > 0 ? "+" : ""}${diff} vs the week before`}
    </p>
  );
}

function BarChart({ title, points, note }: { title: string; points: Point[]; note?: string }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="rounded-2xl border border-dark-subtle p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-semibold text-fg">{title}</p>
        <p className="text-xs text-dark-muted">{sum(points)} in {RANGE_DAYS} days</p>
      </div>
      <div
        className="mt-5 flex h-32 items-end gap-[3px]"
        role="img"
        aria-label={`${title}, last ${RANGE_DAYS} days: ${points.map((point) => `${point.date} ${point.value}`).join(", ")}`}
      >
        {points.map((point, index) => (
          <span
            key={point.date}
            className={`min-w-0 flex-1 rounded-sm ${index === points.length - 1 ? "bg-accent-blue" : "bg-accent-blue/30"}`}
            style={{ height: `${Math.max(point.value === 0 ? 3 : 8, (point.value / max) * 100)}%` }}
            title={`${point.date}: ${point.value}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-dark-muted">
        <span>{points[0]?.date.slice(5)}</span>
        <span>Today (UTC)</span>
      </div>
      {note ? <p className="mt-3 text-xs text-dark-muted">{note}</p> : null}
    </div>
  );
}

function Stat({ label, value, children }: { label: string; value: string | number; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-dark-secondary p-5">
      <p className="text-xs text-fg-secondary">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none text-fg">{value}</p>
      {children}
    </div>
  );
}

function TopList({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="rounded-2xl border border-dark-subtle p-5">
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-fg-secondary">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-fg">{row.label}</span>
                <span className="shrink-0 text-xs text-fg-secondary">{row.value}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-dark-tertiary">
                <div className="h-full rounded-full bg-accent-blue" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  if (!(await getAdminUserId())) {
    notFound();
  }

  const since = isoDay(RANGE_DAYS - 1);
  const sinceDate = new Date(`${since}T00:00:00Z`);

  const perDay = async (table: "profiles" | "projects" | "applications") => {
    const column = table === "profiles" ? profiles.createdAt : table === "projects" ? projects.createdAt : applications.createdAt;
    const source = table === "profiles" ? profiles : table === "projects" ? projects : applications;
    return db
      .select({ day: sql<string>`(${column} at time zone 'UTC')::date::text`, value: sql<number>`count(*)::int` })
      .from(source)
      .where(gte(column, sinceDate))
      .groupBy(sql`1`);
  };

  const [
    signupRows,
    projectRows,
    applicationRows,
    pageviewRows,
    viewRows,
    topPages,
    topReferrers,
    [totals],
    [boosts],
    [dms],
    [chat],
  ] = await Promise.all([
    perDay("profiles"),
    perDay("projects"),
    perDay("applications"),
    db
      .select({ day: sql<string>`${pageviewDaily.day}::text`, value: sql<number>`sum(${pageviewDaily.views})::int` })
      .from(pageviewDaily)
      .where(gte(pageviewDaily.day, since))
      .groupBy(pageviewDaily.day),
    db
      .select({ day: sql<string>`${projectViews.viewedOn}::text`, value: sql<number>`count(*)::int` })
      .from(projectViews)
      .where(gte(projectViews.viewedOn, since))
      .groupBy(projectViews.viewedOn),
    db
      .select({ label: pageviewDaily.path, value: sql<number>`sum(${pageviewDaily.views})::int` })
      .from(pageviewDaily)
      .where(gte(pageviewDaily.day, since))
      .groupBy(pageviewDaily.path)
      .orderBy(desc(sql`sum(${pageviewDaily.views})`))
      .limit(10),
    db
      .select({ label: pageviewDaily.referrer, value: sql<number>`sum(${pageviewDaily.views})::int` })
      .from(pageviewDaily)
      .where(and(gte(pageviewDaily.day, since), sql`${pageviewDaily.referrer} <> ''`))
      .groupBy(pageviewDaily.referrer)
      .orderBy(desc(sql`sum(${pageviewDaily.views})`))
      .limit(10),
    db
      .select({
        users: sql<number>`count(*)::int`,
        pro: sql<number>`count(*) filter (where ${inArray(profiles.membership, ["pro", "team"])})::int`,
      })
      .from(profiles),
    db
      .select({ count: sql<number>`count(*)::int`, cents: sql<number>`coalesce(sum(${boostPurchases.amountTotal}), 0)::int` })
      .from(boostPurchases),
    db.select({ count: sql<number>`count(*)::int` }).from(dmMessages),
    db.select({ count: sql<number>`count(*)::int` }).from(messages),
  ]);

  const publicProjects = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(eq(projects.isPublic, true), eq(projects.isDraft, false)));

  const signups = fillDays(signupRows);
  const newProjects = fillDays(projectRows);
  const newApplications = fillDays(applicationRows);
  const pageviews = fillDays(pageviewRows);
  const projectViewSeries = fillDays(viewRows);
  const countingStarted = pageviewRows.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="text-sm text-fg-secondary hover:text-fg">&larr; Admin panel</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg">Analytics</h1>
      <p className="mt-2 max-w-2xl text-fg-secondary">
        How kvelpo is doing, only for the team. Charts cover the last {RANGE_DAYS} days in UTC. Page views are counted
        anonymously: no cookies, no IP addresses, and visitors who send Do Not Track are left out.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Members" value={totals?.users ?? 0}>
          <Delta points={signups} />
        </Stat>
        <Stat label="Pro members" value={totals?.pro ?? 0}>
          <p className="mt-1.5 text-xs text-dark-muted">
            {totals && totals.users > 0 ? `${Math.round((totals.pro / totals.users) * 100)}% of members` : " "}
          </p>
        </Stat>
        <Stat label="Public projects" value={publicProjects[0]?.count ?? 0}>
          <Delta points={newProjects} />
        </Stat>
        <Stat label="Page views (7 days)" value={last7(pageviews)}>
          <Delta points={pageviews} />
        </Stat>
        <Stat label="Applications (7 days)" value={last7(newApplications)}>
          <Delta points={newApplications} />
        </Stat>
        <Stat label="Project views (7 days)" value={last7(projectViewSeries)}>
          <Delta points={projectViewSeries} />
        </Stat>
        <Stat label="Boosts sold" value={boosts?.count ?? 0}>
          <p className="mt-1.5 text-xs text-dark-muted">EUR {((boosts?.cents ?? 0) / 100).toFixed(2)} in total</p>
        </Stat>
        <Stat label="Messages sent" value={(dms?.count ?? 0) + (chat?.count ?? 0)}>
          <p className="mt-1.5 text-xs text-dark-muted">{dms?.count ?? 0} direct, {chat?.count ?? 0} team chat</p>
        </Stat>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <BarChart
          title="Page views"
          points={pageviews}
          note={countingStarted ? undefined : "Counting started recently, so this fills up as people visit."}
        />
        <BarChart title="New members" points={signups} />
        <BarChart title="New projects" points={newProjects} />
        <BarChart title="Applications" points={newApplications} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <TopList title={`Top pages, ${RANGE_DAYS} days`} rows={topPages} empty="No page views counted yet." />
        <TopList title={`Where visitors come from, ${RANGE_DAYS} days`} rows={topReferrers} empty="No outside referrers yet. Direct visits and clicks inside kvelpo are not listed." />
      </div>
    </main>
  );
}
