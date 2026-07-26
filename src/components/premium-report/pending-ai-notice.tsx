import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Used everywhere a section's content genuinely requires AI extraction/
 * synthesis that isn't wired up yet — never silently empty, never faked.
 * `variant="short"` renders a single line instead of the full explanation:
 * the first occurrence on a report page (cover/key-findings) explains why
 * once in full; repeating that same paragraph verbatim on every other
 * pending section just reads as boilerplate, so later occurrences use the
 * short form instead.
 */
export function PendingAiNotice({
  dict,
  variant = "full",
}: {
  dict: Dictionary;
  variant?: "full" | "short";
}) {
  if (variant === "short") {
    return (
      <p className="rounded-lg border border-dashed border-brand-neutral-200 bg-brand-neutral-50 px-4 py-2 text-sm text-brand-neutral-600 print:border-brand-neutral-400">
        {dict.premiumReportPage.pendingAiShort}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-brand-neutral-200 bg-brand-neutral-50 p-4 text-sm print:border-brand-neutral-400">
      <p className="font-medium text-brand-neutral-950">
        {dict.premiumReportPage.pendingAiHeading}
      </p>
      <p className="mt-1 text-brand-neutral-600">{dict.premiumReportPage.pendingAiNote}</p>
    </div>
  );
}
