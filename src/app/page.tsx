'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CreateProjectModal from './CreateProjectModal';
import ViewProjectModal from './ViewProjectModal';

interface Project {
  id: number;
  clerkUserId: string;
  userFullName: string | null;
  avatarUrl?: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  rolesNeededCount?: number;
}

type ApiError = {
  error?: string;
  message?: string;
};

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof (value as ApiError).error === 'string' ||
      typeof (value as ApiError).message === 'string')
  );
}

function HomePageContent() {
  const { isSignedIn, userId } = useAuth();
  const searchParams = useSearchParams();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleProjectDeleted = (projectId: number) => {
    setAllProjects((prev) => prev.filter((project) => project.id !== projectId));
    setIsViewModalOpen(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setProjectsError(null);

      try {
        const res = await fetch('/api/projects?mode=public');
        const data = (await res.json().catch(() => null)) as unknown;

        if (!res.ok) {
          const errorMessage = isApiError(data)
            ? data.error ?? data.message
            : `Failed to fetch projects (${res.status})`;
          throw new Error(errorMessage);
        }

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response format from project API');
        }

        setAllProjects(data as Project[]);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setAllProjects([]);
        setProjectsError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setIsModalOpen(true);
    }

    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener('openCreateProjectModal', handleOpenModal);

    return () => {
      window.removeEventListener('openCreateProjectModal', handleOpenModal);
    };
  }, []);

  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && allProjects.length > 0) {
      const project = allProjects.find((p) => p.id === parseInt(projectId));
      if (project) {
        setSelectedProject(project);
        setIsViewModalOpen(true);
      } else {
        void fetch(`/api/projects/${projectId}`)
          .then((res) => res.json())
          .then((data: Project) => {
            if (data && !('error' in data)) {
              setSelectedProject(data);
              setIsViewModalOpen(true);
            }
          })
          .catch((err) => {
            console.debug('Project not found or deep-link failed:', err);
          });
      }
    }
  }, [searchParams, allProjects]);

  const handleProjectCreated = (newProject: Project) => {
    setAllProjects((prev) => [newProject, ...prev]);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('create');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedProject(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Split projects into groups
  const myProjects = isSignedIn
    ? allProjects.filter((p) => p.clerkUserId === userId)
    : [];
  const otherProjects = isSignedIn
    ? allProjects.filter((p) => p.clerkUserId !== userId)
    : allProjects;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 overflow-x-hidden pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Feed
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Discover Projects
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Browse public projects and collaborate with others.
            </p>
          </div>

          {isSignedIn && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Project
            </button>
          )}
        </header>

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/40">
            Loading projects...
          </div>
        ) : projectsError ? (
          <div className="rounded-3xl bg-white p-10 text-center text-rose-600 shadow-sm shadow-slate-200/40">
            {projectsError}
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Projects Section */}
            {isSignedIn && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    My Projects
                  </h2>
                </div>
                {myProjects.length === 0 ? (
                  <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/40">
                    You haven&#39;t created any projects yet.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {myProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => {
                          setSelectedProject(project);
                          setIsViewModalOpen(true);
                          if (typeof window !== 'undefined') {
                            const url = new URL(window.location.href);
                            url.searchParams.set('project', project.id.toString());
                            window.history.pushState({}, '', url.toString());
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Recommended Section */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  Recommended
                </h2>
                <p className="text-sm text-slate-500">
                  Based on your profile tags
                </p>
              </div>
              {otherProjects.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/40">
                  No recommended projects yet.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherProjects.slice(0, 6).map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsViewModalOpen(true);
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href);
                          url.searchParams.set('project', project.id.toString());
                          window.history.pushState({}, '', url.toString());
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Other Projects Section */}
            {otherProjects.length > 6 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Other Projects
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherProjects.slice(6).map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsViewModalOpen(true);
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href);
                          url.searchParams.set('project', project.id.toString());
                          window.history.pushState({}, '', url.toString());
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onProjectCreated={handleProjectCreated}
      />
      <ViewProjectModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        project={selectedProject}
        onProjectDeleted={handleProjectDeleted}
      />
    </main>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className="cursor-pointer min-h-[200px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Project
          </p>
          <h3 className="mt-1 max-w-full truncate text-lg font-semibold text-slate-900">
            {project.name}
          </h3>
        </div>
      </div>
      {project.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3 break-words">
          {project.description}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No description provided.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {project.avatarUrl ? (
              <img
                src={project.avatarUrl}
                alt={`${project.userFullName ?? project.clerkUserId} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-slate-300 text-xs font-semibold uppercase text-slate-700">
                {(project.userFullName ?? project.clerkUserId).slice(0, 2)}
              </span>
            )}
          </div>
          <Link
            href={`/profile/${encodeURIComponent(project.clerkUserId)}`}
            className="text-slate-500 hover:text-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {project.userFullName?.trim()
              ? project.userFullName.trim()
              : project.clerkUserId}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
