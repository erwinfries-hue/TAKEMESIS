import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { INTL_DATE_LOCALE } from "@/lib/i18n/date-locale";
import type { TeaserData } from "@/lib/eligibility/teaser";
import type { EligibilityStatus } from "@/lib/eligibility/eligibility";
import { ConfidenceGauge } from "@/components/confidence-gauge";

function formatSearchDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_DATE_LOCALE[locale], {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function FreeTeaser({
  dict,
  locale,
  topicName,
  teaser,
  eligibilityStatus,
}: {
  dict: Dictionary;
  locale: Locale;
  topicName: string;
  teaser: TeaserData;
  eligibilityStatus: EligibilityStatus;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 text-left">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-neutral-600">
          {topicName}
        </p>
        <h1 className="text-2xl font-semibold text-brand-navy-900">{dict.teaserPage.heading}</h1>
        <p className="text-lg text-brand-neutral-950">{teaser.query}</p>
      </header>

      {eligibilityStatus === "eligible_with_limitations" && (
        <div
          role="alert"
          className="rounded-xl border-2 border-brand-warning-500 bg-brand-warning-100 p-4"
        >
          <h2 className="font-semibold text-brand-warning-600">
            {dict.teaserPage.limitationsNoticeHeading}
          </h2>
          <p className="text-sm text-brand-neutral-950">{dict.teaserPage.limitationsNoticeBody}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4 rounded-xl border border-brand-neutral-200 bg-white p-5 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.teaserPage.searchDateLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">
            {formatSearchDate(teaser.searchDate, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.teaserPage.candidateLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">{teaser.candidateCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.teaserPage.duplicatesLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">{teaser.duplicatesRemoved}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{dict.teaserPage.includedLabel}</dt>
          <dd className="font-semibold text-brand-navy-900">{teaser.includedCount}</dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-2 font-semibold text-brand-navy-900">
          {dict.teaserPage.studyTypesHeading}
        </h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {teaser.studyTypeDistribution.map((entry) => (
            <li
              key={entry.type}
              className="rounded-full border border-brand-neutral-200 px-3 py-1 text-brand-neutral-950"
            >
              {dict.publicationTypeLabels[entry.type]}: {entry.count}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-brand-navy-900">
          {dict.teaserPage.confidenceHeading}
        </h2>
        <ConfidenceGauge label={teaser.confidenceLabel} dict={dict} />
        <p className="mt-2 text-xs text-brand-neutral-600">
          {dict.teaserPage.confidencePreliminaryNote}
        </p>
        <a
          href={`/api/evidence-card?${new URLSearchParams({
            q: teaser.query,
            topic: topicName,
            confidence: teaser.confidenceLabel,
            locale,
          }).toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-neutral-200 px-3 py-1 text-xs font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-50"
        >
          <span aria-hidden="true">🔗</span>
          {dict.teaserPage.shareCardCta}
        </a>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-brand-navy-900">
          {dict.teaserPage.topStudiesHeading}
        </h2>
        <ul className="flex flex-col gap-2">
          {teaser.topStudies.map((study, index) => (
            <li
              key={index}
              className="rounded-lg border border-brand-neutral-200 bg-white p-3 text-sm"
            >
              {study.sourceUrl ? (
                <a
                  href={study.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-teal-700 hover:underline"
                >
                  {study.title ?? dict.teaserPage.unknownTitle}
                </a>
              ) : (
                <span className="font-medium text-brand-neutral-950">
                  {study.title ?? dict.teaserPage.unknownTitle}
                </span>
              )}
              <p className="mt-1 text-xs text-brand-neutral-600">
                {[
                  dict.publicationTypeLabels[study.publicationType],
                  study.venue,
                  study.year ? String(study.year) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-brand-neutral-600">{dict.teaserPage.screeningExplanation}</p>

      {teaser.sourcesUnavailable.length > 0 && (
        <p className="text-xs text-brand-warning-600">
          {dict.teaserPage.sourcesUnavailableNote}: {teaser.sourcesUnavailable.join(", ")}
        </p>
      )}

      {teaser.excludedByFilterCount > 0 && (
        <p className="text-xs text-brand-neutral-600">
          {dict.teaserPage.filtersAppliedLabel}: {teaser.excludedByFilterCount}
        </p>
      )}

      <p className="text-xs text-brand-neutral-600">{dict.teaserPage.noCoverageDisclosure}</p>
    </div>
  );
}
