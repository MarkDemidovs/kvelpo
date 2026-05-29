"use client";

import { useEffect, useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[90vh] w-full max-w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-w-2xl"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="max-w-full truncate text-xl font-semibold text-slate-900">{project.name}</h2>
            {projectDetails?.isOwner ? (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
              >
                Delete
              </button>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && !projectDetails ? (
            <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-600">Loading project details...</div>
          ) : projectDetails ? (
            <>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project</p>
                  <h3 className="mt-2 max-w-full truncate text-xl font-semibold text-slate-900">{projectDetails.name}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${projectDetails.isPublic ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                  {projectDetails.isPublic ? "Public" : "Private"}
                </span>
              </div>

              {projectDetails.description ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Description</p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{projectDetails.description}</p>
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-500">No description provided.</p>
              )}

              {projectDetails.tags && projectDetails.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-1 md:grid-cols-2">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="truncate">Created: {new Date(projectDetails.createdAt).toLocaleDateString()}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="truncate">By: {projectDetails.userFullName ?? projectDetails.clerkUserId}</span>
                </div>
                {projectDetails.rolesNeededCount ? (
                  <div className="flex items-center justify-start sm:justify-end">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {projectDetails.rolesNeededCount} slot{projectDetails.rolesNeededCount > 1 ? "s" : ""} needed
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">Roles needed</p>
                  <span className="text-xs text-slate-500">{projectDetails.rolesNeeded?.length ?? 0} positions</span>
                </div>
                {projectDetails.rolesNeeded && projectDetails.rolesNeeded.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {projectDetails.rolesNeeded.map((role) => (
                      <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{role.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{role.description ?? "No details provided."}</p>
                          </div>
                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {role.slotsNeeded} slot{role.slotsNeeded !== 1 ? "s" : ""}
                            </span>
                            {!projectDetails.isOwner && role.slotsNeeded > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRoleId(role.id)}
                                className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Apply
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {selectedRoleId === role.id && !projectDetails.isOwner ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <label className="block text-sm font-medium text-slate-700">Message</label>
                            <textarea
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                              rows={3}
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Optional note for the project owner"
                            />
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoleId(null);
                                  setApplicationMessage("");
                                }}
                                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleApply}
                                disabled={isSubmittingApplication}
                                className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                  <p className="mt-4 text-sm text-slate-500">No roles are currently open for this project.</p>
                )}
              </div>

              {projectDetails.isOwner && projectDetails.applications && projectDetails.applications.length > 0 ? (
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">Applications</p>
                    <span className="text-xs text-slate-500">{projectDetails.applications.length} total</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {projectDetails.applications.map((app) => (
                      <div key={app.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{app.applicantFullName ?? app.clerkUserId}</p>
                            <p className="text-xs text-slate-500">
                              {app.roleTitle ?? "Role"} • {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${app.status === "pending" ? "bg-yellow-100 text-yellow-700" : app.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                              {app.status}
                            </span>
                            {app.status === "pending" ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "accepted")}
                                  disabled={actionLoading === app.id}
                                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleApplicationUpdate(app.id, "rejected")}
                                  disabled={actionLoading === app.id}
                                  className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {app.message ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{app.message}</p>
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