"use client";

import Link from "next/link";

export interface PreviewProfile {
  name: string;
  bio: string;
  skills: string[];
  links: { label: string; url: string }[];
  imageUrl?: string | null;
  projects: { id: number; name: string }[];
  isPublic: boolean;
  memberSince?: Date | null;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const isWebUrl = (url: string) => /^https?:\/\//i.test(url.trim());

function Avatar({ profile, className }: { profile: PreviewProfile; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-blue/12 font-bold text-accent-blue ${className}`}>
      {profile.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(profile.name)
      )}
    </span>
  );
}

/** Compact live preview shown next to the edit form. */
export function ProfilePreviewCard({ profile, onOpenFull }: { profile: PreviewProfile; onOpenFull: () => void }) {
  const links = profile.links.filter((link) => link.url.trim() && isWebUrl(link.url));
  const shownSkills = profile.skills.slice(0, 2);
  const extra = profile.skills.length - shownSkills.length;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-muted">Preview</p>
      <div className="mt-3 rounded-2xl border border-dark-subtle p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center text-center">
          <Avatar profile={profile} className="h-[72px] w-[72px] text-2xl" />
          <p className="mt-4 text-[17px] font-semibold tracking-tight text-fg">{profile.name || "Your name"}</p>
          <p className={`mt-1.5 line-clamp-3 text-[13px] leading-snug ${profile.bio.trim() ? "text-fg-secondary" : "text-dark-muted"}`}>
            {profile.bio.trim() || "Your bio will appear here."}
          </p>
        </div>

        <div className="mt-5 space-y-4 border-t border-dark-subtle pt-4 text-[13px]">
          <div>
            <p className="text-[11px] font-medium text-dark-muted">Projects</p>
            <p className="mt-1.5 text-fg-secondary">
              {profile.projects.length === 0
                ? "No projects yet"
                : `${profile.projects.length} project${profile.projects.length === 1 ? "" : "s"} · ${profile.projects[0]!.name}`}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-dark-muted">Skills</p>
            {profile.skills.length === 0 ? (
              <p className="mt-1.5 text-dark-muted">No skills picked yet</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {shownSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-fg-secondary">{skill}</span>
                ))}
                {extra > 0 ? <span className="rounded-full bg-dark-tertiary px-2.5 py-1 text-xs text-fg-secondary">+{extra} more</span> : null}
              </div>
            )}
          </div>

          {links.length > 0 ? (
            <div>
              <p className="text-[11px] font-medium text-dark-muted">Links</p>
              <ul className="mt-2 space-y-1.5">
                {links.map((link) => (
                  <li key={link.label} className="truncate text-accent-blue">{hostOf(link.url)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <button type="button" onClick={onOpenFull} className="btn-secondary mt-5 w-full !py-2.5 text-sm">
          See full preview
        </button>
      </div>
      {!profile.isPublic ? (
        <p className="mt-3 rounded-xl bg-dark-secondary p-3 text-xs leading-relaxed text-fg-secondary">
          Your profile is private right now, so other people can&apos;t open it. Turn on Public profile to be found.
        </p>
      ) : null}
    </div>
  );
}

/** Full-page preview: how other people see the profile (with your unsaved edits). */
export function ProfilePreviewFull({ profile, onBack }: { profile: PreviewProfile; onBack: () => void }) {
  const links = profile.links.filter((link) => link.url.trim() && isWebUrl(link.url));
  const since = profile.memberSince
    ? profile.memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="text-fg">
      <div className="-mx-4 flex items-center justify-between gap-3 bg-accent-blue/[0.09] px-4 py-3 sm:-mx-6 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-medium text-accent-blue">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          This is how other people see your profile.
        </p>
        <button type="button" onClick={onBack} className="btn-secondary !px-4 !py-1.5 text-[13px]">
          Back to editing
        </button>
      </div>

      {!profile.isPublic ? (
        <p className="mt-4 rounded-xl bg-warning-bg p-3 text-sm text-warning">Your profile is private, so only you can see this page.</p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-dark-subtle">
        <div className="h-28 bg-dark-secondary sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <Avatar profile={profile} className="-mt-12 h-24 w-24 border-4 border-[var(--bg)] text-3xl sm:-mt-14 sm:h-28 sm:w-28" />
          <h2 className="mt-4 text-[28px] font-bold tracking-tight text-fg sm:text-[32px]">{profile.name || "Your name"}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-dark-muted">
            <span>{profile.projects.length} project{profile.projects.length === 1 ? "" : "s"}</span>
            {since ? <span>Joined {since}</span> : null}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-dark-subtle p-6">
            <h3 className="text-lg font-semibold tracking-tight text-fg">About</h3>
            <p className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed ${profile.bio.trim() ? "text-fg-secondary" : "text-dark-muted"}`}>
              {profile.bio.trim() || "No bio yet."}
            </p>
          </section>

          <section className="rounded-2xl border border-dark-subtle p-6">
            <h3 className="text-lg font-semibold tracking-tight text-fg">Skills</h3>
            {profile.skills.length === 0 ? (
              <p className="mt-3 text-sm text-dark-muted">No skills picked yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-dark-tertiary px-3 py-1.5 text-xs text-fg-secondary">{skill}</span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-dark-subtle p-6">
            <h3 className="text-lg font-semibold tracking-tight text-fg">Projects</h3>
            {profile.projects.length === 0 ? (
              <p className="mt-3 text-sm text-dark-muted">No public projects yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-dark-subtle">
                {profile.projects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/projects/${project.id}`} className="flex items-center justify-between py-3 text-sm font-medium text-fg hover:text-accent-blue">
                      {project.name}
                      <span className="text-xs text-accent-blue">View project &rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-dark-subtle p-6">
            <h3 className="text-lg font-semibold tracking-tight text-fg">Links</h3>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-dark-muted">No links added.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <p className="text-sm font-medium text-fg">{link.label}</p>
                    <p className="truncate text-xs text-accent-blue">{hostOf(link.url)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-dark-subtle p-6">
            <h3 className="text-lg font-semibold tracking-tight text-fg">On kvelpo</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-dark-muted">Projects started</dt><dd className="text-fg-secondary">{profile.projects.length}</dd></div>
              {since ? <div className="flex justify-between"><dt className="text-dark-muted">Member since</dt><dd className="text-fg-secondary">{since}</dd></div> : null}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
