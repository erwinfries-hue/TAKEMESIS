import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { InfoIcon } from "@/components/icons/notice-icons";

export function SearchFailedNotice({
  dict,
  retryHref,
}: {
  dict: Dictionary;
  retryHref: string;
}) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <div className="flex items-center gap-2">
        <InfoIcon className="h-5 w-5 shrink-0 text-brand-teal-600" />
        <h1 className="text-xl font-semibold text-brand-navy-900">
          {dict.searchFailedPage.heading}
        </h1>
      </div>
      <p className="text-sm text-brand-neutral-600">{dict.searchFailedPage.body}</p>
      <Link
        href={retryHref}
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.searchFailedPage.retryCta}
      </Link>
    </div>
  );
}
