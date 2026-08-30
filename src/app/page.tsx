'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import CreateProjectModal from './CreateProjectModal';
import Reveal from './_components/Reveal';
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

function LandingView() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-dark-primary text-dark-primary">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-60 blur-2xl sm:h-[820px] sm:w-[820px]"
          style={{ background: 'radial-gradient(circle, oklch(68% 0.18 240 / 0.16), transparent 68%)' }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-16 pt-16 sm:flex-row sm:items-center sm:justify-between sm:pb-20 sm:pt-24">
          <Reveal className="max-w-xl text-center sm:text-left">
            <h1 className="text-5xl font-extrabold leading-[0.98] tracking-tight text-dark-primary sm:text-7xl">
              Stop building<br />alone.
            </h1>
            <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-dark-secondary sm:mx-0">
              Post a project, list the roles you need, and review who applies. No cold outreach, no group chats full of strangers.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5 sm:justify-start">
              <SignInButton>
                <button type="button" className="btn-primary">Create a project</button>
              </SignInButton>
              <Link href="/projects" className="btn-secondary">Browse open projects</Link>
            </div>
          </Reveal>

          <Reveal delayMs={150} className="flex flex-col items-center gap-7 sm:items-end">
            <div className="relative h-[220px] w-[260px] sm:h-[320px] sm:w-[300px]">
              {[
                { left: 250, top: 6, size: 16, accent: false },
                { left: 205, top: 44, size: 13, accent: false },
                { left: 160, top: 82, size: 17, accent: true },
                { left: 112, top: 120, size: 13, accent: false },
                { left: 78, top: 154, size: 11, accent: false },
                { left: 44, top: 104, size: 13, accent: false },
                { left: 52, top: 148, size: 9, accent: false },
                { left: 52, top: 192, size: 9, accent: false },
                { left: 44, top: 236, size: 13, accent: false },
                { left: 78, top: 186, size: 11, accent: false },
                { left: 112, top: 220, size: 13, accent: false },
                { left: 160, top: 258, size: 17, accent: true },
                { left: 205, top: 296, size: 13, accent: false },
                { left: 250, top: 334, size: 16, accent: false },
              ].map((dot, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: dot.left * 0.87,
                    top: dot.top * 0.87,
                    width: dot.size,
                    height: dot.size,
                    background: dot.accent ? 'oklch(68% 0.18 240)' : '#ffffff',
                    boxShadow: dot.accent
                      ? `0 0 ${dot.size * 1.4}px ${dot.size * 0.35}px oklch(68% 0.18 240 / 0.55)`
                      : `0 0 ${dot.size * 1.4}px ${dot.size * 0.3}px rgba(255,255,255,0.35)`,
                    animation: `kvelpo-twinkle 4s ease-in-out ${(i % 7) * 0.4}s infinite`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-2.5 text-center sm:items-end sm:text-right">
              <p className="text-sm text-dark-muted">Post what you&apos;re building.</p>
              <p className="text-sm text-dark-muted">Get real applicants, not just views.</p>
              <p className="text-sm text-dark-muted">Chat once they&apos;re in.</p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="border-t border-dark-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="label-eyebrow">How it works</p>
            <div className="mt-11 grid gap-14 sm:grid-cols-3">
              {[
                { n: '01', title: 'Post your project', body: 'Name it, describe it, and list the roles you need — how many people, what for.' },
                { n: '02', title: 'Review applicants', body: 'Anyone can apply with a short message. Accept who fits, decline the rest.' },
                { n: '03', title: 'Work in one place', body: "Accepted members get a project chat automatically — no extra tools to set up." },
              ].map((step) => (
                <div key={step.n}>
                  <span className="text-sm font-semibold text-accent-blue">{step.n}</span>
                  <h3 className="mt-3.5 text-xl font-semibold tracking-tight text-dark-primary">{step.title}</h3>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-dark-secondary">{step.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* BOTH SIDES */}
      <section className="border-t border-dark-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <div className="grid gap-16 sm:grid-cols-2">
              <div>
                <p className="label-eyebrow">If you&apos;re starting something</p>
                <h3 className="mt-4.5 text-[28px] font-bold leading-tight tracking-tight text-dark-primary">Post it, and say what you need</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-dark-secondary">Describe what you&apos;re building and list the roles you&apos;re missing — a designer, a backend developer, however many spots each one has open. Applicants come to you.</p>
                <div className="card-raised mt-7 flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-semibold text-dark-primary">Product designer</p>
                    <p className="mt-0.5 text-xs text-dark-muted">1 spot open</p>
                  </div>
                  <span className="btn-secondary shrink-0 !px-4 !py-2 text-xs">Apply</span>
                </div>
              </div>
              <div>
                <p className="label-eyebrow">If you want in on one</p>
                <h3 className="mt-4.5 text-[28px] font-bold leading-tight tracking-tight text-dark-primary">Apply, and hear back directly</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-dark-secondary">Browse open projects, apply to the roles that fit with a short message, and hear back from the person actually running it — not a form that goes nowhere.</p>
                <div className="card-raised mt-7 flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-semibold text-dark-primary">Your application</p>
                    <p className="mt-0.5 text-xs text-dark-muted">Weekend recipe app &middot; Designer</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-dark-tertiary px-4 py-2 text-xs font-semibold text-accent-blue">Pending</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CHAT */}
      <section className="border-t border-dark-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal className="grid gap-16 sm:grid-cols-[1.1fr_1fr] sm:items-center">
            <div>
              <p className="label-eyebrow">Once you&apos;re in</p>
              <h3 className="mt-4.5 text-3xl font-bold leading-tight tracking-tight text-dark-primary">No extra tools to set up</h3>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dark-secondary">Every project gets its own chat the moment someone&apos;s accepted. Members talk, share updates, and coordinate right there — no separate Discord, no group chat full of strangers.</p>
            </div>
            <div className="card-raised flex flex-col gap-3.5 p-6">
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs text-dark-muted">Sara K.</span>
                <span className="rounded-2xl rounded-bl-md bg-dark-tertiary px-3.5 py-2 text-sm text-dark-secondary">Just pushed the new onboarding screens</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-dark-muted">You</span>
                <span className="rounded-2xl rounded-br-md bg-accent-blue px-3.5 py-2 text-sm text-white">Looks great, testing now</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="border-t border-dark-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <div className="flex items-baseline justify-between">
              <p className="label-eyebrow">Plans</p>
              <Link href="/profile/subscription" className="text-sm text-dark-secondary hover:text-dark-primary">See full pricing &rarr;</Link>
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              {[
                { name: 'Free', price: '$0', note: '1 active project' },
                { name: 'Pro', price: '$10/mo', note: '3 active projects' },
                { name: 'Team', price: '$30/mo', note: '10 active projects' },
              ].map((plan) => (
                <div key={plan.name} className="card-raised p-8">
                  <p className="text-[15px] font-semibold text-dark-primary">{plan.name}</p>
                  <p className="mt-2.5 text-[32px] font-bold text-dark-primary">{plan.price}</p>
                  <p className="mt-2 text-sm text-dark-secondary">{plan.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-dark-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="label-eyebrow">A few things people ask</p>
            <div className="mt-9 grid gap-9 sm:grid-cols-2">
              {[
                { q: 'Does it cost anything to post a project?', a: 'No. Posting a project and applying to roles is free. Paid plans only raise how many active projects you can run at once.' },
                { q: 'What happens after I apply?', a: "The project owner sees your message and accepts or declines. You'll see the status update in your inbox either way." },
                { q: 'Can I be part of more than one project?', a: "Yes, there's no limit on how many projects you can join as a member. Plan limits only apply to projects you own." },
                { q: 'Do I need another app to talk to my team?', a: 'No. Accepted members get a project chat built in from day one.' },
              ].map((item) => (
                <div key={item.q}>
                  <h4 className="text-base font-semibold text-dark-primary">{item.q}</h4>
                  <p className="mt-2.5 text-sm leading-relaxed text-dark-secondary">{item.a}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-dark-subtle">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
          style={{ background: 'radial-gradient(circle, oklch(68% 0.18 240 / 0.15), transparent 68%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold tracking-tight text-dark-primary">Ready to stop building alone?</h2>
            <div className="mt-7">
              <SignInButton>
                <button type="button" className="btn-primary">Create a project</button>
              </SignInButton>
            </div>
          </Reveal>
        </div>
      </section>

      <style jsx global>{`
        @keyframes kvelpo-twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
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
        setDisplayedProjects(prev => [...prev, ...newProjects]);
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
    <main className="min-h-screen overflow-x-hidden bg-dark-primary pt-24 text-dark-primary">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-56 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
          style={{ background: 'radial-gradient(circle, oklch(68% 0.18 240 / 0.12), transparent 68%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          {/* Plain-language header + one obvious action */}
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-[34px] font-bold tracking-tight text-dark-primary">Find people to build with</h1>
              <p className="mt-2 text-[15px] text-dark-secondary">Browse open projects below, or start your own and pick who joins.</p>
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
              <p className="text-sm text-dark-secondary">
                <span className="font-semibold text-dark-primary">New here?</span>{' '}
                Create a project to find teammates, or open any project below to apply.
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setBannerDismissed(true)}
                className="shrink-0 rounded-full p-1 text-dark-muted hover:text-dark-primary"
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
            <div className="card-raised mt-10 p-10 text-center text-red-400">{projectsError}</div>
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
                  <div className="card-raised mt-5 p-10 text-center text-dark-secondary">No open projects yet — be the first to post one.</div>
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
                  {loadingMore && <div className="text-center text-dark-secondary">Loading more projects...</div>}
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
            <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-[11px] font-semibold uppercase text-dark-primary">
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
        <h3 className="text-[17px] font-semibold text-dark-primary">{project.name}</h3>
        {project.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-dark-secondary">{project.description}</p>
        ) : (
          <p className="mt-1.5 text-sm text-dark-muted">No description provided.</p>
        )}
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-dark-secondary">
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
  return isSignedIn ? <HomeFeedContent /> : <LandingView />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
