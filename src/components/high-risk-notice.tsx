import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { WarningIcon } from "@/components/icons/notice-icons";

export function HighRiskNotice({ dict }: { dict: Dictionary }) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border-2 border-brand-warning-500 bg-brand-warning-100 p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <WarningIcon className="mt-1 h-5 w-5 shrink-0 text-brand-warning-600" />
        <h1 className="text-xl font-semibold text-brand-warning-600">
          {dict.searchPage.restrictedHeading}
        </h1>
      </div>
      <p className="text-sm text-brand-neutral-950">{dict.searchPage.restrictedBody}</p>
      <p className="text-sm text-brand-neutral-950">{dict.searchPage.restrictedHelp}</p>
      <div>
        <p className="text-xs font-medium text-brand-neutral-950">
          {dict.searchPage.restrictedHelpContactsLabel}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5 text-xs text-brand-neutral-950">
          {dict.searchPage.restrictedHelpContacts.map((entry) => (
            <li key={entry.country}>
              <strong>{entry.country}:</strong> {entry.contact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
