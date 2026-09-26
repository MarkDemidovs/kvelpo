"use client";

import { useEffect, useState, type FormEvent } from "react";
import ExperienceTimeline from "~/app/_components/ExperienceTimeline";
import { MAX_EXPERIENCES, sortExperiences, type Experience } from "~/lib/experience";

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-card px-3.5 py-2.5 text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue";

type Draft = {
  title: string;
  organization: string;
  location: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  description: string;
};

const emptyDraft: Draft = {
  title: "",
  organization: "",
  location: "",
  startMonth: "",
  endMonth: "",
  isCurrent: false,
  description: "",
};

const toDraft = (item: Experience): Draft => ({
  title: item.title,
  organization: item.organization,
  location: item.location ?? "",
  startMonth: item.startDate.slice(0, 7),
  endMonth: item.endDate?.slice(0, 7) ?? "",
  isCurrent: item.endDate === null,
  description: item.description ?? "",
});

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Request failed (${res.status})`;
}

export default function ExperienceSection() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = form closed, "new" = adding, number = editing that entry.
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile/experience");
        if (!res.ok) throw new Error(await readError(res));
        setItems((await res.json()) as Experience[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const openForm = (target: Experience | "new") => {
    setError(null);
    setDraft(target === "new" ? emptyDraft : toDraft(target));
    setEditing(target === "new" ? "new" : target.id);
  };

  const closeForm = () => {
    setEditing(null);
    setDraft(emptyDraft);
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editing === null) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(editing === "new" ? "/api/profile/experience" : `/api/profile/experience/${editing}`, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          organization: draft.organization,
          location: draft.location,
          startMonth: draft.startMonth,
          endMonth: draft.isCurrent ? "" : draft.endMonth,
          description: draft.description,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));

      const saved = (await res.json()) as Experience;
      setItems((prev) => sortExperiences([...prev.filter((item) => item.id !== saved.id), saved]));
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Experience) => {
    if (!window.confirm(`Remove "${item.title}" at ${item.organization} from your experience?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/profile/experience/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (editing === item.id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <section className="card-raised space-y-4 p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-dark-primary">Experience</p>
          <p className="text-xs text-dark-secondary">Your work history, shown as a timeline on your public profile.</p>
        </div>
        {editing === null && items.length < MAX_EXPERIENCES ? (
          <button type="button" onClick={() => openForm("new")} className="btn-secondary !px-4 !py-2 text-sm">
            Add experience
          </button>
        ) : null}
      </div>

      {error ? <div className="rounded-xl bg-red-900/30 p-3 text-sm text-red-400">{error}</div> : null}

      {editing !== null ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4.5">
          <p className="text-sm font-semibold text-dark-primary">{editing === "new" ? "Add experience" : "Edit experience"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-dark-secondary">Title *</span>
              <input className={fieldClass} value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Frontend Developer" required maxLength={256} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark-secondary">Company or organization *</span>
              <input className={fieldClass} value={draft.organization} onChange={(e) => update("organization", e.target.value)} placeholder="e.g. Acme Inc." required maxLength={256} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark-secondary">Start date *</span>
              <input type="month" className={fieldClass} value={draft.startMonth} max={currentMonth} onChange={(e) => update("startMonth", e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-dark-secondary">End date</span>
              <input
                type="month"
                className={`${fieldClass} disabled:opacity-50`}
                value={draft.isCurrent ? "" : draft.endMonth}
                min={draft.startMonth || undefined}
                onChange={(e) => update("endMonth", e.target.value)}
                disabled={draft.isCurrent}
                required={!draft.isCurrent}
              />
            </label>
          </div>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.isCurrent}
              onChange={(e) => update("isCurrent", e.target.checked)}
              className="h-4 w-4 accent-[oklch(68%_0.18_240)]"
            />
            <span className="text-sm text-dark-primary">I currently work here</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Location</span>
            <input className={fieldClass} value={draft.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Riga, Latvia · Remote" maxLength={256} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Description</span>
            <textarea className={fieldClass} rows={4} value={draft.description} onChange={(e) => update("description", e.target.value)} placeholder="What did you work on?" maxLength={2000} />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeForm} className="btn-secondary !px-4 !py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-dark-muted">Loading experience...</p>
      ) : items.length === 0 ? (
        editing === null ? <p className="text-sm text-dark-muted">No experience added yet.</p> : null
      ) : (
        <ExperienceTimeline
          items={items}
          renderActions={(item) => (
            <>
              <button type="button" onClick={() => openForm(item)} className="text-xs font-semibold text-accent-blue hover:underline">
                Edit
              </button>
              <button type="button" onClick={() => void handleDelete(item)} className="text-xs font-semibold text-red-400 hover:underline">
                Delete
              </button>
            </>
          )}
        />
      )}
    </section>
  );
}
