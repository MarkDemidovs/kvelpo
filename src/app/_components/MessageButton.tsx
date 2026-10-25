"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Opens (or creates) a direct-message thread with `userId` and goes to it in Messages. */
export default function MessageButton({ userId, name, className = "btn-secondary w-full" }: { userId: string; name: string; className?: string }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    if (isLoaded && !isSignedIn) {
      openSignIn({ forceRedirectUrl: window.location.href });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
      if (!res.ok || typeof data?.id !== "number") throw new Error(data?.error ?? "Couldn't open the chat.");
      router.push(`/chats?dm=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={() => void open()} disabled={busy} className={`${className} disabled:opacity-60`}>
        {busy ? "Opening..." : name ? `Message ${name}` : "Message"}
      </button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
