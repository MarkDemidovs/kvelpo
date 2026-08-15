"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { UserButton } from "@clerk/nextjs";
import { deleteAccountAction } from "~/app/actions/delete-account";
import { saveConsentAction } from "~/app/actions/consent";
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
  const [consentPending, setConsentPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

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
          // membership is managed via Stripe subscriptions — handled separately
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

  const handleConsent = async () => {
    setConsentPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("termsVersion", "1");
      formData.set("privacyVersion", "1");
      await saveConsentAction(formData);
    } catch (err) {
      setError(String(err));
    } finally {
      setConsentPending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This will delete your account and associated project data. Continue?")) {
      return;
    }

    setDeletePending(true);
    setError(null);

    try {
      await deleteAccountAction();
    } catch (err) {
      setError(String(err));
    } finally {
      setDeletePending(false);
    }
  };

  if (loading) {
    return <p>Loading profile…</p>;
  }

  return (
    <div className="space-y-6 p-4 rounded-xl border border-dark-subtle bg-dark-card text-dark-primary">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-sm text-dark-secondary">Editable profile fields stored in your kvelpo profile.</p>
        </div>
        <UserButton />
      </div>

      {error ? <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-dark-primary">Full name</span>
            <input
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your display name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-dark-primary">Avatar URL</span>
            <input
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-dark-primary">Bio</span>
          <textarea
            className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
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
          <label htmlFor="isPublic" className="text-sm text-dark-primary">
            Public profile
          </label>
        </fieldset>

        <div className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-primary">Membership</p>
              <p className="text-xs text-dark-secondary">Current: {membership?.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile/subscription" className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-dark-primary hover:bg-blue-500">Manage subscription</Link>
            </div>
          </div>
          <p className="text-xs text-dark-secondary">To change membership, use the subscription manager. Payments are processed via Stripe.</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-dark-primary">Profile skills</p>
              <p className="text-xs text-dark-secondary">Pick from shared skill roles. One of each, up to 15.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-secondary">{skills.length}/15</span>
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
                        isSelected ? "bg-dark-card font-bold border-2" : "bg-dark-card"
                      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-dark-tertiary"} h-10 px-4 text-sm font-medium`}
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

              {skills.length >= 15 ? (
                <p className="mt-4 text-sm text-red-400">Max 15 skills selected. Remove one to add another.</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-dark-primary">Link 1</span>
            <input
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
              value={link1}
              onChange={(event) => setLink1(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-primary">Link 2</span>
            <input
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
              value={link2}
              onChange={(event) => setLink2(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-primary">Link 3</span>
            <input
              className="mt-1 block w-full rounded-lg border border-dark-subtle bg-dark-tertiary px-3 py-2 text-dark-primary"
              value={link3}
              onChange={(event) => setLink3(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-semibold text-dark-primary transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-dark-muted"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4">
        <div>
          <p className="text-sm font-medium text-dark-primary">Privacy & legal</p>
          <p className="text-xs text-dark-secondary">Manage your consent and review the policies that apply to your account.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/consent" className="rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-tertiary">
            Consent center
          </Link>
          <Link href="/cookies" className="rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-tertiary">
            Cookie policy
          </Link>
          <Link href="/terms" className="rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-tertiary">
            Terms of service
          </Link>
          <Link href="/privacy" className="rounded-lg border border-dark-subtle bg-dark-card px-3 py-2 text-sm font-medium text-dark-secondary hover:bg-dark-tertiary">
            Privacy policy
          </Link>
        </div>

        <button
          type="button"
          onClick={handleConsent}
          disabled={consentPending}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-dark-primary transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-dark-muted"
        >
          {consentPending ? "Saving consent..." : "Accept consent"}
        </button>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deletePending}
          className="inline-flex items-center justify-center rounded-lg border border-red-400 bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:bg-red-900/20"
        >
          {deletePending ? "Deleting account..." : "Delete account"}
        </button>
      </div>
    </div>
  );
}
