"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { UserButton } from "@clerk/nextjs";
import { deleteAccountAction } from "~/app/actions/delete-account";
import { saveConsentAction } from "~/app/actions/consent";
import skillsConfig from "~/data/skills.json";
import { ProfileFormSkeleton } from "~/app/_components/Skeleton";
import ExperienceSection from "./ExperienceSection";

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

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-tertiary px-3.5 py-2.5 text-dark-primary placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue";

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
    return <ProfileFormSkeleton />;
  }

  return (
    <div className="space-y-6 text-dark-primary">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight">Profile settings</h1>
          <p className="mt-1 text-[15px] text-dark-secondary">This is what shows up when someone views your profile.</p>
        </div>
        <UserButton />
      </div>

      {error ? <div className="rounded-xl bg-red-900/30 p-3 text-sm text-red-400">{error}</div> : null}

      <form onSubmit={handleSubmit} className="card-raised space-y-6 p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Full name</span>
            <input
              className={fieldClass}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your display name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-dark-secondary">Avatar URL</span>
            <input
              className={fieldClass}
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-dark-secondary">Bio</span>
          <textarea
            className={fieldClass}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            placeholder="A short description about you"
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 accent-[oklch(68%_0.18_240)]"
          />
          <div>
            <p className="text-sm text-dark-primary">Public profile</p>
            <p className="text-xs text-dark-muted">Anyone can view your profile and project history</p>
          </div>
        </label>

        <div className="space-y-2 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-dark-primary">Membership</p>
              <p className="text-xs text-dark-secondary">Current: {membership?.toUpperCase()}</p>
            </div>
            <Link href="/profile/subscription" className="btn-secondary !px-4 !py-2 text-sm">Manage subscription</Link>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dark-subtle bg-dark-tertiary p-4.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-dark-primary">Skills</p>
              <p className="text-xs text-dark-secondary">Pick from shared skill roles, up to 15.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-muted">{skills.length}/15</span>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-accent-blue"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
              <div className="grid gap-2 grid-cols-3 pt-2">
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

        <div>
          <p className="label-eyebrow">Links</p>
          <div className="mt-3 space-y-3">
            <input className={`${fieldClass} !mt-0`} value={link1} onChange={(event) => setLink1(event.target.value)} placeholder="https://..." />
            <input className={`${fieldClass} !mt-0`} value={link2} onChange={(event) => setLink2(event.target.value)} placeholder="https://..." />
            <input className={`${fieldClass} !mt-0`} value={link3} onChange={(event) => setLink3(event.target.value)} placeholder="https://..." />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <ExperienceSection />

      <div className="card-raised space-y-4 p-7">
        <div>
          <p className="text-sm font-medium text-dark-primary">Privacy &amp; legal</p>
          <p className="text-xs text-dark-secondary">Manage your consent and review the policies that apply to your account.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/consent" className="btn-secondary !px-4 !py-2 text-sm">Consent center</Link>
          <Link href="/cookies" className="btn-secondary !px-4 !py-2 text-sm">Cookie policy</Link>
          <Link href="/terms" className="btn-secondary !px-4 !py-2 text-sm">Terms of service</Link>
          <Link href="/privacy" className="btn-secondary !px-4 !py-2 text-sm">Privacy policy</Link>
        </div>

        <button
          type="button"
          onClick={() => void handleConsent()}
          disabled={consentPending}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {consentPending ? "Saving consent..." : "Accept consent"}
        </button>
      </div>

      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
        <p className="text-[15px] font-semibold text-red-400">Delete account</p>
        <p className="mt-2 text-sm leading-relaxed text-dark-secondary">
          This cancels any active subscription and permanently removes your profile. Some activity in other people&apos;s projects is kept but no longer tied to your name.
        </p>
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deletePending}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-red-900/50 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletePending ? "Deleting account..." : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
