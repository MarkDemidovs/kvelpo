"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

/*
 * Moderation controls shown only to kvelpo admins (the server decides who is
 * an admin and enforces it again on every action).
 */

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-tertiary px-3.5 py-2.5 text-sm text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue";

const barButton = "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-60";

async function send(url: string, method: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
}

function Dialog({
  title,
  description,
  onClose,
  onSubmit,
  submitLabel,
  danger,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  submitLabel: string;
  danger?: boolean;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handle}
        onClick={(e) => e.stopPropagation()}
        className="card-raised w-full max-w-md space-y-4 p-6"
        role="dialog"
        aria-modal="true"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-400">Admin</p>
          <h2 className="mt-1 text-lg font-semibold text-dark-primary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-dark-secondary">{description}</p> : null}
        </div>
        {children}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !px-4 !py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`${danger ? "rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" : "btn-primary !px-4 !py-2 text-sm"} disabled:opacity-60`}
          >
            {pending ? "Working..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReasonField({
  value,
  onChange,
  required,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-dark-secondary">{label}</span>
      <textarea className={fieldClass} rows={3} maxLength={1000} required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

type UserDialog = "warn" | "ban" | "unban" | null;

/** Warn / Ban / Unban for a user. Used on profiles and (for the owner) on projects. */
export function AdminUserActions({
  userId,
  userLabel,
  banned,
  projectId,
  onChanged,
}: {
  userId: string;
  userLabel: string;
  banned: boolean;
  projectId?: number;
  /** Reload hook for client-fetched pages; server pages just refresh. */
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<UserDialog>(null);
  const [reason, setReason] = useState("");
  const close = () => {
    setDialog(null);
    setReason("");
  };
  const act = async (action: Exclude<UserDialog, null>) => {
    await send(`/api/admin/users/${encodeURIComponent(userId)}`, "POST", { action, reason, projectId });
    close();
    if (onChanged) onChanged();
    else router.refresh();
  };

  return (
    <>
      <button type="button" onClick={() => setDialog("warn")} className={`${barButton} border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10`}>
        Warn
      </button>
      {banned ? (
        <button type="button" onClick={() => setDialog("unban")} className={`${barButton} border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10`}>
          Unban
        </button>
      ) : (
        <button type="button" onClick={() => setDialog("ban")} className={`${barButton} border-red-500/60 text-red-400 hover:bg-red-500/10`}>
          Ban
        </button>
      )}

      {dialog === "warn" ? (
        <Dialog
          title={`Warn ${userLabel}`}
          description="They'll see this as a notification in their inbox."
          onClose={close}
          onSubmit={() => act("warn")}
          submitLabel="Send warning"
        >
          <ReasonField label="Warning message *" value={reason} onChange={setReason} required />
        </Dialog>
      ) : null}
      {dialog === "ban" ? (
        <Dialog
          title={`Ban ${userLabel}?`}
          description="They'll be signed out and can't sign in again. Their projects and profile are hidden from everyone but admins. You can unban them later from the admin panel."
          onClose={close}
          onSubmit={() => act("ban")}
          submitLabel="Ban user"
          danger
        >
          <ReasonField label="Reason (for the admin log) *" value={reason} onChange={setReason} required />
        </Dialog>
      ) : null}
      {dialog === "unban" ? (
        <Dialog
          title={`Unban ${userLabel}?`}
          description="They'll be able to sign in again and their projects and profile become visible."
          onClose={close}
          onSubmit={() => act("unban")}
          submitLabel="Unban"
        >
          <ReasonField label="Note (optional)" value={reason} onChange={setReason} />
        </Dialog>
      ) : null}
    </>
  );
}

function Bar({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-400">Admin</span>
      {children}
      {note ? <span className="ml-auto text-xs font-semibold text-red-400">{note}</span> : null}
    </div>
  );
}

/** Edit / Delete / Warn owner / Ban owner for a project. */
export function AdminProjectBar({
  project,
  onEdited,
}: {
  project: { id: number; name: string; description: string | null; isPublic: boolean; clerkUserId: string; ownerLabel: string; ownerBanned: boolean };
  onEdited: () => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [reason, setReason] = useState("");

  const openEdit = () => {
    setName(project.name);
    setDescription(project.description ?? "");
    setIsPublic(project.isPublic);
    setReason("");
    setDialog("edit");
  };
  const close = () => {
    setDialog(null);
    setReason("");
  };

  return (
    <Bar note={project.ownerBanned ? "Owner is banned: hidden from users" : undefined}>
      <button type="button" onClick={openEdit} className={`${barButton} border-dark-subtle text-dark-primary hover:bg-dark-tertiary`}>
        Edit
      </button>
      <button type="button" onClick={() => setDialog("delete")} className={`${barButton} border-red-500/60 text-red-400 hover:bg-red-500/10`}>
        Delete
      </button>
      <span className="mx-1 h-4 w-px bg-dark-subtle" aria-hidden="true" />
      <span className="text-xs text-dark-muted">Owner:</span>
      <AdminUserActions userId={project.clerkUserId} userLabel={project.ownerLabel} banned={project.ownerBanned} projectId={project.id} onChanged={onEdited} />

      {dialog === "edit" ? (
        <Dialog
          title="Edit project"
          description="The owner is notified that the kvelpo team edited it."
          onClose={close}
          onSubmit={async () => {
            await send(`/api/admin/projects/${project.id}`, "PATCH", { name, description, isPublic, reason });
            close();
            onEdited();
          }}
          submitLabel="Save changes"
        >
          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Name *</span>
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={256} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Description</span>
            <textarea className={fieldClass} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-[oklch(68%_0.18_240)]" />
            <span className="text-sm text-dark-primary">Public (visible to everyone)</span>
          </label>
          <ReasonField label="Reason (optional, shown to the owner)" value={reason} onChange={setReason} />
        </Dialog>
      ) : null}
      {dialog === "delete" ? (
        <Dialog
          title={`Delete "${project.name}"?`}
          description="This permanently removes the project, its roles, applications and chat. The owner is notified with your reason."
          onClose={close}
          onSubmit={async () => {
            await send(`/api/admin/projects/${project.id}`, "DELETE", { reason });
            router.push("/projects");
          }}
          submitLabel="Delete project"
          danger
        >
          <ReasonField label="Reason (shown to the owner) *" value={reason} onChange={setReason} required />
        </Dialog>
      ) : null}
    </Bar>
  );
}

/** Warn / Ban / Unban on a user's profile. */
export function AdminUserBar({ userId, userLabel, banned }: { userId: string; userLabel: string; banned: boolean }) {
  return (
    <Bar note={banned ? "Banned: profile and projects hidden from users" : undefined}>
      <AdminUserActions userId={userId} userLabel={userLabel} banned={banned} />
    </Bar>
  );
}
