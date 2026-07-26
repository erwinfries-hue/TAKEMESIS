import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumComparisonRow } from "@/lib/reports/premium-report";
import { orNotReported } from "./format";
import { StudyDesignBadge } from "./study-design-badge";

/** Desktop table + mobile cards for the same data — design-doc requirement ("mobile cards for comparisons", "no illegible desktop-only tables"). */
export function StudyComparisonMatrix({
  dict,
  rows,
}: {
  dict: Dictionary;
  rows: PremiumComparisonRow[];
}) {
  const notReported = dict.premiumReportPage.notReported;

  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white sm:block print:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{dict.premiumReportPage.comparisonTableCaption}</caption>
          <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
            <tr>
              <th className="px-4 py-3 font-semibold">{dict.premiumReportPage.studyColumnLabel}</th>
              <th className="px-4 py-3 font-semibold">{dict.premiumReportPage.yearColumnLabel}</th>
              <th className="px-4 py-3 font-semibold">{dict.premiumReportPage.designColumnLabel}</th>
              <th className="px-4 py-3 font-semibold">{dict.premiumReportPage.outcomeColumnLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-brand-neutral-100 last:border-0 align-top">
                <td className="px-4 py-3 text-brand-navy-900">
                  {row.sourceUrl ? (
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-teal-700 hover:underline"
                    >
                      {row.citation}
                    </a>
                  ) : (
                    row.citation
                  )}
                </td>
                <td className="px-4 py-3 text-brand-neutral-600">{row.year ?? notReported}</td>
                <td className="px-4 py-3 text-brand-neutral-600">
                  <StudyDesignBadge type={row.design} dict={dict} />
                </td>
                <td className="px-4 py-3 text-brand-neutral-600">
                  {orNotReported(row.outcome, notReported)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-3 sm:hidden print:hidden">
        {rows.map((row, index) => (
          <li key={index} className="rounded-xl border border-brand-neutral-200 bg-white p-4 text-sm">
            <p className="font-medium text-brand-navy-900">{row.citation}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-neutral-600">
              <div>
                <dt className="font-medium">{dict.premiumReportPage.yearColumnLabel}</dt>
                <dd>{row.year ?? notReported}</dd>
              </div>
              <div>
                <dt className="font-medium">{dict.premiumReportPage.designColumnLabel}</dt>
                <dd>{dict.publicationTypeLabels[row.design]}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-medium">{dict.premiumReportPage.outcomeColumnLabel}</dt>
                <dd>{orNotReported(row.outcome, notReported)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
