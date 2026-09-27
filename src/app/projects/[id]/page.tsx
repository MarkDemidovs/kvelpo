"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProjectDetailSkeleton } from "~/app/_components/Skeleton";
import ReportButton from "~/app/_components/ReportButton";
import { AdminProjectBar } from "~/app/_components/AdminControls";

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
  createdAt: string;
  rolesNeeded: RoleNeeded[];
  isOwner: boolean;
  applications?: Application[];
  /** Only present for admins. */
  viewerIsAdmin?: boolean;
  ownerBanned?: boolean;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

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

  return (
    <main className="min-h-screen bg-dark-primary text-dark-primary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-dark-secondary hover:text-dark-primary">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to projects
        </Link>

        {error ? (
          <div className="card-raised mt-5 p-4 text-sm text-red-400">{error}</div>
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
            <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[32px] font-bold tracking-tight text-dark-primary">{project.name}</h1>
                  {project.isOwner ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteProject()}
                      disabled={isDeleting}
                      className="rounded-full bg-red-900/50 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/70 disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 flex min-w-0 items-center gap-2.5">
                  <div className="h-6.5 w-6.5 shrink-0 overflow-hidden rounded-full bg-dark-tertiary">
                    {project.avatarUrl ? (
                      <Image src={project.avatarUrl} alt="" width={26} height={26} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-dark-secondary">
                        {(project.userFullName ?? project.clerkUserId).slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <Link href={`/profile/${encodeURIComponent(project.clerkUserId)}`} className="min-w-0 truncate text-sm text-dark-secondary hover:text-accent-blue">
                    {project.userFullName?.trim() ? project.userFullName.trim() : project.clerkUserId.slice(0, 12)}
                  </Link>
                  <span className="shrink-0 text-xs text-dark-muted">&middot; Owner</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <span className="whitespace-nowrap rounded-full bg-dark-tertiary px-3.5 py-2 text-[13px] text-dark-secondary">
                  {project.isPublic ? "Public project" : "Private project"}
                </span>
                {!project.isOwner ? <ReportButton targetType="project" targetId={project.id} targetLabel={project.name} /> : null}
              </div>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
              <div className="flex flex-col gap-10">
                <div>
                  <p className="label-eyebrow">About this project</p>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-dark-secondary">
                    {project.description ?? "No description provided."}
                  </p>
                </div>

                <div>
                  <p className="label-eyebrow">Open roles</p>
                  {project.rolesNeeded.length === 0 ? (
                    <p className="mt-3.5 text-sm text-dark-secondary">No roles are currently open for this project.</p>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3">
                      {project.rolesNeeded.map((role) => (
                        <div key={role.id} className="card-raised p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[15px] font-semibold text-dark-primary">{role.title}</p>
                              <p className="mt-1 text-sm text-dark-secondary">{role.description ?? "No details provided."} {role.slotsNeeded} spot{role.slotsNeeded !== 1 ? "s" : ""}.</p>
                            </div>
                            {!project.isOwner ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isLoaded && !isSignedIn) {
                                    openSignIn({ forceRedirectUrl: window.location.href });
                                    return;
                                  }
                                  setSelectedRoleId(role.id);
                                }}
                                className="btn-primary shrink-0 !px-4.5 !py-2.5 text-sm"
                              >
                                Apply for this role
                              </button>
                            ) : null}
                          </div>

                          {selectedRoleId === role.id && !project.isOwner ? (
                            <div className="mt-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
                              <label className="text-sm font-medium text-dark-primary">Message</label>
                              <textarea
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                rows={3}
                                className="mt-2 w-full rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm text-dark-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
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
                  )}
                </div>

                {project.isOwner && project.applications && project.applications.length > 0 ? (
                  <div>
                    <p className="label-eyebrow">Applicants &middot; {project.applications.length}</p>
                    <div className="mt-4 flex flex-col gap-3">
                      {project.applications.map((app) => (
                        <div key={app.id} className="card-raised p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link href={`/profile/${encodeURIComponent(app.clerkUserId)}`} className="block truncate text-[15px] font-semibold text-dark-primary hover:text-accent-blue">
                                {app.applicantFullName?.trim() ? app.applicantFullName.trim() : app.clerkUserId.slice(0, 12)}
                              </Link>
                              <p className="mt-0.5 text-[13px] text-dark-muted">Applied for {app.roleTitle ?? "a role"}</p>
                            </div>
                            {app.status === "pending" ? (
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "accepted")}
                                  disabled={actionLoading === app.id}
                                  className="btn-primary !px-4 !py-2 text-[13px] disabled:opacity-60"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "rejected")}
                                  disabled={actionLoading === app.id}
                                  className="btn-secondary !px-4 !py-2 text-[13px] disabled:opacity-60"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${app.status === "accepted" ? "bg-emerald-900/50 text-emerald-400" : "bg-dark-tertiary text-dark-secondary"}`}>
                                {app.status}
                              </span>
                            )}
                          </div>
                          {app.message ? <p className="mt-3 text-sm leading-relaxed text-dark-secondary">{app.message}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="card-raised sticky top-20 flex flex-col gap-4 p-5">
                <p className="label-eyebrow">Project info</p>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-muted">Created</span>
                    <span className="text-sm text-dark-secondary">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-muted">Open roles</span>
                    <span className="text-sm text-dark-secondary">{project.rolesNeeded.length}</span>
                  </div>
                </div>
                {project.tags.length > 0 ? (
                  <>
                    <div className="h-px bg-dark-subtle" />
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-dark-secondary">{tag}</span>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
