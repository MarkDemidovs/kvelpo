/** The kvelpo mark. Uses currentColor so it follows the active theme's text colour. */
export default function Logo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 679.74 826.08"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <polygon points="679.74 0 498.61 310.39 219.54 397.9 451.76 0 679.74 0" />
      <rect y="178.36" width="219.54" height="219.54" />
      <polygon points="679.74 826.08 498.61 515.69 219.54 428.18 451.76 826.08 679.74 826.08" />
      <rect y="428.18" width="219.54" height="219.54" />
    </svg>
  );
}
