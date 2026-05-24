"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface Conversation {
  id: number;
  name: string;
}

interface Message {
  id: number;
  projectId: number;
  clerkUserId: string;
  message: string;
  createdAt: string;
  senderName: string | null;
}

export default function ChatPopup() {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn || !isOpen) return;

    const controller = new AbortController();
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations", { signal: controller.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Conversation[];
        setConversations(data);
        // Auto-select first conversation
        const firstConversation = data[0];
        if (firstConversation) {
          setSelectedProjectId(firstConversation.id);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to load conversations:", error);
        }
      }
    };

    void fetchConversations();
    return () => controller.abort();
  }, [isSignedIn, isOpen]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const controller = new AbortController();
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?projectId=${selectedProjectId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Message[];
        setMessages(data.reverse());
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to load messages:", error);
        }
      }
    };

    void fetchMessages();

    const interval = setInterval(() => {
      void fetchMessages();
    }, 3000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [selectedProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          message: messageInput,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setMessageInput("");

      const messagesRes = await fetch(`/api/messages?projectId=${selectedProjectId}`);
      if (messagesRes.ok) {
        const data = (await messagesRes.json()) as Message[];
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 transition flex items-center justify-center h-14 w-14"
          aria-label="Open chat"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      ) : (
        <div className="w-96 h-[500px] rounded-xl border border-slate-300 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">Messages</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-slate-200 bg-slate-50 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">No conversations</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedProjectId(conv.id)}
                    className={`w-full px-3 py-2 text-left text-sm border-b border-slate-200 transition ${
                      selectedProjectId === conv.id
                        ? "bg-blue-50 text-blue-900 font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <p className="truncate">{conv.name}</p>
                  </button>
                ))
              )}
            </div>

            <div className="flex-1 flex flex-col bg-white">
              {selectedProjectId ? (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex flex-col text-xs"
                      >
                        <p className="font-semibold text-slate-600">
                          {msg.senderName ?? msg.clerkUserId.slice(0, 8)}
                        </p>
                        <p className="text-slate-800 break-words">{msg.message}</p>
                        <p className="text-[0.7rem] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !messageInput.trim()}
                        className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSending ? "..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
