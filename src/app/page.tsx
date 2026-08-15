'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleProjectDeleted = (projectId: number) => {
    setAllProjects((prev) => prev.filter((project) => project.id !== projectId));
    setIsViewModalOpen(false);
    setSelectedProject(null);
  };

  const fetchProjects = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setProjectsError(null);

    try {
      const res = await fetch(`/api/projects?mode=public&page=${pageNum}&limit=12`);
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

      const newProjects = data as Project[];
      
      if (isLoadMore) {
        setDisplayedProjects(prev => [...prev, ...newProjects]);
        setAllProjects(prev => [...prev, ...newProjects]);
      } else {
        setAllProjects(newProjects);
        setDisplayedProjects(newProjects);
      }

      setHasMore(newProjects.length === 12);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      if (!isLoadMore) {
        setAllProjects([]);
        setDisplayedProjects([]);
      }
      setProjectsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects(1, false);
  }, [fetchProjects]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          void fetchProjects(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchProjects]);

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
    ? displayedProjects.filter((p) => p.clerkUserId === userId)
    : [];
  const otherProjects = isSignedIn
    ? displayedProjects.filter((p) => p.clerkUserId !== userId)
    : displayedProjects;

  return (
    <main className="min-h-screen bg-dark-primary text-dark-primary overflow-x-hidden pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-8 rounded-3xl border border-dark-subtle bg-dark-card p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dark-muted">
              Feed
            </p>
            <h1 className="text-3xl font-semibold text-dark-primary">
              Discover Projects
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-dark-secondary">
              Browse public projects and collaborate with others.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
            Loading projects...
          </div>
        ) : projectsError ? (
          <div className="rounded-3xl bg-dark-card p-10 text-center text-red-500">
            {projectsError}
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Projects Section */}
            {isSignedIn && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-dark-primary">
                    My Projects
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Create New Project Card */}
                  <article
                    onClick={() => setIsModalOpen(true)}
                    className="cursor-pointer min-h-[200px] flex items-center justify-center rounded-3xl border border-dashed border-dark-subtle bg-dark-tertiary p-6 hover:border-accent-blue hover:bg-dark-secondary transition"
                  >
                    <div className="text-center">
                      <svg
                        className="h-12 w-12 mx-auto text-dark-muted hover:text-accent-blue transition"
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
                      <p className="mt-2 text-sm font-medium text-dark-secondary hover:text-accent-blue transition">
                        New Project
                      </p>
                    </div>
                  </article>

                  {/* Existing Projects */}
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
              </section>
            )}

            {/* Recommended Section */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark-primary">
                  Recommended
                </h2>
                <p className="text-sm text-dark-secondary">
                  Based on your profile tags
                </p>
              </div>
              {otherProjects.length === 0 ? (
                <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
                  No recommended projects yet.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <h2 className="text-xl font-semibold text-dark-primary">
                    Other Projects
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            
            {/* Infinite scroll sentinel */}
            {hasMore && !loading && (
              <div ref={observerTarget} className="py-8">
                {loadingMore && (
                  <div className="text-center text-dark-secondary">Loading more projects...</div>
                )}
              </div>
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
      className="cursor-pointer min-h-[200px] overflow-hidden rounded-3xl border border-dark-subtle bg-dark-card p-6 transition hover:border-dark hover:bg-dark-tertiary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">
            Project
          </p>
          <h3 className="mt-1 max-w-full truncate text-lg font-semibold text-dark-primary">
            {project.name}
          </h3>
        </div>
      </div>
      {project.description ? (
        <p className="mt-3 text-sm leading-6 text-dark-secondary line-clamp-3 break-words">
          {project.description}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-dark-muted">
          No description provided.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-dark-secondary">
        <span>
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="h-1 w-1 rounded-full bg-dark-subtle" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-dark-tertiary">
            {project.avatarUrl ? (
              <Image
                src={project.avatarUrl}
                alt={`${project.userFullName ?? project.clerkUserId} avatar`}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-xs font-semibold uppercase text-dark-primary">
                {(project.userFullName ?? project.clerkUserId).slice(0, 2)}
              </span>
            )}
          </div>
          <Link
            href={`/profile/${encodeURIComponent(project.clerkUserId)}`}
            className="text-dark-secondary hover:text-accent-blue"
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
