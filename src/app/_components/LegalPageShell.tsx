import type { ReactNode } from "react";

interface LegalPageShellProps {
  title: string;
  children: ReactNode;
}

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 bg-dark-primary">
      <div className="card-raised p-9">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-dark-primary">{title}</h1>
        <div className="space-y-8 text-dark-secondary">{children}</div>
      </div>
    </main>
  );
}
