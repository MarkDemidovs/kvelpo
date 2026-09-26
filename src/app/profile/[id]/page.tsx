import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { experiences } from "~/server/db/schema";
import { experienceColumns } from "~/server/experience";
import { sortExperiences, type Experience } from "~/lib/experience";
import ExperienceTimeline from "~/app/_components/ExperienceTimeline";
import ReportButton from "~/app/_components/ReportButton";
import { eq } from "drizzle-orm";
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

function isHttpUrl(value: string | null): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

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

  const experienceItems: Experience[] = canView
    ? sortExperiences(await db.select(experienceColumns).from(experiences).where(eq(experiences.clerkUserId, profileId)))
    : [];
  const displayName = profile?.fullName ?? "Anonymous";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="relative mx-auto max-w-4xl overflow-hidden px-4 py-8">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: "radial-gradient(circle, oklch(68% 0.18 240 / 0.1), transparent 68%)" }}
      />
      <div className="card-raised relative p-9">
        {profile ? (
          canView ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4.5">
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-dark-tertiary">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        width={72}
                        height={72}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-semibold uppercase text-dark-secondary">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="label-eyebrow">Public profile</p>
                    <h1 className="mt-2 text-[26px] font-bold tracking-tight text-dark-primary">{displayName}</h1>
                    <p className="mt-1 text-sm text-dark-secondary">{profile.membership === "pro" ? "Pro member" : profile.membership === "team" ? "Team member" : "Free member"}</p>
                  </div>
                </div>
                {isOwner ? (
                  <Link href="/profile" className="btn-secondary !px-4 !py-2 text-sm">Edit your profile</Link>
                ) : (
                  <ReportButton targetType="profile" targetId={profileId} targetLabel={displayName} />
                )}
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="label-eyebrow">Bio</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-dark-secondary">{profile.bio ?? "No bio provided."}</p>
                </div>
                <div>
                  <p className="label-eyebrow">Links</p>
                  <div className="mt-3 space-y-2">
                    {isHttpUrl(profile.link1) ? (
                      <a href={profile.link1} target="_blank" rel="noreferrer" className="block text-sm text-accent-blue hover:underline">
                        {profile.link1}
                      </a>
                    ) : null}
                    {isHttpUrl(profile.link2) ? (
                      <a href={profile.link2} target="_blank" rel="noreferrer" className="block text-sm text-accent-blue hover:underline">
                        {profile.link2}
                      </a>
                    ) : null}
                    {isHttpUrl(profile.link3) ? (
                      <a href={profile.link3} target="_blank" rel="noreferrer" className="block text-sm text-accent-blue hover:underline">
                        {profile.link3}
                      </a>
                    ) : null}
                    {![profile.link1, profile.link2, profile.link3].some(isHttpUrl) ? (
                      <p className="text-sm text-dark-secondary">No links added.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="label-eyebrow">Experience</p>
                {experienceItems.length > 0 ? (
                  <ExperienceTimeline items={experienceItems} />
                ) : (
                  <p className="mt-3 text-sm text-dark-secondary">No experience added yet.</p>
                )}
              </div>

              <div className="mt-8">
                <p className="label-eyebrow">Skills</p>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-dark-tertiary px-3 py-1 text-xs font-medium text-dark-secondary">
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
            <p className="mt-3 text-sm leading-7 text-dark-secondary">We couldn&apos;t find a profile for this user.</p>
          </div>
        )}
      </div>
    </main>
  );
}
