"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatContextValue {
  isOpen: boolean;
  selectedProjectId: number | null;
  openChat: (projectId?: number) => void;
  closeChat: () => void;
  setSelectedProjectId: (id: number | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const openChat = (projectId?: number) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
    setIsOpen(true);
  };

  const closeChat = () => setIsOpen(false);

  return (
    <ChatContext.Provider value={{ isOpen, selectedProjectId, openChat, closeChat, setSelectedProjectId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatWidget() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatWidget must be used within a ChatProvider");
  }
  return ctx;
}
