import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { ConfidenceLabel } from "@/lib/eligibility/teaser";

/** Ordered weakest → strongest; "not_assessed" renders no fill (a gauge implies a measurement, and none exists yet). */
const FILLED_SEGMENTS: Record<ConfidenceLabel, number> = {
  not_assessed: 0,
  very_uncertain: 1,
  limited: 2,
  moderate: 3,
  higher: 4,
};

const TOTAL_SEGMENTS = 4;

/**
 * Visual companion to the text confidence label — never a replacement for
 * it (WCAG: never convey information by color/shape alone). Purely a
 * presentation of the already-computed `ConfidenceLabel`; invents nothing.
 */
export function ConfidenceGauge({
  label,
  dict,
  size = "md",
}: {
  label: ConfidenceLabel;
  dict: Dictionary;
  size?: "sm" | "md";
}) {
  const filled = FILLED_SEGMENTS[label];
  const segmentHeight = size === "sm" ? "h-1.5" : "h-2";
  const segmentWidth = size === "sm" ? "w-4" : "w-6";

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={dict.confidenceLabels[label]}
      >
        {Array.from({ length: TOTAL_SEGMENTS }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`${segmentHeight} ${segmentWidth} rounded-full ${
              index < filled ? "bg-brand-teal-600" : "bg-brand-neutral-200"
            }`}
          />
        ))}
      </div>
      <span
        className={`font-medium text-brand-teal-700 ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        {dict.confidenceLabels[label]}
      </span>
    </div>
  );
}
