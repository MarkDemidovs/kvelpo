'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

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

export default function ProjectsPage() {
  const { isSignedIn, userId } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'recommended'>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/projects?mode=public');
        const data = (await res.json().catch(() => null)) as unknown;

        if (!res.ok) {
          throw new Error(`Failed to fetch projects (${res.status})`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response format from project API');
        }

        setAllProjects(data as Project[]);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setAllProjects([]);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  const filteredProjects = (() => {
    switch (filter) {
      case 'my':
        return isSignedIn ? allProjects.filter((p) => p.clerkUserId === userId) : [];
      case 'recommended':
        return isSignedIn ? allProjects.filter((p) => p.clerkUserId !== userId) : allProjects;
      default:
        return allProjects;
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-dark-primary">Projects</h1>
        <p className="mt-2 text-dark-secondary">Browse and discover projects to collaborate on.</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-dark-subtle pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-accent-blue text-dark-primary'
              : 'bg-dark-tertiary text-dark-secondary hover:bg-dark-card'
          }`}
        >
          All Projects
        </button>
        {isSignedIn && (
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'my'
                ? 'bg-accent-blue text-dark-primary'
                : 'bg-dark-tertiary text-dark-secondary hover:bg-dark-card'
            }`}
          >
            My Projects
          </button>
        )}
        {isSignedIn && (
          <button
            onClick={() => setFilter('recommended')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'recommended'
                ? 'bg-accent-blue text-dark-primary'
                : 'bg-dark-tertiary text-dark-secondary hover:bg-dark-card'
            }`}
          >
            Recommended
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
          Loading projects...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-red-400">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
          <h2 className="text-xl font-semibold text-dark-primary mb-2">No projects found</h2>
          <p className="text-dark-secondary">
            {filter === 'my' ? 'You haven\'t created any projects yet.' : 'No projects available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/?project=${project.id}`}
              className="block min-h-[200px] overflow-hidden rounded-3xl border border-dark-subtle bg-dark-card p-6 transition hover:border-dark hover:bg-dark-tertiary"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Project</p>
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
                <p className="mt-3 text-sm leading-6 text-dark-muted">No description provided.</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-dark-secondary">
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
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
                  <span className="truncate">
                    {project.userFullName?.trim() ? project.userFullName.trim() : project.clerkUserId}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}