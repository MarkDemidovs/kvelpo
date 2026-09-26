import type { ReactNode } from "react";
import { formatExperienceRange, type Experience } from "~/lib/experience";

interface ExperienceTimelineProps {
  items: Experience[];
  /** Extra controls shown next to each entry (e.g. edit/delete in the editor). */
  renderActions?: (item: Experience) => ReactNode;
}

// LinkedIn-style vertical timeline. Shared by the public profile (server) and
// the profile editor (client), so it must stay free of client-only hooks.
export default function ExperienceTimeline({ items, renderActions }: ExperienceTimelineProps) {
  return (
    <ol className="relative mt-4 border-l border-dark-subtle pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative pb-7 last:pb-0">
          <span
            className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 ${
              item.endDate ? "border-dark-subtle bg-dark-tertiary" : "border-accent-blue bg-accent-blue"
            }`}
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-dark-primary">{item.title}</p>
              <p className="mt-0.5 text-sm text-dark-secondary">
                {item.organization}
                {item.location ? <span className="text-dark-muted"> · {item.location}</span> : null}
              </p>
              <p className="mt-1 text-xs text-dark-muted">{formatExperienceRange(item.startDate, item.endDate)}</p>
            </div>
            {renderActions ? <div className="flex shrink-0 gap-2">{renderActions(item)}</div> : null}
          </div>
          {item.description ? (
            <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-dark-secondary">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
