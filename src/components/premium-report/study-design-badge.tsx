import type { PublicationType } from "@/lib/source-adapters/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { publicationTypeWeight } from "@/lib/search/ranking";
import { GlossaryTerm } from "@/components/glossary-term";

/**
 * Color tier by evidence-hierarchy weight (see ranking.ts), not a separate
 * judgment — a visual shortcut for the same design strength the text label
 * already states, never color alone (WCAG: the label text is always shown
 * too).
 */
function tierClasses(weight: number): string {
  if (weight >= 4.5) return "bg-brand-teal-600 text-white";
  if (weight >= 3) return "bg-brand-teal-100 text-brand-teal-700";
  if (weight >= 1) return "bg-brand-neutral-100 text-brand-neutral-600";
  return "bg-brand-warning-100 text-brand-warning-600";
}

export function StudyDesignBadge({
  type,
  dict,
  className,
}: {
  type: PublicationType;
  dict: Dictionary;
  className?: string;
}) {
  const weight = publicationTypeWeight(type);
  const pillClasses = `whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tierClasses(weight)} ${className ?? ""}`;
  return (
    <GlossaryTerm definition={dict.glossaryDefinitions[type]} triggerClassName={pillClasses}>
      {dict.publicationTypeLabels[type]}
    </GlossaryTerm>
  );
}
