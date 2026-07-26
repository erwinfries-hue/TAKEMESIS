import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumReportData } from "@/lib/reports/premium-report";
import { ConfidenceGauge } from "@/components/confidence-gauge";
import { TekmesisLogo } from "@/components/brand/tekmesis-logo";

/**
 * Print/PDF-only title page (hidden on screen — `hidden print:flex`). A
 * printed report handed to someone else loses the on-screen nav chrome and
 * browser tab title, so this gives it a real first page instead of starting
 * mid-content on whatever the on-screen layout happened to show first.
 */
export function PrintCoverPage({
  dict,
  report,
}: {
  dict: Dictionary;
  report: PremiumReportData;
}) {
  const p = dict.premiumReportPage;

  return (
    <div className="hidden print:flex print:h-[22cm] print:break-after-page print:flex-col print:items-center print:justify-center print:gap-8 print:text-center">
      <TekmesisLogo name={dict.brand.name} />
      <p className="text-xs font-medium uppercase tracking-widest text-brand-teal-700">
        {dict.brand.claim}
      </p>
      <h1 className="max-w-lg text-3xl font-semibold text-brand-navy-900">
        {report.originalQuestion}
      </h1>
      <p className="text-sm text-brand-neutral-600">{p.coverHeading}</p>
      <dl className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.reportDateLabel}</dt>
          <dd className="font-medium text-brand-navy-900">
            {new Date(report.reportDate).toLocaleDateString(
              report.locale === "de" ? "de-CH" : "en-CH",
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.includedLabel}</dt>
          <dd className="font-medium text-brand-navy-900">{report.includedCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.reportVersionLabel}</dt>
          <dd className="font-medium text-brand-navy-900">{report.reportVersion}</dd>
        </div>
      </dl>
      <div className="flex justify-center">
        <ConfidenceGauge label={report.confidenceLabel} dict={dict} />
      </div>
      <p className="mt-8 text-xs text-brand-neutral-600">{dict.brand.parent} · tekmesis.com</p>
    </div>
  );
}
