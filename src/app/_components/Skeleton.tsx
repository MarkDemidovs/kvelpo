export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-dark-tertiary ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card-raised flex min-h-[200px] flex-col gap-4 p-5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ProjectCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ConversationCardSkeleton() {
  return (
    <div className="card-raised flex flex-col gap-3.5 p-5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-1 flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-3" />
      </div>
    </div>
  );
}

export function ConversationCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="card-raised space-y-6 p-7">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function SubscriptionSkeleton() {
  return (
    <div className="space-y-7 p-4">
      <div className="card-raised p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2.5 h-8 w-56" />
            <Skeleton className="mt-2 h-3 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function PublicProfileSkeleton() {
  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="card-raised p-9">
        <div className="flex items-center gap-4.5">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2.5 h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <Skeleton className="h-3 w-14" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-14" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Skeleton className="h-3 w-16" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function InboxRowSkeleton() {
  return (
    <div className="card-raised flex flex-col gap-2.5 p-4.5">
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Skeleton className="h-8 w-64" />
          <div className="mt-3 flex items-center gap-2.5">
            <Skeleton className="h-6.5 w-6.5 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="flex flex-col gap-10">
          <div>
            <Skeleton className="h-3 w-32" />
            <div className="mt-3.5 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-24" />
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </>
  );
}

export function InboxSkeleton() {
  return (
    <div className="space-y-9">
      <div>
        <Skeleton className="h-3 w-28" />
        <div className="mt-4 space-y-2.5">
          <InboxRowSkeleton />
          <InboxRowSkeleton />
          <InboxRowSkeleton />
        </div>
      </div>
      <div>
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 space-y-2.5">
          <InboxRowSkeleton />
          <InboxRowSkeleton />
        </div>
      </div>
    </div>
  );
}
