'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface ConversationProject {
  id: number;
  name: string | null;
}

export default function ChatsPage() {
  const { isSignedIn } = useAuth();
  const [conversations, setConversations] = useState<ConversationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/conversations');
        if (!res.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await res.json() as ConversationProject[];
        setConversations(data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    void fetchConversations();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 bg-dark-primary">
        <div className="rounded-3xl border border-dark-subtle bg-dark-card p-10 text-center">
          <h1 className="text-2xl font-semibold text-dark-primary mb-4">Sign in to access chats</h1>
          <p className="text-dark-secondary">You need to be signed in to view your conversations.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-dark-primary">Chats</h1>
        <p className="mt-2 text-dark-secondary">View and manage your project conversations.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
          Loading conversations...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-red-400">
          {error}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-3xl bg-dark-card p-10 text-center text-dark-secondary">
          <h2 className="text-xl font-semibold text-dark-primary mb-2">No conversations yet</h2>
          <p className="text-dark-secondary">Join projects or create your own to start conversations.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conversations.map((project) => (
            <Link
              key={project.id}
              href={`/?project=${project.id}`}
              className="block rounded-3xl border border-dark-subtle bg-dark-card p-6 transition hover:border-accent-blue hover:bg-dark-tertiary"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Project</p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-dark-primary">
                    {project.name ?? 'Untitled Project'}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-dark-secondary">Open conversation</span>
                <svg className="h-5 w-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}