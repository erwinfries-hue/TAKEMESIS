import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { TeaserData } from "@/lib/eligibility/teaser";
import { ConfidenceGauge } from "@/components/confidence-gauge";

/**
 * Landing-page teaser preview built from the same vetted, clearly-fictional
 * dataset as /example-report (src/content/example-report-preview.ts) run
 * through the real buildTeaserData logic — not hand-invented numbers. Never
 * presented as a live search result: the badge and framing make that
 * explicit, matching the /example-report page's existing pattern.
 */
export function LiveDemoPreview({ dict, teaser }: { dict: Dictionary; teaser: TeaserData }) {
  return (
    <div className="animate-fade-in-up w-full max-w-md rounded-xl border border-brand-neutral-200 bg-white p-5 text-left shadow-sm">
      <span className="inline-block rounded-full bg-brand-warning-100 px-3 py-1 text-xs font-medium text-brand-warning-600">
        {dict.home.liveDemoBadge}
      </span>
      <p className="mt-3 text-sm text-brand-neutral-600">{dict.home.liveDemoHeading}</p>
      <p className="font-semibold text-brand-navy-900">{teaser.query}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.home.liveDemoCandidateLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">{teaser.candidateCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.home.liveDemoIncludedLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">{teaser.includedCount}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <ConfidenceGauge label={teaser.confidenceLabel} dict={dict} size="sm" />
      </div>
      <Link
        href="/example-report"
        className="mt-4 inline-block text-sm font-medium text-brand-teal-700 hover:underline"
      >
        {dict.home.liveDemoCta} →
      </Link>
    </div>
  );
}
