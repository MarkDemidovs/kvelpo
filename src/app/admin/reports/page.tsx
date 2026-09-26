import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { profiles, projects, reports } from "~/server/db/schema";
import { getAdminUserId } from "~/server/admin";
import { isReportReason, REPORT_REASONS } from "~/lib/reports";
import ReportStatusButton from "./ReportStatusButton";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

// Always read fresh data; this page is only for the admin.
export const dynamic = "force-dynamic";

type ReportRow = typeof reports.$inferSelect;

export default async function AdminReportsPage() {
  if (!(await getAdminUserId())) {
    notFound();
  }

  const [openReports, resolvedReports] = await Promise.all([
    db.select().from(reports).where(eq(reports.status, "open")).orderBy(desc(reports.createdAt)),
    db.select().from(reports).where(eq(reports.status, "resolved")).orderBy(desc(reports.resolvedAt)).limit(50),
  ]);
  const all = [...openReports, ...resolvedReports];

  // Look up names for everything referenced, in two queries.
  const projectIds = [...new Set(all.filter((r) => r.targetType === "project").map((r) => Number(r.targetId)))].filter(Number.isInteger);
  const userIds = [
    ...new Set([
      ...all.map((r) => r.reporterClerkUserId),
      ...all.filter((r) => r.targetType === "profile").map((r) => r.targetId),
    ]),
  ];
  const [projectRows, profileRows] = await Promise.all([
    projectIds.length
      ? db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds))
      : [],
    userIds.length
      ? db.select({ clerkUserId: profiles.clerkUserId, fullName: profiles.fullName }).from(profiles).where(inArray(profiles.clerkUserId, userIds))
      : [],
  ]);
  const projectNames = new Map(projectRows.map((p) => [String(p.id), p.name]));
  const userNames = new Map(profileRows.map((p) => [p.clerkUserId, p.fullName?.trim() ?? ""]));
  const userLabel = (id: string) => userNames.get(id) ?? `${id.slice(0, 14)}…`;

  // How many open reports each target has, to surface repeat offenders.
  const openCounts = new Map<string, number>();
  for (const r of openReports) {
    const key = `${r.targetType}:${r.targetId}`;
    openCounts.set(key, (openCounts.get(key) ?? 0) + 1);
  }

  const renderReport = (report: ReportRow) => {
    const isProject = report.targetType === "project";
    const targetName = isProject ? projectNames.get(report.targetId) : userLabel(report.targetId);
    const targetHref = isProject ? `/projects/${report.targetId}` : `/profile/${encodeURIComponent(report.targetId)}`;
    const openCount = openCounts.get(`${report.targetType}:${report.targetId}`) ?? 0;

    return (
      <li key={report.id} className="card-raised p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-900/40 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                {isReportReason(report.reason) ? REPORT_REASONS[report.reason] : report.reason}
              </span>
              <span className="text-xs uppercase tracking-wide text-dark-muted">{isProject ? "Project" : "Profile"}</span>
              {report.status === "open" && openCount > 1 ? (
                <span className="text-xs font-semibold text-yellow-400">{openCount} open reports</span>
              ) : null}
            </div>
            {targetName === undefined ? (
              <p className="text-[15px] font-semibold text-dark-muted">Deleted project #{report.targetId}</p>
            ) : (
              <Link href={targetHref} target="_blank" className="block truncate text-[15px] font-semibold text-dark-primary hover:text-accent-blue">
                {targetName} ↗
              </Link>
            )}
            {report.details ? <p className="whitespace-pre-line text-sm text-dark-secondary">{report.details}</p> : null}
            <p className="text-xs text-dark-muted">
              Reported by{" "}
              <Link href={`/profile/${encodeURIComponent(report.reporterClerkUserId)}`} target="_blank" className="hover:text-accent-blue">
                {userLabel(report.reporterClerkUserId)}
              </Link>{" "}
              on {report.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Riga" })}
              {report.resolvedAt
                ? ` · resolved ${report.resolvedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Riga" })}`
                : ""}
            </p>
          </div>
          <ReportStatusButton reportId={report.id} status={report.status === "resolved" ? "resolved" : "open"} />
        </div>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Reports</h1>
      <p className="mt-2 text-dark-secondary">
        Review what people have flagged. Open the item, take action if needed (e.g. contact the owner or delete it from the
        database), then mark the report resolved.
      </p>

      <section className="mt-8">
        <p className="label-eyebrow">Open ({openReports.length})</p>
        {openReports.length === 0 ? (
          <div className="card-raised mt-4 p-8 text-center text-dark-secondary">No open reports. 🎉</div>
        ) : (
          <ul className="mt-4 space-y-3">{openReports.map(renderReport)}</ul>
        )}
      </section>

      {resolvedReports.length > 0 ? (
        <section className="mt-10">
          <p className="label-eyebrow">Recently resolved</p>
          <ul className="mt-4 space-y-3 opacity-70">{resolvedReports.map(renderReport)}</ul>
        </section>
      ) : null}
    </main>
  );
}
