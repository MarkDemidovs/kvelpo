'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import CreateProjectModal from './CreateProjectModal';
import Landing from './_components/landing/Landing';
import { ProjectCardSkeletonGrid } from './_components/Skeleton';

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

function HomeFeedContent() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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
        setDisplayedProjects(prev => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...newProjects.filter((p) => !seen.has(p.id))];
        });
      } else {
        setDisplayedProjects(newProjects);
      }

      setHasMore(newProjects.length === 12);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      if (!isLoadMore) {
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
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleProjectCreated = (newProject: Project) => {
    setDisplayedProjects((prev) => [newProject, ...prev]);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('create');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const myProjects = displayedProjects.filter((p) => p.clerkUserId === userId);
  const otherProjects = displayedProjects.filter((p) => p.clerkUserId !== userId);

  return (
    <main className="min-h-screen overflow-x-hidden bg-dark-primary pt-24 text-fg">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-56 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
          style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent), transparent 68%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          {/* Plain-language header + one obvious action */}
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-[34px] font-bold tracking-tight text-fg">Find people to build with</h1>
              <p className="mt-2 text-[15px] text-fg-secondary">Browse open projects below, or start your own and pick who joins.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
              Create a project
            </button>
          </div>

          {!bannerDismissed && (
            <div className="card-raised mt-7 flex items-center justify-between gap-4 !border-dark-subtle p-4">
              <p className="text-sm text-fg-secondary">
                <span className="font-semibold text-fg">New here?</span>{' '}
                Create a project to find teammates, or open any project below to apply.
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setBannerDismissed(true)}
                className="shrink-0 rounded-full p-1 text-dark-muted hover:text-fg"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-10"><ProjectCardSkeletonGrid /></div>
          ) : projectsError ? (
            <div className="card-raised mt-10 p-10 text-center text-danger">{projectsError}</div>
          ) : (
            <div className="mt-10 space-y-12">
              {myProjects.length > 0 && (
                <section>
                  <p className="label-eyebrow">My projects</p>
                  <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} onClick={() => router.push(`/projects/${project.id}`)} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <p className="label-eyebrow">Open projects</p>
                {otherProjects.length === 0 ? (
                  <div className="card-raised mt-5 p-10 text-center text-fg-secondary">No open projects yet. Be the first to post one.</div>
                ) : (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {otherProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} onClick={() => router.push(`/projects/${project.id}`)} />
                    ))}
                  </div>
                )}
              </section>

              {hasMore && !loading && (
                <div ref={observerTarget} className="py-8">
                  {loadingMore && <div className="text-center text-fg-secondary">Loading more projects...</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onProjectCreated={handleProjectCreated}
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
      className="card-raised flex min-h-[200px] min-w-0 cursor-pointer flex-col gap-4 p-5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-dark-tertiary">
          {project.avatarUrl ? (
            <Image
              src={project.avatarUrl}
              alt={`${project.userFullName ?? project.clerkUserId} avatar`}
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-[11px] font-semibold uppercase text-fg">
              {(project.userFullName ?? project.clerkUserId).slice(0, 2)}
            </span>
          )}
        </div>
        <Link
          href={`/profile/${encodeURIComponent(project.clerkUserId)}`}
          className="min-w-0 truncate text-[13px] text-dark-muted hover:text-accent-blue"
          onClick={(e) => e.stopPropagation()}
        >
          {project.userFullName?.trim() ? project.userFullName.trim() : project.clerkUserId.slice(0, 12)}
        </Link>
      </div>

      <div>
        <h3 className="text-[17px] font-semibold text-fg">{project.name}</h3>
        {project.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-fg-secondary">{project.description}</p>
        ) : (
          <p className="mt-1.5 text-sm text-dark-muted">No description provided.</p>
        )}
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-fg-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-[13px] text-dark-muted">
          {project.rolesNeededCount ? `${project.rolesNeededCount} role${project.rolesNeededCount > 1 ? 's' : ''} open` : 'No open roles'}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-blue">
          View project
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </article>
  );
}

function HomePageContent() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <HomeFeedContent /> : <Landing />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
