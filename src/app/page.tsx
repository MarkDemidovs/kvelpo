'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import CreateProjectModal from './CreateProjectModal';
import Landing from './_components/landing/Landing';
import VerifiedBadge from './_components/VerifiedBadge';
import { ProjectCardSkeletonGrid } from './_components/Skeleton';
import { PROJECT_CATEGORIES, type ProjectCategory } from '~/lib/categories';
import { isPro } from '~/lib/membership';
import skillsConfig from '~/data/skills.json';

interface Project {
  id: number;
  clerkUserId: string;
  userFullName: string | null;
  avatarUrl?: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
  rolesNeededCount?: number;
  /** Currently boosted: sorts first and shows the Featured label. */
  featured?: boolean;
  /** Owner is on Pro. */
  ownerVerified?: boolean;
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

const HIDE_GUIDE_KEY = 'kvelpo-hide-how-it-works';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'roles', label: 'Most open roles' },
] as const;

type Sort = (typeof SORT_OPTIONS)[number]['value'];

const timeAgo = (value: Date | string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${new Date(value).toLocaleDateString()}`;
};

const HOW_IT_WORKS = [
  { title: 'Post your idea', body: "Describe what you're building and which skills you need. It takes about two minutes.", icon: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z' },
  { title: 'Choose your team', body: 'People apply to the roles you list. You look at their profiles and decide who joins.', icon: 'M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8' },
  { title: 'Build together', body: 'Talk with your whole team in one chat and keep the project moving.', icon: 'M21 12c0 4.4-4 8-9 8a9.9 9.9 0 01-4.3-.9L3 20l1.4-3.7C3.5 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z' },
];

function HomeFeedContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guideHidden, setGuideHidden] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q')?.trim() ?? '');
  const [category, setCategory] = useState<'All' | ProjectCategory>('All');
  const [sort, setSort] = useState<Sort>('newest');
  const [viewerIsPro, setViewerIsPro] = useState(false);
  const [skill, setSkill] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [role, setRole] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  // Shown until dismissed; remembered per browser.
  useEffect(() => {
    try {
      setGuideHidden(window.localStorage.getItem(HIDE_GUIDE_KEY) === '1');
    } catch {
      setGuideHidden(false);
    }
  }, []);

  const hideGuide = () => {
    setGuideHidden(true);
    try {
      window.localStorage.setItem(HIDE_GUIDE_KEY, '1');
    } catch {
      // Not remembered, but hidden for this visit.
    }
  };

  // Skill and role filters are part of Pro.
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ membership?: string | null }>) : null))
      .then((data) => setViewerIsPro(isPro(data?.membership ?? null)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setRole(roleInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [roleInput]);

  // The top bar's search box navigates to /?q=...
  useEffect(() => {
    const fromUrl = searchParams.get('q') ?? '';
    setSearchInput(fromUrl);
    setSearchQuery(fromUrl.trim());
  }, [searchParams]);

  const fetchProjects = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setProjectsError(null);

    try {
      const query = new URLSearchParams({ mode: 'public', page: String(pageNum), limit: '12', sort });
      if (searchQuery) query.set('q', searchQuery);
      if (category !== 'All') query.set('category', category);
      if (viewerIsPro && skill) query.set('skill', skill);
      if (viewerIsPro && role) query.set('role', role);
      const res = await fetch(`/api/projects?${query.toString()}`);
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
  }, [searchQuery, category, sort, viewerIsPro, skill, role]);

  // Debounce typing so every keystroke doesn't hit the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
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

  const firstName = user?.firstName?.trim();
  const filtering = Boolean(searchQuery) || category !== 'All' || Boolean(skill) || Boolean(role);

  return (
    <main className="min-h-screen overflow-x-hidden bg-dark-primary pt-14 text-fg">
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="pb-10 pt-12 sm:pt-16">
          {firstName ? <p className="text-[15px] text-fg-secondary">Welcome back, {firstName}</p> : null}
          <h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.05] tracking-tight text-fg sm:text-[64px]">
            Find people to build with.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-fg-secondary">
            Share your project idea and choose who joins your team, or apply to help with someone else&apos;s. Free for everyone.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
              Post a project
            </button>
            <a href="#explore" className="btn-secondary">
              Browse projects
            </a>
          </div>
        </section>

        {/* How it works */}
        {!guideHidden ? (
          <section className="rounded-3xl bg-dark-secondary p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-fg">New to kvelpo? Here&apos;s how it works.</h2>
                <p className="mt-1 text-sm text-fg-secondary">Three simple steps. No experience needed.</p>
              </div>
              <button
                type="button"
                onClick={hideGuide}
                className="inline-flex items-center gap-1.5 rounded-full bg-dark-primary px-3 py-1.5 text-xs font-medium text-fg-secondary transition hover:text-fg"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
                Hide
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.title} className="rounded-2xl bg-dark-primary p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/12 text-accent-blue">
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={step.icon} />
                      </svg>
                    </span>
                    <span className="text-xs text-dark-muted">Step {index + 1}</span>
                  </div>
                  <p className="mt-4 text-[15px] font-semibold text-fg">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Explore */}
        <section id="explore" className="scroll-mt-20 pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-bold tracking-tight text-fg">Explore projects</h2>
              <p className="mt-1.5 text-sm text-fg-secondary">Open projects looking for teammates. Apply to the ones that fit your skills.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by skill or project name"
                aria-label="Search projects"
                className="w-full rounded-full border border-dark-subtle bg-dark-primary py-2.5 pl-10 pr-4 text-sm text-fg outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Category">
              {(['All', ...PROJECT_CATEGORIES] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={category === option}
                  onClick={() => setCategory(option)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                    category === option ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]' : 'bg-dark-tertiary text-fg hover:bg-dark-subtle'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 text-[13px] text-fg-secondary">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="cursor-pointer rounded-full bg-transparent py-1.5 pl-2 pr-1 text-[13px] text-fg-secondary outline-none hover:text-fg"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-dark-primary text-fg">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {viewerIsPro ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--btn-primary-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--btn-primary-fg)]">Pro</span>
              <select
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                aria-label="Filter by skill"
                className="cursor-pointer rounded-full border border-dark-subtle bg-dark-primary px-4 py-2 text-[13px] text-fg outline-none focus:border-accent-blue"
              >
                <option value="">Any skill</option>
                {skillsConfig.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
              <input
                type="search"
                value={roleInput}
                onChange={(event) => setRoleInput(event.target.value)}
                placeholder="Role, e.g. Designer"
                aria-label="Filter by role"
                className="w-48 rounded-full border border-dark-subtle bg-dark-primary px-4 py-2 text-[13px] text-fg outline-none focus:border-accent-blue"
              />
              {skill || roleInput ? (
                <button type="button" onClick={() => { setSkill(''); setRoleInput(''); setRole(''); }} className="text-[13px] font-medium text-accent-blue hover:underline">
                  Clear
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-fg-secondary">
              Want to filter by skill or role?{' '}
              <Link href="/profile/subscription" className="font-semibold text-accent-blue hover:underline">Pro members can</Link>.
            </p>
          )}

          {loading ? (
            <div className="mt-8"><ProjectCardSkeletonGrid /></div>
          ) : projectsError ? (
            <div className="mt-8 rounded-3xl bg-danger-bg p-10 text-center text-danger">{projectsError}</div>
          ) : displayedProjects.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-3xl bg-dark-secondary px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-primary text-fg">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
                </svg>
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-fg">
                {filtering ? 'No projects match' : 'No open projects yet'}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-secondary">
                {filtering
                  ? 'Try a different search or category.'
                  : 'kvelpo is just getting started. Post the first project and people with matching skills will see it here.'}
              </p>
              {!filtering ? (
                <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary mt-6 !px-5 !py-2.5 text-sm">
                  Post a project
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {displayedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => router.push(`/projects/${project.id}`)} />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <div ref={observerTarget} className="py-8">
              {loadingMore && <div className="text-center text-fg-secondary">Loading more projects...</div>}
            </div>
          )}
        </section>
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
  const ownerName = project.userFullName?.trim() ? project.userFullName.trim() : project.clerkUserId.slice(0, 12);
  const open = project.rolesNeededCount ?? 0;

  return (
    <article
      onClick={onClick}
      className="card-raised flex min-h-[220px] min-w-0 cursor-pointer flex-col gap-4 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-accent-blue/12">
          {project.avatarUrl ? (
            <Image
              src={project.avatarUrl}
              alt={`${ownerName} avatar`}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase text-accent-blue">
              {ownerName.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${encodeURIComponent(project.clerkUserId)}`}
              className="min-w-0 truncate text-[13px] font-medium text-fg hover:text-accent-blue"
              onClick={(e) => e.stopPropagation()}
            >
              {ownerName}
            </Link>
            {project.ownerVerified ? <VerifiedBadge className="h-3.5 w-3.5" /> : null}
          </div>
          <p className="text-xs text-dark-muted">{timeAgo(project.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {project.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/12 px-2.5 py-1 text-[11px] font-semibold text-accent-blue">
              Featured
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>
            </span>
          ) : null}
          {!project.isPublic ? (
            <span className="rounded-full bg-dark-tertiary px-2.5 py-1 text-[11px] font-medium text-fg-secondary">Private</span>
          ) : open > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Recruiting
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="text-[18px] font-semibold tracking-tight text-fg">{project.name}</h3>
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

      <div className="mt-auto flex items-center justify-between border-t border-dark-subtle pt-3.5">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-dark-muted">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8" />
          </svg>
          {open ? `${open} role${open > 1 ? 's' : ''} open` : 'No open roles'}
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
