import Link from "next/link";
import type { ReactNode } from "react";

/** Shared pieces for the grouped list screens (Account, Settings). */

export const menuIconProps = {
  className: "h-[18px] w-[18px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Chevron() {
  return (
    <svg className="h-4 w-4 shrink-0 text-dark-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-tertiary text-fg">{children}</span>
  );
}

/** A titled group of rows inside one card. */
export function MenuGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title ? <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-dark-muted">{title}</p> : null}
      <div className="overflow-hidden rounded-2xl border border-dark-subtle bg-dark-card">{children}</div>
    </section>
  );
}

const rowClass =
  "flex items-center gap-3 border-b border-dark-subtle px-4 py-3.5 text-fg transition last:border-b-0 hover:bg-dark-tertiary";

export function MenuRow({
  href,
  icon,
  label,
  description,
  trailing,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <Link href={href} className={rowClass}>
      <IconBubble>{icon}</IconBubble>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {description ? <span className="mt-0.5 block text-[13px] text-dark-muted">{description}</span> : null}
      </span>
      {trailing}
      <Chevron />
    </Link>
  );
}

/** A non-link row with a control on the right (toggle, segmented control...). */
export function MenuControlRow({
  icon,
  label,
  description,
  children,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-dark-subtle px-4 py-3 last:border-b-0">
      <IconBubble>{icon}</IconBubble>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-fg">{label}</span>
        {description ? <span className="mt-0.5 block text-[13px] text-dark-muted">{description}</span> : null}
      </span>
      {children}
    </div>
  );
}
