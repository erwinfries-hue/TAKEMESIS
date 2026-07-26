import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Used everywhere a section's content genuinely requires AI extraction/synthesis that isn't wired up yet — never silently empty, never faked. */
export function PendingAiNotice({ dict }: { dict: Dictionary }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-neutral-200 bg-brand-neutral-50 p-4 text-sm print:border-brand-neutral-400">
      <p className="font-medium text-brand-neutral-950">
        {dict.premiumReportPage.pendingAiHeading}
      </p>
      <p className="mt-1 text-brand-neutral-600">{dict.premiumReportPage.pendingAiNote}</p>
    </div>
  );
}
