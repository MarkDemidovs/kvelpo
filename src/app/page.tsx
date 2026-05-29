"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import CreateProjectModal from "./CreateProjectModal";
import ViewProjectModal from "./ViewProjectModal";

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

// Separate component to handle search params safely within Suspense
function HomePageContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(true);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleProjectDeleted = (projectId: number) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setIsViewModalOpen(false);
    setSelectedProject(null);
  };

  // Fetch projects list
  useEffect(() => {
    setLoading(true);
    setProjectsError(null);

    void fetch(`/api/projects?mode=${isPublicMode ? "public" : "own"}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const errorMessage = data?.error ?? data?.message ?? `Failed to fetch projects (${res.status})`;
          throw new Error(errorMessage);
        }
        if (!Array.isArray(data)) {
          throw new Error("Unexpected response format from project API");
        }
        return data;
      })
      .then((data: Project[]) => setProjects(data))
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        setProjects([]);
        setProjectsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [isPublicMode]);

  // Handle initial 'create' param and custom events
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      setIsModalOpen(true);
    }

    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener("openCreateProjectModal", handleOpenModal);

    return () => {
      window.removeEventListener("openCreateProjectModal", handleOpenModal);
    };
  }, []);

  // Handle 'project' deep-linking
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === parseInt(projectId));
      if (project) {
        setSelectedProject(project);
        setIsViewModalOpen(true);
      } else {
        void fetch(`/api/projects/${projectId}`)
          .then((res) => res.json())
          .then((data: Project) => {
            if (data && !("error" in data)) {
              setSelectedProject(data);
              setIsViewModalOpen(true);
            }
          })
          .catch(() => {
            /* Silently handle not found */
          });
      }
    }
  }, [searchParams, projects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [...prev, newProject]);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedProject(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("project");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleToggleMode = () => {
    if (!isPublicMode) {
      setIsPublicMode(true);
    } else if (!isSignedIn && isLoaded) {
      setShowSignInPrompt(true);
    } else {
      setIsPublicMode(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Feed</p>
            <h1 className="text-3xl font-semibold text-slate-900">Discover projects</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Browse public projects and switch to your own work.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.15-5.15A7 7 0 1110 3a7 7 0 018 8.5z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search projects"
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Create project
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <aside className="space-y-6 min-w-0">
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/40">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">N</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">kvelpo</p>
                  <p className="text-sm text-slate-500">Discovery simple</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mode</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{isPublicMode ? "Public feed" : "Your projects"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Projects</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{projects.length}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Filter</p>
                  <h2 className="text-xl font-semibold text-slate-900">What do you want to see?</h2>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-slate-100 p-2">
                  <button
                    onClick={handleToggleMode}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full p-1 transition ${
                      isPublicMode ? "bg-slate-200" : "bg-blue-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-8 w-8 rounded-full bg-white shadow transition-transform ${
                        isPublicMode ? "translate-x-0" : "translate-x-10"
                      }`}
                    />
                  </button>
                  <span className={isPublicMode ? "text-slate-900" : "text-slate-400"}>Public</span>
                  <span className={!isPublicMode ? "text-slate-900" : "text-slate-400"}>Own</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/40">
                Loading projects...
              </div>
            ) : projectsError ? (
              <div className="rounded-3xl bg-white p-10 text-center text-rose-600 shadow-sm shadow-slate-200/40">
                {projectsError}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/40">
                No projects found.
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setIsViewModalOpen(true);
                      if (typeof window !== "undefined") {
                        const url = new URL(window.location.href);
                        url.searchParams.set("project", project.id.toString());
                        window.history.pushState({}, "", url.toString());
                      }
                    }}
                    className="cursor-pointer min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project</p>
                        <h3 className="mt-2 max-w-full truncate text-xl font-semibold text-slate-900">{project.name}</h3>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2 max-w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof window !== "undefined") {
                              const url = new URL(window.location.href);
                              url.searchParams.set("project", project.id.toString());
                              void navigator.clipboard.writeText(url.toString());
                            }
                          }}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Copy link"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${project.isPublic ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                          {project.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </div>
                    {project.description ? (
                      <p className="mt-4 text-sm leading-7 text-slate-600 line-clamp-3 break-words">{project.description}</p>
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-slate-500">No description provided.</p>
                    )}
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{project.userFullName ?? project.clerkUserId}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Sign In Required</h2>
            <p className="mt-3 text-sm text-slate-600">Please sign in to view your projects.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setShowSignInPrompt(false)} className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold">Cancel</button>
              <SignInButton>
                <button className="w-full rounded-2xl bg-blue-600 p-3 text-sm font-semibold text-white">Sign in</button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}

      <CreateProjectModal isOpen={isModalOpen} onClose={handleModalClose} onProjectCreated={handleProjectCreated} />
      <ViewProjectModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        project={selectedProject}
        onProjectDeleted={handleProjectDeleted}
      />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}