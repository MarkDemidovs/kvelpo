"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ViewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectDeleted?: (projectId: number) => void;
}

interface Project {
  id: number;
  clerkUserId: string;
  userFullName: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  rolesNeededCount?: number;
}

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

interface ProjectDetails extends Project {
  avatarUrl: string | null;
  rolesNeeded: RoleNeeded[];
  isOwner: boolean;
  applications?: Application[];
}

// Added this interface to fix the "any" type errors on API responses
interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export default function ViewProjectModal({ isOpen, onClose, project, onProjectDeleted }: ViewProjectModalProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!project || !isOpen) {
      setProjectDetails(null);
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${project.id}`);
        if (!response.ok) {
          const data = (await response.json()) as ApiErrorResponse;
          throw new Error(data.error ?? data.message ?? "Unable to load project details");
        }

        const data = (await response.json()) as ProjectDetails;
        setProjectDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDetails();
  }, [project, isOpen]);

  const refreshDetails = async () => {
    if (!project) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to refresh project details");
      }
      const data = (await response.json()) as ProjectDetails;
      setProjectDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!project || !selectedRoleId) return;
    setIsSubmittingApplication(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectRoleNeededId: selectedRoleId, message: applicationMessage }),
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Failed to submit application");
      }

      setSelectedRoleId(null);
      setApplicationMessage("");
      await refreshDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleApplicationUpdate = async (applicationId: number, status: "accepted" | "rejected") => {
    if (!project) return;
    setActionLoading(applicationId);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to update application");
      }

      await refreshDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const confirmed = window.confirm("Delete this project? This action cannot be undone.");
    if (!confirmed) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? data.message ?? "Unable to delete project");
      }

      onProjectDeleted?.(project.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[90vh] w-full max-w-full flex-col overflow-hidden rounded-xl border border-dark-subtle bg-dark-card sm:max-w-2xl"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="flex flex-col gap-4 border-b border-dark-subtle px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="max-w-full truncate text-xl font-semibold text-dark-primary">{project.name}</h2>
            {projectDetails?.isOwner ? (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="rounded-full bg-red-900/50 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/70"
              >
                Delete
              </button>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-3xl bg-red-900/30 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {isLoading && !projectDetails ? (
            <div className="rounded-3xl bg-dark-tertiary p-6 text-sm text-dark-secondary">Loading project details...</div>
          ) : projectDetails ? (
            <>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Project</p>
                  <h3 className="mt-2 max-w-full truncate text-xl font-semibold text-dark-primary">{projectDetails.name}</h3>
                </div>
              </div>

              {projectDetails.description ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-dark-primary">Description</p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-dark-secondary">{projectDetails.description}</p>
                </div>
              ) : (
                <p className="text-sm leading-7 text-dark-muted">No description provided.</p>
              )}

              {projectDetails.tags && projectDetails.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-dark-primary">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-dark-tertiary px-3 py-1 text-xs font-medium text-dark-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-dark-tertiary p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-dark-subtle">
                    {projectDetails.avatarUrl ? (
                      <img
                        src={projectDetails.avatarUrl}
                        alt={`${projectDetails.userFullName ?? projectDetails.clerkUserId} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-sm font-semibold uppercase text-dark-primary">
                        {(projectDetails.userFullName ?? projectDetails.clerkUserId).slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted">Project owner</p>
                    <Link
                      href={`/profile/${encodeURIComponent(projectDetails.clerkUserId)}`}
                      className="font-semibold text-dark-primary hover:text-accent-blue"
                    >
                      {projectDetails.userFullName?.trim() ? projectDetails.userFullName.trim() : projectDetails.clerkUserId}
                    </Link>
                  </div>
                </div>
                <div className="text-sm text-dark-secondary">
                  Created: {new Date(projectDetails.createdAt).toLocaleDateString()}
                  {projectDetails.rolesNeededCount ? ` · ${projectDetails.rolesNeededCount} slot${projectDetails.rolesNeededCount > 1 ? "s" : ""} needed` : ""}
                </div>
              </div>

              <div className="rounded-3xl bg-dark-tertiary p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-dark-primary">Roles needed</p>
                  <span className="text-xs text-dark-secondary">{projectDetails.rolesNeeded?.length ?? 0} positions</span>
                </div>
                {projectDetails.rolesNeeded && projectDetails.rolesNeeded.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {projectDetails.rolesNeeded.map((role) => (
                      <div key={role.id} className="rounded-2xl border border-dark-subtle bg-dark-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark-primary">{role.title}</p>
                            <p className="mt-1 text-sm text-dark-secondary">{role.description ?? "No details provided."}</p>
                          </div>
                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="rounded-full bg-dark-tertiary px-3 py-1 text-xs font-semibold text-dark-secondary">
                              {role.slotsNeeded} slot{role.slotsNeeded !== 1 ? "s" : ""}
                            </span>
                            {!projectDetails.isOwner && role.slotsNeeded > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRoleId(role.id)}
                                className="rounded-full bg-accent-blue px-3 py-2 text-xs font-semibold text-dark-primary hover:bg-blue-500"
                              >
                                Apply
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {selectedRoleId === role.id && !projectDetails.isOwner ? (
                          <div className="mt-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
                            <label className="block text-sm font-medium text-dark-primary">Message</label>
                            <textarea
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                              rows={3}
                              className="mt-2 w-full rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm text-dark-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                              placeholder="Optional note for the project owner"
                            />
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoleId(null);
                                  setApplicationMessage("");
                                }}
                                className="rounded-full border border-dark-subtle bg-dark-card px-3 py-2 text-sm font-semibold text-dark-secondary hover:bg-dark-tertiary"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleApply}
                                disabled={isSubmittingApplication}
                                className="rounded-full bg-accent-blue px-3 py-2 text-sm font-semibold text-dark-primary hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-dark-muted"
                              >
                                {isSubmittingApplication ? "Applying..." : "Submit application"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-dark-secondary">No roles are currently open for this project.</p>
                )}
              </div>

              {projectDetails.isOwner && projectDetails.applications && projectDetails.applications.length > 0 ? (
                <div className="rounded-3xl bg-dark-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-dark-primary">Applications</p>
                    <span className="text-xs text-dark-secondary">{projectDetails.applications.length} total</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {projectDetails.applications.map((app) => (
                      <div key={app.id} className="rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dark-primary">
                              <Link href={`/profile/${encodeURIComponent(app.clerkUserId)}`} className="hover:text-accent-blue">
                                {app.applicantFullName?.trim() ? app.applicantFullName.trim() : app.clerkUserId}
                              </Link>
                            </p>
                            <p className="text-xs text-dark-secondary">
                              {app.roleTitle ?? "Role"} • {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${app.status === "pending" ? "bg-yellow-900/50 text-yellow-400" : app.status === "accepted" ? "bg-emerald-900/50 text-emerald-400" : "bg-dark-tertiary text-dark-secondary"}`}>
                              {app.status}
                            </span>
                            {app.status === "pending" ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "accepted")}
                                  disabled={actionLoading === app.id}
                                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-dark-primary hover:bg-emerald-500 disabled:opacity-60"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "rejected")}
                                  disabled={actionLoading === app.id}
                                  className="rounded-full bg-dark-tertiary px-3 py-1.5 text-xs font-semibold text-dark-secondary hover:bg-dark-subtle disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {app.message ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-dark-secondary">{app.message}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}