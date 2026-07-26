import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumReportData } from "@/lib/reports/premium-report";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { TekmesisLogo } from "@/components/brand/tekmesis-logo";
import { PendingAiNotice } from "./pending-ai-notice";
import { PrintCoverPage } from "./print-cover-page";
import { EvidenceLandscapeSection } from "./evidence-landscape-section";
import { StudyComparisonMatrix } from "./study-comparison-matrix";
import { StudyProfileCard } from "./study-profile-card";
import { SourceAppendix } from "./source-appendix";
import { PrintButton } from "./print-button";
import { orNotReported } from "./format";

/** Card treatment on screen; collapses back to plain flowing content when printed (the print cover page + page-break rules already handle print layout). */
const SECTION_CARD =
  "rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none";

const NAV_SECTIONS = [
  ["cover", "navCover"],
  ["scope", "navScope"],
  ["landscape", "navLandscape"],
  ["comparison", "navComparison"],
  ["profiles", "navProfiles"],
  ["synthesis", "navSynthesis"],
  ["confidence", "navConfidence"],
  ["interpretation", "navInterpretation"],
  ["sources", "navSources"],
] as const;

export function PremiumReportView({
  dict,
  report,
}: {
  dict: Dictionary;
  report: PremiumReportData;
}) {
  const p = dict.premiumReportPage;
  const notReported = p.notReported;

  return (
    <article className="flex w-full max-w-4xl flex-col gap-10 text-left print:max-w-none">
      <PrintCoverPage dict={dict} report={report} />
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <TekmesisLogo name={dict.brand.name} />
        <span className="inline-block rounded-full border border-brand-gold-600 bg-brand-gold-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-navy-900">
          {p.premiumBadge}
        </span>
      </div>
      <nav
        aria-label={p.coverHeading}
        className="sticky top-0 z-10 flex flex-wrap gap-x-4 gap-y-1 border-b border-brand-neutral-200 bg-brand-neutral-50 px-2 py-3 text-xs print:hidden"
      >
        {NAV_SECTIONS.map(([id, labelKey]) => (
          <a key={id} href={`#${id}`} className="text-brand-teal-700 hover:underline">
            {p[labelKey]}
          </a>
        ))}
        <PrintButton label={p.printCta} />
      </nav>

      {/* 1. Cover and Executive Summary */}
      <section id="cover" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-teal-700">
          {p.coverHeading}
        </p>
        <p className="mt-2 text-sm text-brand-neutral-600">{p.originalQuestionLabel}</p>
        {/* h2, not h1: this component is embedded content — the page that
            renders it owns the single page-level h1. */}
        <h2 className="text-2xl font-semibold text-brand-navy-900">{report.originalQuestion}</h2>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.reportDateLabel}</dt>
            <dd className="font-medium text-brand-navy-900">
              {new Date(report.reportDate).toLocaleDateString(
                report.locale === "de" ? "de-CH" : "en-CH",
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.reportVersionLabel}</dt>
            <dd className="font-medium text-brand-navy-900">{report.reportVersion}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.includedLabel}</dt>
            <dd className="font-medium text-brand-navy-900">{report.includedCount}</dd>
          </div>
          <div className="rounded-lg bg-brand-teal-100 p-2">
            <dt className="text-xs text-brand-neutral-600">{p.confidenceHeading}</dt>
            <dd>
              <ConfidenceGauge label={report.confidenceLabel} dict={dict} size="sm" />
            </dd>
          </div>
        </dl>

        <h2 className="mt-6 mb-2 font-semibold text-brand-navy-900">{p.keyFindingsHeading}</h2>
        {report.keyFindings ? (
          <ul className="list-disc pl-5 text-sm text-brand-neutral-600">
            {report.keyFindings.map((finding, index) => (
              <li key={index}>{finding}</li>
            ))}
          </ul>
        ) : (
          <PendingAiNotice dict={dict} />
        )}
      </section>

      {/* 2. Question, Scope, Target Context, and Method */}
      <section id="scope" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.scopeMethodHeading}</h2>
        <p className="text-sm text-brand-neutral-600">{p.interpretedQuestionLabel}</p>
        <p className="mb-3 font-medium text-brand-navy-900">
          {orNotReported(report.interpretedQuestion, notReported)}
        </p>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.searchDateLabel}</dt>
            <dd className="font-medium text-brand-navy-900">
              {new Date(report.searchDate).toLocaleDateString(
                report.locale === "de" ? "de-CH" : "en-CH",
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.candidateLabel}</dt>
            <dd className="font-medium text-brand-navy-900">{report.candidateCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.duplicatesLabel}</dt>
            <dd className="font-medium text-brand-navy-900">{report.duplicatesRemoved}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-neutral-600">{p.includedLabel}</dt>
            <dd className="font-medium text-brand-navy-900">{report.includedCount}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-brand-neutral-600">
          {p.sourcesSearchedLabel}: {report.sourcesSearched.join(", ") || notReported}
        </p>
        {report.sourcesUnavailable.length > 0 && (
          <p className="mt-1 text-sm text-brand-warning-600">
            {p.sourcesUnavailableLabel}: {report.sourcesUnavailable.join(", ")}
          </p>
        )}
        <p className="mt-3 text-xs text-brand-neutral-600">{p.scopeOutOfScopeNote}</p>
      </section>

      {/* 3. Evidence Landscape */}
      <section id="landscape" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">
          {p.evidenceLandscapeHeading}
        </h2>
        <EvidenceLandscapeSection dict={dict} report={report} />
      </section>

      {/* 4. Study Comparison */}
      <section id="comparison" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.comparisonHeading}</h2>
        <StudyComparisonMatrix dict={dict} rows={report.comparison} />
      </section>

      {/* 5. Detailed Study Profiles */}
      <section id="profiles" className={`scroll-mt-16 print:break-before-page ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.profilesHeading}</h2>
        <div className="flex flex-col gap-3">
          {report.profiles.map((profile, index) => (
            <StudyProfileCard key={index} dict={dict} profile={profile} />
          ))}
        </div>
      </section>

      {/* 6. Integrated Synthesis */}
      <section id="synthesis" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.synthesisHeading}</h2>
        {report.synthesisAvailable ? null : <PendingAiNotice dict={dict} variant="short" />}
      </section>

      {/* 7. Evidence Confidence */}
      <section id="confidence" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.confidenceHeading}</h2>
        <ConfidenceGauge label={report.confidenceLabel} dict={dict} />
        <div className="mt-3">
          <PendingAiNotice dict={dict} variant="short" />
        </div>
      </section>

      {/* 8. Practical Interpretation */}
      <section id="interpretation" className={`scroll-mt-16 ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.interpretationHeading}</h2>
        {report.practicalInterpretationAvailable ? null : <PendingAiNotice dict={dict} variant="short" />}
      </section>

      {/* 9. Open Questions and Sources */}
      <section id="sources" className={`scroll-mt-16 print:break-before-page ${SECTION_CARD}`}>
        <h2 className="mb-3 text-xl font-semibold text-brand-navy-900">{p.openQuestionsHeading}</h2>
        <SourceAppendix dict={dict} sources={report.sources} />
      </section>
    </article>
  );
}
