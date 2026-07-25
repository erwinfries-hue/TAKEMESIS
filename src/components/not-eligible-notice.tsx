import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function NotEligibleNotice({ dict }: { dict: Dictionary }) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <h1 className="text-xl font-semibold text-brand-navy-900">
        {dict.notEligiblePage.heading}
      </h1>
      <p className="text-sm text-brand-neutral-600">
        {dict.notEligiblePage.bodyInsufficientEvidence}
      </p>
      <h2 className="font-semibold text-brand-navy-900">{dict.notEligiblePage.refineHeading}</h2>
      <p className="text-sm text-brand-neutral-600">{dict.notEligiblePage.refineBody}</p>
      <Link
        href="/topics"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.notEligiblePage.refineCta}
      </Link>
    </div>
  );
}
