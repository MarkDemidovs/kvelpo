"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChatWidget } from "./ChatContext";

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
  const { isOpen, selectedProjectId, openChat, closeChat, setSelectedProjectId } = useChatWidget();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn || !isOpen) return;

    // A specific conversation was already requested (e.g. from the Chats
    // page) — jump straight to it instead of the list.
    setShowConversationList(!selectedProjectId);

    const controller = new AbortController();
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations", { signal: controller.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Conversation[];
        setConversations(data);
        // Auto-select the first conversation only if nothing was already requested.
        const firstConversation = data[0];
        if (!selectedProjectId && firstConversation) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const selectedConversation = conversations.find(c => c.id === selectedProjectId);

  const messageBubble = (msg: Message) => (
    <div key={msg.id} className="flex flex-col gap-0.5 text-xs">
      <p className="font-semibold text-dark-muted">
        {msg.senderName ?? msg.clerkUserId.slice(0, 8)}
      </p>
      <p className="break-words rounded-2xl rounded-bl-md bg-dark-tertiary px-3 py-2 text-[13px] text-dark-secondary">{msg.message}</p>
      <p className="text-[0.65rem] text-dark-muted">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {!isOpen ? (
        <button
          onClick={() => openChat()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue text-white shadow-lg transition hover:opacity-90"
          aria-label="Open chat"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      ) : (
        <>
          {/* Mobile Full Screen Chat */}
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => closeChat()} />
          <div className="fixed inset-0 z-50 flex flex-col bg-dark-card md:hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-dark-subtle p-4">
              {selectedProjectId && showConversationList ? (
                <h3 className="font-semibold text-dark-primary">Conversations</h3>
              ) : (
                <div className="flex items-center gap-2">
                  {selectedProjectId && (
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="rounded p-1 hover:bg-dark-tertiary"
                    >
                      <svg className="h-5 w-5 text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <h3 className="font-semibold text-dark-primary">{selectedConversation?.name ?? "Messages"}</h3>
                </div>
              )}
              <button
                onClick={() => closeChat()}
                className="rounded-full p-1 text-dark-muted hover:bg-dark-tertiary hover:text-dark-primary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {showConversationList ? (
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-dark-secondary">No conversations</div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedProjectId(conv.id);
                          setShowConversationList(false);
                        }}
                        className="w-full border-b border-dark-subtle px-4 py-3 text-left transition hover:bg-dark-tertiary"
                      >
                        <p className="font-medium text-dark-primary">{conv.name}</p>
                      </button>
                    ))
                  )}
                </div>
              ) : selectedProjectId ? (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-dark-secondary">
                        No messages yet. Start a conversation!
                      </div>
                    ) : (
                      messages.map(messageBubble)
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={(e) => void handleSendMessage(e)} className="border-t border-dark-subtle p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full border border-dark-subtle bg-dark-tertiary px-3.5 py-2 text-sm text-dark-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !messageInput.trim()}
                        className="rounded-full bg-accent-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isSending ? "..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-dark-secondary">
                  Select a conversation
                </div>
              )}
            </div>
          </div>

          {/* Desktop Chat Window */}
          <div className="hidden flex-col overflow-hidden rounded-2xl border border-dark-subtle bg-dark-card shadow-[0_40px_80px_-20px_rgba(0,0,0,0.85)] md:flex md:h-[500px] md:w-96 lg:h-[600px] lg:w-[28rem]">
            <div className="flex items-center justify-between gap-3 border-b border-dark-subtle p-4">
              <h3 className="font-semibold text-dark-primary">Messages</h3>
              <button
                onClick={() => closeChat()}
                className="rounded-full p-1 text-dark-muted hover:bg-dark-tertiary hover:text-dark-primary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 overflow-y-auto border-r border-dark-subtle">
                {conversations.length === 0 ? (
                  <div className="p-3 text-sm text-dark-secondary">No conversations</div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedProjectId(conv.id)}
                      className={`w-full border-b border-dark-subtle px-3 py-2.5 text-left text-sm transition ${
                        selectedProjectId === conv.id
                          ? "bg-dark-tertiary font-medium text-dark-primary"
                          : "text-dark-secondary hover:bg-dark-tertiary"
                      }`}
                    >
                      <p className="truncate">{conv.name}</p>
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-1 flex-col">
                {selectedProjectId ? (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
                      {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-dark-secondary">
                          No messages yet
                        </div>
                      ) : (
                        messages.map(messageBubble)
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={(e) => void handleSendMessage(e)} className="border-t border-dark-subtle p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 rounded-full border border-dark-subtle bg-dark-tertiary px-3 py-1.5 text-xs text-dark-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                          disabled={isSending}
                        />
                        <button
                          type="submit"
                          disabled={isSending || !messageInput.trim()}
                          className="rounded-full bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isSending ? "..." : "Send"}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-dark-secondary">
                    Select a conversation
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
