"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserButton } from "@clerk/nextjs";
import skillsConfig from "~/data/skills.json";

type MembershipType = "free" | "pro" | "team";

interface ProfileData {
  id: number;
  clerkUserId: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  membership: MembershipType;
  skills: string[];
  link1: string | null;
  link2: string | null;
  link3: string | null;
}

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [membership, setMembership] = useState<MembershipType>("free");
  const [skills, setSkills] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [link1, setLink1] = useState("");
  const [link2, setLink2] = useState("");
  const [link3, setLink3] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }

        const data = (await res.json()) as ProfileData;
        setFullName(data.fullName ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setIsPublic(data.isPublic ?? true);
        setMembership(data.membership ?? "free");
        setSkills(Array.isArray(data.skills) ? data.skills.filter((skill): skill is string => typeof skill === "string").slice(0, 15) : []);
        setLink1(data.link1 ?? "");
        setLink2(data.link2 ?? "");
        setLink3(data.link3 ?? "");
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          bio,
          avatarUrl,
          isPublic,
          membership,
          skills,
          link1,
          link2,
          link3,
        }),
      });

      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(`Save failed: ${res.status}${bodyText ? ` — ${bodyText}` : ""}`);
      }

      await res.json() as ProfileData;
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading profile…</p>;
  }

  return (
    <div className="space-y-6 p-4 rounded-xl border border-slate-200 bg-white/80 text-slate-900 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-sm text-slate-600">Editable profile fields stored in your kvelpo profile.</p>
        </div>
        <UserButton />
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your display name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Avatar URL</span>
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            className="mt-1 block w-full rounded-lg border px-3 py-2"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            placeholder="A short description about you"
          />
        </label>

        <fieldset className="flex items-center gap-3">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          <label htmlFor="isPublic" className="text-sm">
            Public profile
          </label>
        </fieldset>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Membership</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["free", "pro", "team"] as MembershipType[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setMembership(level)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    membership === level
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">Membership level is stored on your profile for future limits and upgrades.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Profile skills</p>
              <p className="text-xs text-slate-500">Pick from shared skill roles. One of each, up to 15.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{skills.length}/15</span>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
              <div className="grid gap-2 grid-cols-3 pt-4">
                {skillsConfig.map((skill) => {
                  const isSelected = skills.includes(skill.name);
                  const disabled = !isSelected && skills.length >= 15;

                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSkills(skills.filter((name) => name !== skill.name));
                          return;
                        }
                        if (skills.length < 15) {
                          setSkills([...skills, skill.name]);
                        }
                      }}
                      disabled={disabled}
                      className={`inline-flex items-center justify-center rounded-full border transition ${
                        isSelected ? "bg-white shadow-sm font-bold border-2" : "bg-white"
                      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-slate-100"} h-10 px-4 text-sm font-medium`}
                      style={{
                        borderColor: skill.color,
                        color: skill.color,
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>

              {skills.length >= 15 ? (
                <p className="mt-4 text-sm text-rose-600">Max 15 skills selected. Remove one to add another.</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Link 1</span>
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={link1}
              onChange={(event) => setLink1(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Link 2</span>
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={link2}
              onChange={(event) => setLink2(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Link 3</span>
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={link3}
              onChange={(event) => setLink3(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
