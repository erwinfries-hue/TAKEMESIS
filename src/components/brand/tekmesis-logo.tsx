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

export function TekmesisLogo({
  name,
  tagline,
  variant = "compact",
  className,
}: {
  name: string;
  tagline?: string;
  variant?: "compact" | "stacked";
  className?: string;
}) {
  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 ${className ?? ""}`}>
        <TekmesisMark className="h-14 w-14 text-brand-teal-600" />
        <span className="text-2xl font-semibold tracking-tight text-brand-navy-900">{name}</span>
        {tagline && (
          <span className="text-xs font-medium uppercase tracking-widest text-brand-teal-700">
            {tagline}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <TekmesisMark className="h-7 w-7 text-brand-teal-600" />
      <span className="text-lg font-semibold tracking-tight text-brand-navy-900">{name}</span>
    </span>
  );
}
