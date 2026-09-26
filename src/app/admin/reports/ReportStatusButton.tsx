"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReportStatusButton({ reportId, status }: { reportId: number; status: "open" | "resolved" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = status === "open" ? "resolved" : "open";

  const update = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void update()}
        disabled={pending}
        className={`${status === "open" ? "btn-primary" : "btn-secondary"} !px-4 !py-2 text-sm disabled:opacity-60`}
      >
        {pending ? "Saving..." : status === "open" ? "Mark resolved" : "Reopen"}
      </button>
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}
