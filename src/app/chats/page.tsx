'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useChatWidget } from '~/app/_components/ChatContext';
import { ConversationCardSkeletonGrid } from '~/app/_components/Skeleton';
import SignInRequired from "~/app/_components/SignInRequired";

interface ConversationProject {
  id: number;
  name: string | null;
}

export default function ChatsPage() {
  const { isSignedIn } = useAuth();
  const { openChat } = useChatWidget();
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
    return <SignInRequired title="Sign in to access chats" message="You need to be signed in to view your conversations." />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 bg-dark-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-dark-primary">Chats</h1>
        <p className="mt-2 text-dark-secondary">Every project you own or belong to gets a chat here.</p>
      </div>

      {loading ? (
        <ConversationCardSkeletonGrid />
      ) : error ? (
        <div className="card-raised p-10 text-center text-red-400">
          {error}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card-raised p-10 text-center text-dark-secondary">
          <h2 className="text-xl font-semibold text-dark-primary mb-2">No conversations yet</h2>
          <p className="text-dark-secondary">Join projects or create your own to start conversations.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {conversations.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => openChat(project.id)}
              className="card-raised block p-5 text-left"
            >
              <p className="label-eyebrow">Project</p>
              <h3 className="mt-2 truncate text-[17px] font-semibold text-dark-primary">
                {project.name ?? 'Untitled Project'}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-dark-secondary">Open conversation</span>
                <svg className="h-4 w-4 text-accent-blue" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                  <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
