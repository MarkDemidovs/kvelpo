"use client";

import { useEffect, useState } from "react";
import skillsConfig from "~/data/skills.json";
import { PROJECT_CATEGORIES, isProjectCategory, type ProjectCategory } from "~/lib/categories";

export interface EditableProject {
  id: number;
  name: string;
  description: string | null;
  category?: string | null;
  tags: string[];
  isPublic: boolean;
  isDraft?: boolean;
  rolesNeeded: { id: number; title: string; description: string | null; slotsNeeded: number }[];
}

interface RoleDraft {
  id: number | null;
  title: string;
  description: string;
  slotsNeeded: number;
}

const DESCRIPTION_LIMIT = 500;

const inputClass =
  "mt-2 block w-full rounded-xl border border-dark-subtle bg-dark-primary px-3.5 py-3 text-[15px] text-fg outline-none placeholder:text-dark-muted focus:border-accent-blue focus:ring-1 focus:ring-accent-blue";

/** Owner-only editor for everything about a project: details, visibility and roles. */
export default function EditProjectModal({ project, onClose, onSaved }: { project: EditableProject; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [category, setCategory] = useState<ProjectCategory | null>(isProjectCategory(project.category) ? project.category : null);
  const [tags, setTags] = useState<string[]>(project.tags);
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [roles, setRoles] = useState<RoleDraft[]>(
    project.rolesNeeded.map((role) => ({ id: role.id, title: role.title, description: role.description ?? "", slotsNeeded: role.slotsNeeded })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const updateRole = (index: number, patch: Partial<RoleDraft>) =>
    setRoles((prev) => prev.map((role, i) => (i === index ? { ...role, ...patch } : role)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          tags,
          ...(project.isDraft ? {} : { isPublic }),
          rolesNeeded: roles.map((role) => ({ id: role.id, title: role.title, description: role.description, slotsNeeded: role.slotsNeeded })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Couldn't save your changes.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-dark-primary" role="dialog" aria-modal="true" aria-label="Edit project">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cancel
        </button>

        <h1 className="mt-6 text-[34px] font-bold leading-tight tracking-tight text-fg">Edit project</h1>
        <p className="mt-2 text-[15px] text-fg-secondary">Changes show up for everyone as soon as you save.</p>

        {error ? <p className="mt-6 rounded-xl bg-danger-bg p-3 text-sm text-danger">{error}</p> : null}

        <div className="mt-8 space-y-7">
          <div>
            <label htmlFor="edit-name" className="text-sm font-medium text-fg">Project name</label>
            <input id="edit-name" type="text" value={name} maxLength={256} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="edit-description" className="text-sm font-medium text-fg">What are you building?</label>
            <textarea id="edit-description" value={description} maxLength={DESCRIPTION_LIMIT} onChange={(e) => setDescription(e.target.value)} rows={5} className={inputClass} />
            <p className="mt-1.5 text-xs text-dark-muted">{description.length} / {DESCRIPTION_LIMIT} characters</p>
          </div>

          <div>
            <p className="text-sm font-medium text-fg">Category</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
              {PROJECT_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={category === option}
                  onClick={() => setCategory(option)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${category === option ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]" : "bg-dark-tertiary text-fg hover:bg-dark-subtle"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-fg">Skills people need</p>
              <span className="text-xs text-dark-muted">{tags.length} / 3</span>
            </div>
            <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
              {skillsConfig.map((skill) => {
                const selected = tags.includes(skill.name);
                const disabled = !selected && tags.length >= 3;
                return (
                  <button
                    key={skill.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTags(selected ? tags.filter((tag) => tag !== skill.name) : [...tags, skill.name])}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${selected ? "bg-[var(--btn-primary-bg)] font-medium text-[var(--btn-primary-fg)]" : "bg-dark-tertiary text-fg-secondary hover:text-fg"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          {!project.isDraft ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-dark-subtle p-4">
              <div>
                <p className="text-sm font-medium text-fg">Visible in Explore</p>
                <p className="mt-0.5 text-xs text-fg-secondary">Turn off to hide the project from everyone but you.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label="Visible in Explore"
                onClick={() => setIsPublic((value) => !value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${isPublic ? "bg-accent-blue" : "bg-dark-tertiary"}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium text-fg">Roles</p>
            <div className="mt-3 space-y-4">
              {roles.length === 0 ? <p className="text-sm text-fg-secondary">No open roles. Add one below.</p> : null}
              {roles.map((role, index) => (
                <div key={role.id ?? `new-${index}`} className="rounded-2xl border border-dark-subtle p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg">Role {index + 1}</span>
                    <button type="button" onClick={() => setRoles((prev) => prev.filter((_, i) => i !== index))} className="text-xs font-semibold text-danger">
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_6rem]">
                    <div>
                      <label className="text-xs font-medium text-fg-secondary" htmlFor={`edit-role-title-${index}`}>Role</label>
                      <input id={`edit-role-title-${index}`} type="text" value={role.title} maxLength={256} onChange={(e) => updateRole(index, { title: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-fg-secondary" htmlFor={`edit-role-slots-${index}`}>People</label>
                      <input
                        id={`edit-role-slots-${index}`}
                        type="number"
                        min={1}
                        max={100}
                        value={role.slotsNeeded}
                        onChange={(e) => updateRole(index, { slotsNeeded: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-fg-secondary" htmlFor={`edit-role-desc-${index}`}>What will they do?</label>
                    <input id={`edit-role-desc-${index}`} type="text" value={role.description} onChange={(e) => updateRole(index, { description: e.target.value })} className={inputClass} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setRoles((prev) => [...prev, { id: null, title: "", description: "", slotsNeeded: 1 }])} className="btn-secondary w-full !py-2.5 text-sm">
                + Add a role
              </button>
              <p className="text-xs text-dark-muted">Removing a role that already has applications closes it instead of deleting those applications.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-dark-subtle bg-dark-primary/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="btn-secondary !px-5 !py-2.5 text-sm">
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={saving || !name.trim()} className="btn-primary !px-5 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
