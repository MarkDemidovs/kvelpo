"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { deleteAccountAction } from "~/app/actions/delete-account";
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
  "mt-1.5 block w-full rounded-xl border border-dark-subtle bg-dark-tertiary px-3.5 py-2.5 text-fg placeholder-dark-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue";

export default function ProfileForm() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [membership, setMembership] = useState<MembershipType>("free");
  const [skills, setSkills] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [link1, setLink1] = useState("");
  const [link2, setLink2] = useState("");
  const [link3, setLink3] = useState("");
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
        throw new Error(`Save failed: ${res.status}${bodyText ? `: ${bodyText}` : ""}`);
      }

      await res.json() as ProfileData;
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
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

  const normalizedQuery = skillQuery.trim().toLowerCase();
  const filteredSkills = normalizedQuery
    ? skillsConfig.filter((skill) => skill.name.toLowerCase().includes(normalizedQuery))
    : skillsConfig;

  if (loading) {
    return <ProfileFormSkeleton />;
  }

  const displayName = fullName.trim().length > 0 ? fullName.trim() : (user?.fullName ?? "");
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="space-y-6 text-fg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-[30px]">Edit profile</h1>
          <p className="mt-1 text-[15px] text-fg-secondary">This is what shows up when someone views your profile.</p>
        </div>
        <div className="hidden md:block">
          <UserButton />
        </div>
      </div>

      {error ? <div className="rounded-xl bg-danger-bg p-3 text-sm text-danger">{error}</div> : null}

      <form onSubmit={handleSubmit} className="card-raised !transform-none space-y-7 p-5 sm:p-7">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-accent-blue/15 text-3xl font-bold text-accent-blue">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <p className="text-xs text-dark-muted">Your photo comes from the account you signed in with.</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-fg">Full name</span>
          <input
            className={fieldClass}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your display name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-fg">Bio</span>
          <textarea
            className={fieldClass}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            placeholder="A short description about you"
          />
          <span className="mt-1.5 block text-xs text-dark-muted">Tell people what you do and what you&apos;d like to work on.</span>
        </label>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-fg">Skills</p>
            <span className="text-sm text-dark-muted">{skills.length} of 15</span>
          </div>
          <p className="mt-0.5 text-xs text-dark-muted">Pick up to 15 so the right projects can find you.</p>

          {skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSkills(skills.filter((selected) => selected !== name))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--btn-primary-bg)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--btn-primary-fg)]"
                  aria-label={`Remove ${name}`}
                >
                  {name}
                  <span aria-hidden="true" className="opacity-70">×</span>
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-semibold text-accent-blue"
          >
            {expanded ? "Hide skill list" : skills.length > 0 ? "Add or change skills" : "Choose skills"}
          </button>

          {expanded ? (
            <div className="mt-3">
              <input
                type="search"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                onKeyDown={(event) => {
                  // Enter would otherwise submit the whole profile form.
                  if (event.key === "Enter") event.preventDefault();
                }}
                placeholder="Search skills..."
                aria-label="Search skills"
                className={`${fieldClass} !mt-0`}
              />
              {filteredSkills.length === 0 ? (
                <p className="pt-4 text-sm text-dark-muted">No skills match &quot;{skillQuery.trim()}&quot;.</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-3">
                {filteredSkills.map((skill) => {
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
                      aria-pressed={isSelected}
                      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                        isSelected
                          ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                          : "bg-dark-tertiary text-fg hover:bg-dark-secondary"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>

              {skills.length >= 15 ? (
                <p className="mt-4 text-sm text-danger">Max 15 skills selected. Remove one to add another.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-lg font-semibold text-fg">Links</p>
          <div className="mt-3 space-y-4">
            {[
              { label: "Website", value: link1, set: setLink1, placeholder: "https://yourwebsite.com" },
              { label: "Portfolio", value: link2, set: setLink2, placeholder: "https://" },
              { label: "Another link", value: link3, set: setLink3, placeholder: "https://" },
            ].map((field) => (
              <label key={field.label} className="block">
                <span className="text-sm font-medium text-fg">{field.label}</span>
                <input
                  className={fieldClass}
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="divide-y divide-dark-subtle rounded-2xl border border-dark-subtle">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-[15px] font-semibold text-fg">Public profile</p>
              <p className="mt-0.5 text-xs text-dark-muted">Anyone can see your profile and project history.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-label="Public profile"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${isPublic ? "bg-accent-blue" : "bg-dark-tertiary"}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${isPublic ? "left-[1.375rem]" : "left-0.5"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-[15px] font-semibold text-fg">Membership</p>
              <p className="mt-0.5 text-xs text-dark-muted">You&apos;re on the {membership === "free" ? "Free" : "Pro"} plan.</p>
            </div>
            <Link href="/profile/subscription" className="btn-secondary !px-4 !py-2 text-sm">Manage plan</Link>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <ExperienceSection />

      <div className="card-raised space-y-4 p-7">
        <div>
          <p className="text-sm font-medium text-fg">Privacy &amp; legal</p>
          <p className="text-xs text-fg-secondary">Manage your consent and review the policies that apply to your account.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/consent" className="btn-secondary !px-4 !py-2 text-sm">Consent center</Link>
          <Link href="/cookies" className="btn-secondary !px-4 !py-2 text-sm">Cookie policy</Link>
          <Link href="/terms" className="btn-secondary !px-4 !py-2 text-sm">Terms of service</Link>
          <Link href="/privacy" className="btn-secondary !px-4 !py-2 text-sm">Privacy policy</Link>
        </div>

        <p className="text-xs text-dark-muted">
          You accepted the Terms of Service and Privacy Policy when you started using kvelpo. Your acceptance is saved to your account.
        </p>
      </div>

      <div className="rounded-2xl border border-danger/40 bg-danger-bg p-6">
        <p className="text-[15px] font-semibold text-danger">Delete account</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
          This cancels any active subscription and permanently removes your profile. Some activity in other people&apos;s projects is kept but no longer tied to your name.
        </p>
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deletePending}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-danger/40 px-5 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletePending ? "Deleting account..." : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
