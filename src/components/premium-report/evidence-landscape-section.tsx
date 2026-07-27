import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumReportData } from "@/lib/reports/premium-report";
import { PublicationTimelineChart } from "./publication-timeline-chart";

export function EvidenceLandscapeSection({
  dict,
  report,
}: {
  dict: Dictionary;
  report: PremiumReportData;
}) {
  const notReported = dict.premiumReportPage.notReported;
  const { earliest, latest } = report.publicationYearRange;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">
          {dict.premiumReportPage.studyTypesHeading}
        </h3>
        <ul className="flex flex-wrap gap-2 text-sm">
          {report.studyTypeDistribution.map((entry) => (
            <li
              key={entry.type}
              className="rounded-full border border-brand-neutral-200 px-3 py-1 text-brand-neutral-950"
            >
              {dict.publicationTypeLabels[entry.type]}: {entry.count}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-brand-neutral-950">
          {dict.premiumReportPage.yearRangeLabel}
        </h3>
        <p className="text-sm text-brand-neutral-600">
          {earliest && latest ? `${earliest}–${latest}` : notReported}
        </p>
      </div>
      <PublicationTimelineChart dict={dict} rows={report.comparison} />
    </div>
  );
}
