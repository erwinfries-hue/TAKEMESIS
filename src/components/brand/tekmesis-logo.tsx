/** Shield-and-"T" mark in the style of the supplied onepager reference (docs/assets/onepager) — a placeholder-quality vector mark, not a finalized trademark asset. Uses currentColor so it inherits the brand-teal text color set by callers. */
function TekmesisMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 36" className={className} aria-hidden="true">
      <path
        d="M16 2 L29 7 V17 C29 25.5 23.5 32 16 34.5 C8.5 32 3 25.5 3 17 V7 Z"
        fill="currentColor"
      />
      <path
        d="M10.5 12.5h11M16 12.5v14"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Fixed layout: icon to the left of the wordmark, always — this is the one
 * arrangement used site-wide (header, about page, ...), per explicit
 * instruction not to vary it (e.g. no stacked/centered variant).
 */
export function TekmesisLogo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <TekmesisMark className="h-7 w-7 text-brand-teal-600" />
      <span className="text-lg font-semibold tracking-tight text-brand-navy-900">{name}</span>
    </span>
  );
}
