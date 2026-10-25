"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import skillsConfig from "~/data/skills.json";
import { PROJECT_CATEGORIES, type ProjectCategory } from "~/lib/categories";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

interface RoleNeed {
  title: string;
  description: string;
  slotsNeeded: number;
}

interface Project {
  id: number;
  clerkUserId: string;
  userFullName: string | null;
  name: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  rolesNeededCount?: number;
}

const STEPS = ["The idea", "Roles", "Review & post"] as const;
const DESCRIPTION_LIMIT = 500;
const emptyRole = (): RoleNeed => ({ title: "", description: "", slotsNeeded: 1 });

const inputClass =
  "mt-2 block w-full rounded-xl border border-dark-subtle bg-dark-primary px-3.5 py-3 text-[15px] text-fg outline-none placeholder:text-dark-muted focus:border-accent-blue focus:ring-1 focus:ring-accent-blue";

/** Three-step "post a project" flow: the idea, the roles, then review. */
export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("Design");
  const [tags, setTags] = useState<string[]>([]);
  const [rolesNeeded, setRolesNeeded] = useState<RoleNeed[]>([emptyRole()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // Lock page scroll behind the full-screen flow.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const filledRoles = rolesNeeded.filter((role) => role.title.trim().length > 0);
  const totalSpots = filledRoles.reduce((sum, role) => sum + role.slotsNeeded, 0);
  const ownerName = user?.fullName?.trim() ?? user?.firstName ?? "You";
  const initials = ownerName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const reset = () => {
    setStep(0);
    setName("");
    setDescription("");
    setCategory("Design");
    setTags([]);
    setRolesNeeded([emptyRole()]);
    setError(null);
    setLimitReached(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (asDraft = false) => {
    setSaving(true);
    setError(null);
    setLimitReached(false);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic: !asDraft,
          isDraft: asDraft,
          category,
          tags,
          rolesNeeded: filledRoles.map((role) => ({
            title: role.title.trim(),
            description: role.description.trim() || null,
            slotsNeeded: Math.max(1, role.slotsNeeded),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string; code?: string };
        setLimitReached(errorData.code === "PROJECT_LIMIT_REACHED");
        throw new Error(errorData.error ?? "Failed to create project");
      }

      const newProject = (await response.json()) as Project;
      if (asDraft) {
        // Drafts stay out of Explore; open it so the owner can keep going.
        handleClose();
        router.push(`/projects/${newProject.id}`);
      } else {
        onProjectCreated(newProject);
        handleClose();
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const updateRole = (index: number, patch: Partial<RoleNeed>) =>
    setRolesNeeded((prev) => prev.map((role, i) => (i === index ? { ...role, ...patch } : role)));

  if (!isOpen) return null;

  const previewTags = tags.length > 0 ? tags : ["Design", "UI Design", "UX Research"];

  const previewCard = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-muted">Preview</p>
      <div className="mt-3 rounded-2xl border border-dark-subtle p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/12 text-[11px] font-semibold text-accent-blue">{initials}</span>
          <div>
            <p className="text-[13px] font-medium text-fg">{ownerName}</p>
            <p className="text-xs text-dark-muted">Draft</p>
          </div>
        </div>
        <p className={`mt-4 text-[18px] font-semibold tracking-tight ${name.trim() ? "text-fg" : "text-fg"}`}>{name.trim() || "Your project name"}</p>
        <p className={`mt-1.5 line-clamp-3 text-sm leading-snug ${description.trim() ? "text-fg-secondary" : "text-dark-muted"}`}>
          {description.trim() || "Your description will appear here, so people can quickly understand the idea."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {previewTags.slice(0, 3).map((tag) => (
            <span key={tag} className={`rounded-full bg-dark-tertiary px-2.5 py-1 text-xs ${tags.length > 0 ? "text-fg-secondary" : "text-dark-muted"}`}>{tag}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dark-subtle pt-3.5 text-[13px]">
          <span className="text-dark-muted">{filledRoles.length > 0 ? `${totalSpots} spot${totalSpots === 1 ? "" : "s"} open` : "Add roles in step 2"}</span>
          <span className="font-semibold text-accent-blue">View project &rarr;</span>
        </div>
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl bg-dark-secondary p-4 text-sm text-fg-secondary">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
        </svg>
        Be specific about what you need. It helps people decide quickly if they&apos;re a good fit.
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-primary" role="dialog" aria-modal="true" aria-label="Create a project">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={step === 0 ? handleClose : () => setStep(step - 1)}
          className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
            <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {step === 0 ? "Cancel" : step === 1 ? "Back to the idea" : "Back to roles"}
        </button>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
          <div className="min-w-0">
            <p className="mb-3 text-xs text-dark-muted sm:hidden">Step {step + 1} of 3 &middot; {STEPS[step]}</p>
            <ol className="grid grid-cols-3 gap-3" aria-label="Progress">
              {STEPS.map((label, index) => (
                <li key={label}>
                  <div className={`h-1 rounded-full ${index <= step ? "bg-[var(--text)]" : "bg-dark-tertiary"}`} />
                  <p className={`mt-2 hidden text-xs sm:block ${index === step ? "font-medium text-fg" : "text-dark-muted"}`}>
                    {index + 1}&nbsp; {label}
                  </p>
                </li>
              ))}
            </ol>

            {error ? (
              <div className="mt-6 rounded-xl bg-danger-bg p-3 text-sm text-danger">
                <p>{error}</p>
                {limitReached ? (
                  <Link href="/profile/subscription" className="mt-2 inline-block font-semibold text-accent-blue hover:underline">
                    View plans &rarr;
                  </Link>
                ) : null}
              </div>
            ) : null}

            {step === 0 ? (
              <div className="mt-8">
                <h1 className="text-[34px] font-bold leading-tight tracking-tight text-fg sm:text-[40px]">Tell people about your idea</h1>
                <p className="mt-2 text-[15px] text-fg-secondary">Keep it simple. You can change everything later.</p>

                <div className="mt-8 space-y-7">
                  <div>
                    <label htmlFor="project-name" className="text-sm font-medium text-fg">Project name</label>
                    <input
                      id="project-name"
                      type="text"
                      value={name}
                      maxLength={256}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Kvelpo Redesign"
                    />
                    <p className="mt-1.5 text-xs text-dark-muted">A short, clear name works best.</p>
                  </div>

                  <div>
                    <label htmlFor="project-description" className="text-sm font-medium text-fg">What are you building?</label>
                    <textarea
                      id="project-description"
                      value={description}
                      maxLength={DESCRIPTION_LIMIT}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className={inputClass}
                      placeholder="Describe the idea and what you want to achieve. A few sentences is enough."
                    />
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
                          className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                            category === option ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]" : "bg-dark-tertiary text-fg hover:bg-dark-subtle"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-dark-muted">Helps the right people find your project.</p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-fg">Skills people need</p>
                      <span className="text-xs text-dark-muted">{tags.length} / 3</span>
                    </div>
                    <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                      {skillsConfig.map((skill) => {
                        const isSelected = tags.includes(skill.name);
                        const disabled = !isSelected && tags.length >= 3;
                        return (
                          <button
                            key={skill.name}
                            type="button"
                            disabled={disabled}
                            onClick={() => setTags(isSelected ? tags.filter((tag) => tag !== skill.name) : [...tags, skill.name])}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
                              isSelected ? "bg-[var(--btn-primary-bg)] font-medium text-[var(--btn-primary-fg)]" : "bg-dark-tertiary text-fg-secondary hover:text-fg"
                            } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-dark-subtle bg-dark-primary px-4 py-4 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-6">
                  <button type="button" onClick={() => void handleSubmit(true)} disabled={saving || !name.trim()} className="btn-secondary flex-1 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:!border-0 sm:!bg-transparent sm:!px-0 sm:!text-accent-blue sm:hover:underline">
                    {saving ? "Saving..." : "Save as draft"}
                  </button>
                  <button type="button" onClick={() => setStep(1)} disabled={!name.trim()} className="btn-primary flex-1 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:!py-3">
                    Continue<span className="hidden sm:inline">&nbsp;to roles</span>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-8">
                <h1 className="text-[34px] font-bold leading-tight tracking-tight text-fg sm:text-[40px]">Who do you need?</h1>
                <p className="mt-2 text-[15px] text-fg-secondary">Add the roles you want to fill and how many people you need for each.</p>

                <div className="mt-8 space-y-4">
                  {rolesNeeded.map((role, index) => (
                    <div key={index} className="rounded-2xl border border-dark-subtle p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-fg">Role {index + 1}</span>
                        {rolesNeeded.length > 1 ? (
                          <button type="button" onClick={() => setRolesNeeded((prev) => prev.filter((_, i) => i !== index))} className="text-xs font-semibold text-danger">
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_6rem]">
                        <div>
                          <label className="text-xs font-medium text-fg-secondary" htmlFor={`role-title-${index}`}>Role</label>
                          <input id={`role-title-${index}`} type="text" value={role.title} maxLength={256} onChange={(e) => updateRole(index, { title: e.target.value })} className={inputClass} placeholder="e.g. UI Designer" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-fg-secondary" htmlFor={`role-slots-${index}`}>People</label>
                          <input
                            id={`role-slots-${index}`}
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
                        <label className="text-xs font-medium text-fg-secondary" htmlFor={`role-desc-${index}`}>What will they do?</label>
                        <input id={`role-desc-${index}`} type="text" value={role.description} onChange={(e) => updateRole(index, { description: e.target.value })} className={inputClass} placeholder="e.g. Design screens and components" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setRolesNeeded((prev) => [...prev, emptyRole()])} className="btn-secondary w-full !py-2.5 text-sm">
                    + Add another role
                  </button>
                </div>

                <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-dark-subtle bg-dark-primary px-4 py-4 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-6">
                  <button type="button" onClick={() => void handleSubmit(true)} disabled={saving || !name.trim()} className="btn-secondary flex-1 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:!border-0 sm:!bg-transparent sm:!px-0 sm:!text-accent-blue sm:hover:underline">
                    {saving ? "Saving..." : "Save as draft"}
                  </button>
                  <button type="button" onClick={() => setStep(2)} className="btn-primary flex-1 !py-2.5 sm:flex-none sm:!py-3">
                    Continue<span className="hidden sm:inline">&nbsp;to review</span>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-8">
                <h1 className="text-[34px] font-bold leading-tight tracking-tight text-fg sm:text-[40px]">Review and post</h1>
                <p className="mt-2 text-[15px] text-fg-secondary">Check that everything looks right. You can still change the project after posting.</p>

                <dl className="mt-8 divide-y divide-dark-subtle rounded-2xl border border-dark-subtle text-sm">
                  <div className="flex items-start justify-between gap-6 p-4">
                    <dt className="text-dark-muted">Project</dt>
                    <dd className="text-right font-medium text-fg">{name.trim()}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-6 p-4">
                    <dt className="text-dark-muted">Category</dt>
                    <dd className="text-right text-fg">{category}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-6 p-4">
                    <dt className="text-dark-muted">Roles</dt>
                    <dd className="text-right text-fg">
                      {filledRoles.length === 0 ? (
                        <span className="text-dark-muted">None yet. People can still see your project.</span>
                      ) : (
                        filledRoles.map((role, index) => (
                          <span key={index} className="block">{role.title.trim()} <span className="text-dark-muted">x {role.slotsNeeded}</span></span>
                        ))
                      )}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-6 p-4">
                    <dt className="text-dark-muted">Visible to</dt>
                    <dd className="text-right text-fg">Everyone on kvelpo</dd>
                  </div>
                </dl>

                <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-dark-subtle bg-dark-primary px-4 py-4 sm:mx-0 sm:px-0 sm:pb-0 sm:pt-6">
                  <button type="button" onClick={() => void handleSubmit(true)} disabled={saving || !name.trim()} className="btn-secondary flex-1 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:!border-0 sm:!bg-transparent sm:!px-0 sm:!text-accent-blue sm:hover:underline">
                    Save as draft
                  </button>
                  <button type="button" onClick={() => void handleSubmit(false)} disabled={saving || !name.trim()} className="btn-primary flex-1 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:!py-3">
                    {saving ? "Posting..." : "Post project"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="hidden lg:block lg:pt-10">{previewCard}</aside>
        </div>
      </div>
    </div>
  );
}
