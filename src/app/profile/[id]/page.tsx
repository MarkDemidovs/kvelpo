import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { profiles } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { userId } = await auth();
  const profileId = params.id;

  const profile = await db.query.profiles.findFirst({
    where: (p, { eq }) => eq(p.clerkUserId, profileId),
  });

  const isOwner = userId === profileId;
  const canView = profile && (profile.isPublic || isOwner);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        {profile ? (
          canView ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Public profile</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">{profile.fullName ?? "Anonymous"}</h1>
                  <p className="mt-1 text-sm text-slate-500">{profile.membership === "pro" ? "Pro member" : profile.membership === "team" ? "Team member" : "Free member"}</p>
                </div>
                {isOwner ? (
                  <Link
                    href="/profile"
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    Edit your profile
                  </Link>
                ) : null}
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="space-y-4 rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">Bio</p>
                  <p className="text-sm leading-7 text-slate-600">{profile.bio ?? "No bio provided."}</p>
                </div>
                <div className="space-y-4 rounded-3xl bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">Links</p>
                  <div className="space-y-2">
                    {profile.link1 ? (
                      <a href={profile.link1} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        {profile.link1}
                      </a>
                    ) : null}
                    {profile.link2 ? (
                      <a href={profile.link2} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        {profile.link2}
                      </a>
                    ) : null}
                    {profile.link3 ? (
                      <a href={profile.link3} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        {profile.link3}
                      </a>
                    ) : null}
                    {!profile.link1 && !profile.link2 && !profile.link3 ? (
                      <p className="text-sm text-slate-500">No links added.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Skills</p>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No skills added.</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-xl font-semibold text-slate-900">Profile unavailable</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">This profile is private and can only be viewed by the owner.</p>
            </div>
          )
        ) : (
          <div>
            <p className="text-xl font-semibold text-slate-900">Profile not found</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">We couldn’t find a profile for this user.</p>
          </div>
        )}
      </div>
    </main>
  );
}
