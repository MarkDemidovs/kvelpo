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

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-accent-blue text-white' : 'bg-dark-tertiary text-dark-secondary hover:bg-dark-card'
    }`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Projects</h1>
        <p className="mt-2 text-dark-secondary">Browse and discover projects to collaborate on.</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-7 flex gap-2 border-b border-dark-subtle pb-5">
        <button onClick={() => setFilter('all')} className={tabClass(filter === 'all')}>
          All Projects
        </button>
        {isSignedIn && (
          <button onClick={() => setFilter('my')} className={tabClass(filter === 'my')}>
            My Projects
          </button>
        )}
        {isSignedIn && (
          <button onClick={() => setFilter('recommended')} className={tabClass(filter === 'recommended')}>
            Recommended
          </button>
        )}
      </div>

      {loading ? (
        <div className="card-raised p-10 text-center text-dark-secondary">
          Loading projects...
        </div>
      ) : error ? (
        <div className="card-raised p-10 text-center text-red-400">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-raised p-10 text-center text-dark-secondary">
          <h2 className="text-xl font-semibold text-dark-primary mb-2">No projects found</h2>
          <p className="text-dark-secondary">
            {filter === 'my' ? 'You haven\'t created any projects yet.' : 'No projects available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card-raised block p-5"
            >
              <p className="label-eyebrow">Project</p>
              <h3 className="mt-2 truncate text-[17px] font-semibold text-dark-primary">
                {project.name}
              </h3>
              {project.description ? (
                <p className="mt-2.5 text-sm leading-6 text-dark-secondary line-clamp-2 break-words">
                  {project.description}
                </p>
              ) : (
                <p className="mt-2.5 text-sm leading-6 text-dark-muted">No description provided.</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-dark-secondary">
                <span className="text-xs text-dark-muted">{new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="h-1 w-1 rounded-full bg-dark-subtle" />
                <div className="flex items-center gap-2">
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
                      <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-xs font-semibold uppercase text-dark-primary">
                        {(project.userFullName ?? project.clerkUserId).slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="truncate text-[13px]">
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
