import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { InfoIcon } from "@/components/icons/notice-icons";

/** Shared shape for the three "study lookup didn't work out" states: invalid DOI, not found, or a real fetch failure. */
export function StudyLookupNotice({
  dict,
  heading,
  body,
}: {
  dict: Dictionary;
  heading: string;
  body: string;
}) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-brand-teal-600" />
        <h1 className="text-xl font-semibold text-brand-navy-900">{heading}</h1>
      </div>
      <p className="text-sm text-brand-neutral-600">{body}</p>
      <Link
        href="/"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.notFoundPage.homeCta}
      </Link>
    </div>
  );
}
