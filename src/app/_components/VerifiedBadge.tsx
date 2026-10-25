/** Small check-seal shown next to Pro members' names. */
export default function VerifiedBadge({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span title="Verified Pro member" className="inline-flex shrink-0 text-accent-blue">
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="Verified Pro member" role="img">
        <path d="M12 2l2.4 1.7 2.9-.1 1 2.7 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-1 2.7-2.9-.1L12 22l-2.4-1.7-2.9.1-1-2.7-2.4-1.7.9-2.8-.9-2.8 2.4-1.7 1-2.7 2.9.1L12 2z" />
        <path d="M8.5 12.2l2.4 2.4 4.6-4.9" fill="none" stroke="var(--bg)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
