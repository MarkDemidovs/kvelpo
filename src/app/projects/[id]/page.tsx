"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProjectDetailSkeleton } from "~/app/_components/Skeleton";
import ReportButton from "~/app/_components/ReportButton";
import { AdminProjectBar } from "~/app/_components/AdminControls";
import BoostModal from "~/app/_components/BoostModal";
import EditProjectModal from "~/app/_components/EditProjectModal";
import MessageButton from "~/app/_components/MessageButton";
import ProjectInsights from "~/app/_components/ProjectInsights";
import VerifiedBadge from "~/app/_components/VerifiedBadge";

interface RoleNeeded {
  id: number;
  title: string;
  description: string | null;
  slotsNeeded: number;
}

interface Application {
  id: number;
  clerkUserId: string;
  applicantFullName: string | null;
  projectRoleNeededId: number;
  roleTitle: string | null;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface ProjectDetails {
  id: number;
  clerkUserId: string;
  userFullName: string | null;
  avatarUrl: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  category?: string | null;
  isDraft?: boolean;
  createdAt: string;
  rolesNeeded: RoleNeeded[];
  isOwner: boolean;
  featured?: boolean;
  ownerVerified?: boolean;
  boostedUntil?: string | null;
  /** People already accepted onto the team. */
  spotsFilled?: number;
  applications?: Application[];
  /** Only present for admins. */
  viewerIsAdmin?: boolean;
  ownerBanned?: boolean;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

type Tab = "overview" | "applications" | "insights";

const timeAgo = (value: string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [boostOpen, setBoostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Deep link: /projects/12?tab=insights
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "applications" || requested === "insights") setTab(requested);
  }, []);

  const loadProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to load this project");
      }
      const data = (await response.json()) as ProjectDetails;
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleApply = async () => {
    if (!selectedRoleId) return;
    setIsSubmittingApplication(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRoleNeededId: selectedRoleId, message: applicationMessage }),
      });
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Failed to submit application");
      }
      setSelectedRoleId(null);
      setApplicationMessage("");
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleApplicationUpdate = async (applicationId: number, status: "accepted" | "rejected") => {
    setActionLoading(applicationId);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to update application");
      }
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project? This action cannot be undone.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to delete project");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsDeleting(false);
    }
  };

  const publishDraft = async () => {
    setPublishing(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDraft: false }),
      });
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to post this project");
      }
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  };

  const startApplying = (roleId: number) => {
    if (isLoaded && !isSignedIn) {
      openSignIn({ forceRedirectUrl: window.location.href });
      return;
    }
    setSelectedRoleId(roleId);
  };

  const ownerName = project?.userFullName?.trim() ? project.userFullName.trim() : (project?.clerkUserId.slice(0, 12) ?? "");
  const openSpots = project?.rolesNeeded.reduce((sum, role) => sum + role.slotsNeeded, 0) ?? 0;
  const applications = project?.applications ?? [];
  const pending = applications.filter((app) => app.status === "pending").length;
  const accepted = applications.filter((app) => app.status === "accepted").length;
  const joined = project?.spotsFilled ?? accepted;
  const totalSpots = openSpots + joined;
  const boostDaysLeft = project?.featured && project.boostedUntil ? Math.max(1, Math.ceil((new Date(project.boostedUntil).getTime() - Date.now()) / 86_400_000)) : null;
  const chips = project ? [...(project.category ? [project.category] : []), ...project.tags].slice(0, 4) : [];

  const rolesList = (withApply: boolean) =>
    project?.rolesNeeded.length === 0 ? (
      <p className="mt-4 text-sm text-fg-secondary">No roles are currently open for this project.</p>
    ) : (
      <div className="mt-4 divide-y divide-dark-subtle overflow-hidden rounded-2xl border border-dark-subtle">
        {project?.rolesNeeded.map((role) => (
          <div key={role.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-fg">{role.title}</p>
                <p className="mt-1 text-sm text-fg-secondary">{role.description ?? "No details provided."}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-dark-muted">{role.slotsNeeded} spot{role.slotsNeeded !== 1 ? "s" : ""} left</span>
                {withApply ? (
                  <button type="button" onClick={() => startApplying(role.id)} className="btn-secondary !px-4 !py-2 text-sm">
                    Apply
                  </button>
                ) : null}
              </div>
            </div>

            {withApply && selectedRoleId === role.id ? (
              <div className="mt-4 rounded-2xl bg-dark-secondary p-4">
                <label htmlFor={`apply-${role.id}`} className="text-sm font-medium text-fg">Message</label>
                <textarea
                  id={`apply-${role.id}`}
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-dark-subtle bg-dark-primary px-3 py-2 text-sm text-fg outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  placeholder="Optional note for the project owner"
                />
                <div className="mt-3.5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedRoleId(null); setApplicationMessage(""); }}
                    className="btn-secondary !px-4 !py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApply()}
                    disabled={isSubmittingApplication}
                    className="btn-primary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingApplication ? "Applying..." : "Submit application"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );

  const aboutBlock = project ? (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-fg">About the project</h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-fg-secondary">
        {project.description ?? "No description provided."}
      </p>
    </div>
  ) : null;

  const rolesBlock = project ? (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-fg">Open roles</h2>
        <p className="text-xs text-dark-muted">{project.rolesNeeded.length} role{project.rolesNeeded.length === 1 ? "" : "s"} &middot; {openSpots} spot{openSpots === 1 ? "" : "s"}</p>
      </div>
      {rolesList(!project.isOwner)}
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-dark-primary pt-14 text-fg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={project?.isOwner ? "/projects" : "/"} className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {project?.isOwner ? "My projects" : "All projects"}
        </Link>

        {error ? (
          <div className="mt-5 rounded-2xl bg-danger-bg p-4 text-sm text-danger">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="mt-5"><ProjectDetailSkeleton /></div>
        ) : !project ? null : (
          <>
            {project.viewerIsAdmin ? (
              <div className="mt-5">
                <AdminProjectBar
                  project={{
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    isPublic: project.isPublic,
                    clerkUserId: project.clerkUserId,
                    ownerLabel: project.userFullName?.trim() ? project.userFullName.trim() : "this user",
                    ownerBanned: Boolean(project.ownerBanned),
                  }}
                  onEdited={() => void loadProject()}
                />
              </div>
            ) : null}

            {project.isOwner && project.isDraft ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-warning-bg p-4">
                <div>
                  <p className="text-sm font-semibold text-warning">This project is a draft</p>
                  <p className="mt-0.5 text-sm text-fg-secondary">Only you can see it. Post it when you&apos;re ready for people to apply.</p>
                </div>
                <button type="button" onClick={() => void publishDraft()} disabled={publishing} className="btn-primary !px-5 !py-2.5 text-sm disabled:opacity-60">
                  {publishing ? "Posting..." : "Post project"}
                </button>
              </div>
            ) : null}

            {chips.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span key={chip} className="rounded-full bg-dark-tertiary px-3 py-1.5 text-xs text-fg-secondary">{chip}</span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-fg sm:text-[56px]">{project.name}</h1>

                {project.isOwner ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-fg-secondary">
                    {project.isDraft ? (
                      <span className="rounded-full bg-warning-bg px-2.5 py-1 text-[11px] font-medium text-warning">Draft</span>
                    ) : project.isPublic && openSpots > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        Recruiting
                      </span>
                    ) : (
                      <span className="rounded-full bg-dark-tertiary px-2.5 py-1 text-[11px] font-medium text-fg-secondary">{project.isPublic ? "Not recruiting" : "Private"}</span>
                    )}
                    {project.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/12 px-2.5 py-1 text-[11px] font-semibold text-accent-blue">
                        Featured
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
                      </span>
                    ) : null}
                    <span>Posted {timeAgo(project.createdAt)} &middot; {project.rolesNeeded.length} role{project.rolesNeeded.length === 1 ? "" : "s"} open</span>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-accent-blue/12">
                      {project.avatarUrl ? (
                        <Image src={project.avatarUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-accent-blue">{ownerName.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/profile/${encodeURIComponent(project.clerkUserId)}`} className="truncate text-[15px] font-medium text-fg hover:text-accent-blue">
                          {ownerName}
                        </Link>
                        {project.ownerVerified ? <VerifiedBadge className="h-3.5 w-3.5" /> : null}
                      </div>
                      <p className="text-[13px] text-dark-muted">
                        Project owner &middot; Posted {timeAgo(project.createdAt)}
                        {project.featured ? " · Featured" : ""}
                        {!project.isPublic ? " · Private" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {project.isOwner ? (
                <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => void handleDeleteProject()}
                    disabled={isDeleting}
                    className="rounded-full px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger-bg disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                  <button type="button" onClick={() => setEditOpen(true)} className="btn-secondary !px-5 !py-2.5 text-sm">
                    Edit project
                  </button>
                  {project.isPublic && !project.isDraft ? (
                    <button
                      type="button"
                      onClick={() => setBoostOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-blue px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:opacity-90 sm:flex-none"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
                      {project.featured ? "Extend boost" : "Boost project"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <ReportButton targetType="project" targetId={project.id} targetLabel={project.name} />
              )}
            </div>

            {!project.isOwner ? (
              <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-dark-secondary px-4 py-3 text-sm text-fg-secondary lg:hidden">
                <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8" /></svg>
                {openSpots} spot{openSpots === 1 ? "" : "s"} open across {project.rolesNeeded.length} role{project.rolesNeeded.length === 1 ? "" : "s"}
                {joined > 0 ? ` · ${joined} joined` : ""}
              </p>
            ) : null}

            {project.isOwner && boostDaysLeft !== null ? (
              <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${boostDaysLeft <= 2 ? "bg-warning-bg" : "bg-accent-blue/[0.08]"}`}>
                <p className="text-sm text-fg">
                  <span className="font-semibold">
                    {boostDaysLeft <= 1 ? "Your boost ends today." : `Your boost ends in ${boostDaysLeft} days.`}
                  </span>{" "}
                  <span className="text-fg-secondary">
                    {boostDaysLeft <= 2 ? "Extend it to stay at the top of Explore." : `It stays at the top of Explore until ${new Date(project.boostedUntil!).toLocaleDateString()}.`}
                  </span>
                </p>
                <button type="button" onClick={() => setBoostOpen(true)} className="btn-secondary !px-4 !py-2 text-[13px]">
                  Extend boost
                </button>
              </div>
            ) : null}

            {project.isOwner ? (
              <>
                <div className="mt-8 flex gap-6 border-b border-dark-subtle" role="tablist" aria-label="Project sections">
                  {([
                    ["overview", "Overview"],
                    ["applications", `Applications${applications.length > 0 ? ` · ${applications.length}` : ""}`],
                    ["insights", "Insights"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      onClick={() => setTab(value)}
                      className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
                        tab === value ? "border-[var(--text)] text-fg" : "border-transparent text-fg-secondary hover:text-fg"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  {tab === "overview" ? (
                    <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
                      <div className="flex flex-col gap-10">
                        {aboutBlock}
                        {rolesBlock}
                      </div>
                      <div className="rounded-2xl border border-dark-subtle p-5">
                        <p className="label-eyebrow">Project info</p>
                        <dl className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between"><dt className="text-dark-muted">Created</dt><dd className="text-fg-secondary">{new Date(project.createdAt).toLocaleDateString()}</dd></div>
                          <div className="flex justify-between"><dt className="text-dark-muted">Open spots</dt><dd className="text-fg-secondary">{openSpots}</dd></div>
                          <div className="flex justify-between"><dt className="text-dark-muted">Visibility</dt><dd className="text-fg-secondary">{project.isPublic ? "Public" : "Private"}</dd></div>
                          {project.category ? <div className="flex justify-between"><dt className="text-dark-muted">Category</dt><dd className="text-fg-secondary">{project.category}</dd></div> : null}
                        </dl>
                      </div>
                    </div>
                  ) : null}

                  {tab === "applications" ? (
                    applications.length === 0 ? (
                      <div className="rounded-2xl bg-dark-secondary p-10 text-center text-sm text-fg-secondary">
                        No applications yet. People who apply to your roles will show up here.
                      </div>
                    ) : (
                      <div className="flex max-w-3xl flex-col gap-3">
                        {applications.map((app) => (
                          <div key={app.id} className="rounded-2xl border border-dark-subtle p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <Link href={`/profile/${encodeURIComponent(app.clerkUserId)}`} className="block truncate text-[15px] font-semibold text-fg hover:text-accent-blue">
                                  {app.applicantFullName?.trim() ? app.applicantFullName.trim() : app.clerkUserId.slice(0, 12)}
                                </Link>
                                <p className="mt-0.5 text-[13px] text-dark-muted">Applied for {app.roleTitle ?? "a role"}</p>
                              </div>
                              {app.status === "pending" ? (
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleApplicationUpdate(app.id, "rejected")}
                                    disabled={actionLoading === app.id}
                                    className="btn-secondary !px-4 !py-2 text-[13px] disabled:opacity-60"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleApplicationUpdate(app.id, "accepted")}
                                    disabled={actionLoading === app.id}
                                    className="btn-primary !px-4 !py-2 text-[13px] disabled:opacity-60"
                                  >
                                    Accept
                                  </button>
                                </div>
                              ) : (
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${app.status === "accepted" ? "bg-success-bg text-success" : "bg-dark-tertiary text-fg-secondary"}`}>
                                  {app.status}
                                </span>
                              )}
                            </div>
                            {app.message ? <p className="mt-3 text-sm leading-relaxed text-fg-secondary">{app.message}</p> : null}
                          </div>
                        ))}
                      </div>
                    )
                  ) : null}

                  {tab === "insights" ? (
                    <ProjectInsights
                      projectId={project.id}
                      applications={applications.length}
                      pendingApplications={pending}
                      spotsFilled={joined}
                      spotsTotal={totalSpots}
                      featured={Boolean(project.featured)}
                      onBoost={() => setBoostOpen(true)}
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
                <div className="flex flex-col gap-10">
                  {aboutBlock}
                  {rolesBlock}
                </div>

                <div className="hidden rounded-2xl border border-dark-subtle p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-20 lg:block">
                  <p className="text-2xl font-bold tracking-tight text-fg">
                    {openSpots} spot{openSpots === 1 ? "" : "s"} open
                  </p>
                  <p className="mt-1 text-[13px] text-dark-muted">
                    Across {project.rolesNeeded.length} role{project.rolesNeeded.length === 1 ? "" : "s"} &middot;{" "}
                    {joined === 0 ? "No one has joined yet" : `${joined} ${joined === 1 ? "person has" : "people have"} joined`}
                  </p>
                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-dark-tertiary"
                    role="progressbar"
                    aria-label="Spots filled"
                    aria-valuemin={0}
                    aria-valuemax={totalSpots}
                    aria-valuenow={joined}
                  >
                    <div className="h-full rounded-full bg-accent-blue" style={{ width: `${totalSpots > 0 ? Math.round((joined / totalSpots) * 100) : 0}%` }} />
                  </div>
                  {project.rolesNeeded.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const first = project.rolesNeeded[0];
                        if (first) startApplying(first.id);
                        setTimeout(() => document.getElementById(`apply-${first?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
                      }}
                      className="btn-primary mt-5 w-full"
                    >
                      Apply to join
                    </button>
                  ) : (
                    <p className="mt-5 rounded-xl bg-dark-secondary p-3 text-sm text-fg-secondary">This project isn&apos;t looking for anyone right now.</p>
                  )}
                  <div className="mt-3">
                    <MessageButton userId={project.clerkUserId} name={ownerName.split(" ")[0] ?? ownerName} />
                  </div>
                  <div className="my-5 h-px bg-dark-subtle" />
                  <ul className="space-y-3 text-sm text-fg-secondary">
                    <li className="flex items-center gap-2.5">
                      <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      Posted {timeAgo(project.createdAt)}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /></svg>
                      Team of {joined + 1} so far
                    </li>
                    {project.category ? (
                      <li className="flex items-center gap-2.5">
                        <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                        Category: {project.category}
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            )}

            {!project.isOwner && project.rolesNeeded.length > 0 ? (
              <>
                {/* Phones: the actions stay reachable above the tab bar. */}
                <div aria-hidden="true" className="h-24 lg:hidden" />
                <div className={`fixed inset-x-0 z-30 flex gap-3 border-t border-dark-subtle bg-dark-primary px-4 py-3 lg:hidden ${isSignedIn ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]" : "bottom-0"}`}>
                  <div className="flex-1">
                    <MessageButton userId={project.clerkUserId} name="" className="btn-secondary w-full !py-2.5 text-sm" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const first = project.rolesNeeded[0];
                      if (first) startApplying(first.id);
                      setTimeout(() => document.getElementById(`apply-${first?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
                    }}
                    className="btn-primary flex-1 !py-2.5 text-sm"
                  >
                    Apply to join
                  </button>
                </div>
              </>
            ) : null}

            {editOpen ? (
              <EditProjectModal
                project={project}
                onClose={() => setEditOpen(false)}
                onSaved={() => {
                  setEditOpen(false);
                  void loadProject();
                }}
              />
            ) : null}

            {boostOpen ? (
              <BoostModal
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  tags: project.tags,
                  ownerName,
                  openRoles: project.rolesNeeded.length,
                }}
                onClose={() => setBoostOpen(false)}
              />
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
