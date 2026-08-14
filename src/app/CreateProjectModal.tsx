"use client";

import { useState, type FormEvent } from "react";
import skillsConfig from "~/data/skills.json";

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

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [rolesNeeded, setRolesNeeded] = useState<RoleNeed[]>([
    { title: "", description: "", slotsNeeded: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic: true,
          tags,
          rolesNeeded: rolesNeeded
            .filter((role) => role.title.trim().length > 0)
            .map((role) => ({
              title: role.title.trim(),
              description: role.description.trim() || null,
              slotsNeeded: Math.max(1, role.slotsNeeded),
            })),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to create project");
      }

      const newProject = (await response.json()) as Project;
      onProjectCreated(newProject);
      handleClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setTags([]);
    setExpanded(false);
    setRolesNeeded([{ title: "", description: "", slotsNeeded: 1 }]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="flex flex-col w-full max-w-full sm:max-w-md max-h-[90vh] rounded-xl border border-dark-subtle bg-dark-card overflow-hidden"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between border-b border-dark-subtle">
          <h2 className="text-xl font-semibold text-dark-primary">Create New Project</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-dark-primary">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-primary">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              placeholder="Optional project description"
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-dark-primary">Project tags</p>
                <p className="text-xs text-dark-secondary">Pick from shared skill roles. Up to 3.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-secondary">{tags.length}/3</span>
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-dark-secondary hover:text-accent-blue underline"
                >
                  {expanded ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {expanded && (
              <div className="mt-2 overflow-y-auto max-h-48">
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 pt-2 pr-1 min-w-0">
                  {skillsConfig.map((skill) => {
                    const isSelected = tags.includes(skill.name);
                    const disabled = !isSelected && tags.length >= 3;

                    return (
                      <button
                        key={skill.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTags(tags.filter((name) => name !== skill.name));
                            return;
                          }
                          if (tags.length < 3) {
                            setTags([...tags, skill.name]);
                          }
                        }}
                        disabled={disabled}
                        className={`inline-flex items-center justify-center rounded-full border transition h-10 px-4 text-sm font-medium ${
                          isSelected ? "bg-dark-card font-bold border-2" : "bg-dark-card"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-dark-tertiary"}`}
                        style={{
                          borderColor: isSelected ? skill.color : "#333",
                          color: isSelected ? skill.color : "#aaa",
                        }}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-dark-primary">Roles</p>
            <p className="mt-1 text-xs text-dark-secondary">Define what you need.</p>
          </div>

          <div className="space-y-4">
            {rolesNeeded.map((role, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-dark-subtle bg-dark-tertiary p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-dark-primary">Role {index + 1}</span>
                  {rolesNeeded.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRolesNeeded((prev) => prev.filter((_, i) => i !== index))}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark-secondary">Title</label>
                    <input
                      type="text"
                      value={role.title}
                      onChange={(e) =>
                        setRolesNeeded((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, title: e.target.value } : item
                          )
                        )
                      }
                      className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                      placeholder="e.g. Designer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-secondary">Description</label>
                    <input
                      type="text"
                      value={role.description}
                      onChange={(e) =>
                        setRolesNeeded((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, description: e.target.value } : item
                          )
                        )
                      }
                      className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                      placeholder="Details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-secondary">Slots</label>
                    <input
                      type="number"
                      min={1}
                      value={role.slotsNeeded}
                      onChange={(e) =>
                        setRolesNeeded((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, slotsNeeded: Math.max(1, Number(e.target.value) || 1) }
                              : item
                          )
                        )
                      }
                      className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm text-dark-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRolesNeeded((prev) => [...prev, { title: "", description: "", slotsNeeded: 1 }])}
              className="w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-medium text-dark-primary hover:bg-dark-card transition"
            >
              Add another role
            </button>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-dark-subtle bg-dark-tertiary">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-dark-subtle px-4 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-card transition"
          >
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-dark-primary hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-dark-muted"
          >
            {saving ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}