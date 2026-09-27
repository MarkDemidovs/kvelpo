import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { moderationActions, profiles, reports, supportMessages } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";
import { AdminUserActions } from "~/app/_components/AdminControls";

export const metadata: Metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const formatDate = (date: Date) =>
  date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Riga" });

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  edit: { label: "Edited project", className: "text-dark-primary" },
  delete: { label: "Deleted project", className: "text-red-400" },
  warn: { label: "Warned", className: "text-yellow-400" },
  ban: { label: "Banned", className: "text-red-400" },
  unban: { label: "Unbanned", className: "text-emerald-400" },
};

export default async function AdminPanelPage() {
  if (!(await getAdminUserId())) {
    notFound();
  }

  const [[openReports], [openSupport], bannedUsers, log] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open")),
    db.select({ count: sql<number>`count(*)::int` }).from(supportMessages).where(eq(supportMessages.status, "open")),
    db
      .select({ clerkUserId: profiles.clerkUserId, fullName: profiles.fullName, bannedAt: profiles.bannedAt, bannedReason: profiles.bannedReason })
      .from(profiles)
      .where(isNotNull(profiles.bannedAt))
      .orderBy(desc(profiles.bannedAt)),
    db.select().from(moderationActions).orderBy(desc(moderationActions.createdAt)).limit(100),
  ]);

  const userIds = [...new Set(log.flatMap((entry) => [entry.adminClerkUserId, entry.targetClerkUserId ?? ""]).filter(Boolean))];
  const names = new Map(
    (userIds.length
      ? await db.select({ id: profiles.clerkUserId, name: profiles.fullName }).from(profiles).where(inArray(profiles.clerkUserId, userIds))
      : []
    ).map((row) => [row.id, row.name?.trim() ?? ""]),
  );
  const nameOf = (id: string) => names.get(id) ?? `${id.slice(0, 14)}…`;

  const tiles = [
    { href: "/admin/reports", label: "Open reports", count: openReports?.count ?? 0, accent: "text-red-400" },
    { href: "/admin/support", label: "Open support messages", count: openSupport?.count ?? 0, accent: "text-accent-blue" },
    { href: "#banned", label: "Banned users", count: bannedUsers.length, accent: "text-dark-primary" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Admin panel</h1>
      <p className="mt-2 text-dark-secondary">
        Moderate from any project or profile using the yellow Admin bar (edit, delete, warn, ban). Everything done there is
        logged below.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="card-raised p-5 transition hover:border-accent-blue">
            <p className={`text-3xl font-bold ${tile.accent}`}>{tile.count}</p>
            <p className="mt-1 text-sm text-dark-secondary">{tile.label}</p>
          </Link>
        ))}
      </div>

      <section id="banned" className="mt-10 scroll-mt-24">
        <p className="label-eyebrow">Banned users</p>
        {bannedUsers.length === 0 ? (
          <div className="card-raised mt-4 p-6 text-sm text-dark-secondary">Nobody is banned.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {bannedUsers.map((user) => {
              const label = user.fullName?.trim() ? user.fullName.trim() : "Unnamed user";
              return (
                <li key={user.clerkUserId} className="card-raised flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-1">
                    <Link href={`/profile/${encodeURIComponent(user.clerkUserId)}`} className="font-semibold text-dark-primary hover:text-accent-blue">
                      {label}
                    </Link>
                    <p className="text-xs text-dark-muted">Banned {user.bannedAt ? formatDate(user.bannedAt) : ""}</p>
                    {user.bannedReason ? <p className="text-sm text-dark-secondary">{user.bannedReason}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminUserActions userId={user.clerkUserId} userLabel={label} banned />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <p className="label-eyebrow">Moderation log (last 100)</p>
        {log.length === 0 ? (
          <div className="card-raised mt-4 p-6 text-sm text-dark-secondary">No admin actions yet.</div>
        ) : (
          <ul className="card-raised mt-4 divide-y divide-[#222]">
            {log.map((entry) => {
              const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, className: "text-dark-primary" };
              return (
                <li key={entry.id} className="px-5 py-3.5 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-dark-primary">{nameOf(entry.adminClerkUserId)}</span>
                    <span className={`font-semibold ${meta.className}`}>{meta.label.toLowerCase()}</span>
                    {entry.targetClerkUserId ? (
                      <Link href={`/profile/${encodeURIComponent(entry.targetClerkUserId)}`} className="text-dark-primary hover:text-accent-blue">
                        {nameOf(entry.targetClerkUserId)}
                      </Link>
                    ) : null}
                    {entry.projectName ? (
                      <span className="text-dark-secondary">
                        {entry.action === "delete" ? `"${entry.projectName}"` : (
                          <Link href={`/projects/${entry.projectId}`} className="hover:text-accent-blue">&quot;{entry.projectName}&quot;</Link>
                        )}
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-dark-muted">{formatDate(entry.createdAt)}</span>
                  </div>
                  {entry.reason ? <p className="mt-1 text-dark-secondary">{entry.reason}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
