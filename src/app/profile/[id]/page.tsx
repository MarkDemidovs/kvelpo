import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import Link from "next/link";
import Image from "next/image";

type ProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PublicProfile = {
  clerkUserId: string;
  fullName: string | null;
  bio: string | null;
  isPublic: boolean;
  membership: string;
  link1: string | null;
  link2: string | null;
  link3: string | null;
  skills: string[];
};

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { userId } = await auth();
  const { id: profileId } = await params;

  const profile = (await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.clerkUserId, profileId),
  })) as PublicProfile | null;

  let avatarUrl: string | null = null;
  if (profile) {
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(profileId) as { imageUrl?: string | null };
      avatarUrl = clerkUser.imageUrl ?? null;
    } catch (error) {
      console.error("Failed to fetch Clerk avatar for profile page:", error);
    }
  }

  const isOwner = userId === profileId;
  const canView = profile && (profile.isPublic || isOwner);
  const displayName = profile?.fullName ?? "Anonymous";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        {profile ? (
          canView ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-dark-tertiary">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-dark-subtle text-2xl font-semibold uppercase text-dark-primary">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-dark-muted">Public profile</p>
                    <h1 className="mt-2 text-3xl font-semibold text-dark-primary">{displayName}</h1>
                    <p className="mt-1 text-sm text-dark-secondary">{profile.membership === "pro" ? "Pro member" : profile.membership === "team" ? "Team member" : "Free member"}</p>
                  </div>
                </div>
                {isOwner ? (
                  <Link
                    href="/profile"
                    className="rounded-full border border-dark-subtle bg-dark-tertiary px-4 py-2 text-sm font-semibold text-dark-primary hover:bg-dark-card"
                  >
                    Edit your profile
                  </Link>
                ) : null}
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="space-y-4 rounded-3xl bg-dark-tertiary p-6">
                  <p className="text-sm font-semibold text-dark-primary">Bio</p>
                  <p className="text-sm leading-7 text-dark-secondary">{profile.bio ?? "No bio provided."}</p>
                </div>
                <div className="space-y-4 rounded-3xl bg-dark-tertiary p-6">
                  <p className="text-sm font-semibold text-dark-primary">Links</p>
                  <div className="space-y-2">
                    {profile.link1 ? (
                      <a href={profile.link1} target="_blank" rel="noreferrer" className="text-sm text-accent-blue hover:underline">
                        {profile.link1}
                      </a>
                    ) : null}
                    {profile.link2 ? (
                      <a href={profile.link2} target="_blank" rel="noreferrer" className="text-sm text-accent-blue hover:underline">
                        {profile.link2}
                      </a>
                    ) : null}
                    {profile.link3 ? (
                      <a href={profile.link3} target="_blank" rel="noreferrer" className="text-sm text-accent-blue hover:underline">
                        {profile.link3}
                      </a>
                    ) : null}
                    {!profile.link1 && !profile.link2 && !profile.link3 ? (
                      <p className="text-sm text-dark-secondary">No links added.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-dark-tertiary p-6">
                <p className="text-sm font-semibold text-dark-primary">Skills</p>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-dark-card px-3 py-1 text-xs font-medium text-dark-secondary">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-dark-secondary">No skills added.</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-xl font-semibold text-dark-primary">Profile unavailable</p>
              <p className="mt-3 text-sm leading-7 text-dark-secondary">This profile is private and can only be viewed by the owner.</p>
            </div>
          )
        ) : (
          <div>
            <p className="text-xl font-semibold text-dark-primary">Profile not found</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">We couldn’t find a profile for this user.</p>
          </div>
        )}
      </div>
    </main>
  );
}
