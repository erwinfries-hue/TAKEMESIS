import { WarningIcon } from "@/components/icons/notice-icons";

/** Shared shape for both the rate-limit and question-too-long guard rails on /search. */
export function SearchLimitNotice({ heading, body }: { heading: string; body: string }) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-2 rounded-xl border border-brand-warning-500 bg-brand-warning-100 p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <WarningIcon className="mt-1 h-5 w-5 shrink-0 text-brand-warning-600" />
        <h1 className="text-xl font-semibold text-brand-warning-600">{heading}</h1>
      </div>
      <p className="text-sm text-brand-neutral-950">{body}</p>
    </div>
  );
}
