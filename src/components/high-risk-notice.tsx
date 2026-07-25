import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function HighRiskNotice({ dict }: { dict: Dictionary }) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border-2 border-brand-warning-500 bg-brand-warning-100 p-6 text-left"
    >
      <h1 className="text-xl font-semibold text-brand-warning-600">
        {dict.searchPage.restrictedHeading}
      </h1>
      <p className="text-sm text-brand-neutral-950">{dict.searchPage.restrictedBody}</p>
      <p className="text-sm text-brand-neutral-950">{dict.searchPage.restrictedHelp}</p>
    </div>
  );
}
