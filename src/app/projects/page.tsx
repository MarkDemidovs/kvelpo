'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import SignInRequired from '~/app/_components/SignInRequired';
import { useInbox } from '~/app/_components/InboxContext';
import { ProjectCardSkeletonGrid } from '~/app/_components/Skeleton';

interface Project {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  rolesNeededCount?: number;
  featured?: boolean;
}

const timeAgo = (value: string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  return `Posted ${days} days ago`;
};

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function MyProjectsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { applications } = useInbox();
  const [owned, setOwned] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    const controller = new AbortController();
    setLoading(true);
    fetch('/api/projects?mode=own&limit=100', { signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok || !Array.isArray(data)) throw new Error(`Failed to load your projects (${res.status})`);
        setOwned(data as Project[]);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isSignedIn]);

  if (isLoaded && !isSignedIn) {
    return <SignInRequired title="Sign in to see your projects" message="Projects you start or join show up here." />;
  }

  const joined = applications.filter((application) => application.status === 'accepted' && application.projectId);

  return (
    <main className="min-h-screen bg-dark-primary pt-14 text-fg">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[36px] font-bold tracking-tight text-fg sm:text-[44px]">My projects</h1>
            <p className="mt-2 text-[15px] text-fg-secondary">Projects you started or joined, all in one place.</p>
          </div>
          <Link href="/?create=true" className="btn-primary !px-5 !py-2.5 text-sm">
            <PlusIcon />
            New project
          </Link>
        </div>

        <section className="mt-10">
          <p className="text-sm font-medium text-fg-secondary">Started by you &middot; {owned.length}</p>
          {loading ? (
            <div className="mt-4"><ProjectCardSkeletonGrid count={3} /></div>
          ) : error ? (
            <div className="mt-4 rounded-2xl bg-danger-bg p-6 text-center text-danger">{error}</div>
          ) : owned.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-3xl bg-dark-secondary px-6 py-14 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-fg">You haven&apos;t started a project yet</h2>
              <p className="mt-2 max-w-sm text-sm text-fg-secondary">Post your idea and choose who joins your team.</p>
              <Link href="/?create=true" className="btn-primary mt-6 !px-5 !py-2.5 text-sm">Post a project</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {owned.map((project) => {
                const open = project.rolesNeededCount ?? 0;
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="card-raised flex min-w-0 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-dark-tertiary px-2.5 py-1 text-[11px] font-medium text-fg-secondary">Owner</span>
                      {!project.isPublic ? (
                        <span className="rounded-full bg-dark-tertiary px-2.5 py-1 text-[11px] font-medium text-fg-secondary">Private</span>
                      ) : open > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          Recruiting
                        </span>
                      ) : null}
                      {project.featured ? (
                        <span className="rounded-full bg-accent-blue/12 px-2.5 py-1 text-[11px] font-semibold text-accent-blue">Featured</span>
                      ) : null}
                    </div>
                    <h3 className="text-[18px] font-semibold tracking-tight text-fg">{project.name}</h3>
                    <p className="line-clamp-2 text-sm leading-snug text-fg-secondary">{project.description ?? 'No description provided.'}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-dark-subtle pt-3.5 text-[13px]">
                      <span className="text-dark-muted">{timeAgo(project.createdAt)} &middot; {open} role{open === 1 ? '' : 's'} open</span>
                      <span className="font-semibold text-accent-blue">Manage &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <p className="text-sm font-medium text-fg-secondary">Joined &middot; {joined.length}</p>
          {joined.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-dark-secondary p-6 text-sm text-fg-secondary">
              Projects you join will show up here. <Link href="/" className="font-semibold text-accent-blue hover:underline">Browse projects</Link> and apply to a role.
            </p>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {joined.map((application) => (
                <Link key={application.id} href={`/projects/${application.projectId}`} className="card-raised flex min-w-0 flex-col gap-2 p-5">
                  <span className="w-fit rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-medium text-success">Member</span>
                  <h3 className="text-[18px] font-semibold tracking-tight text-fg">{application.projectName ?? 'Project'}</h3>
                  <p className="text-sm text-fg-secondary">{application.roleTitle ?? 'Team member'}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
