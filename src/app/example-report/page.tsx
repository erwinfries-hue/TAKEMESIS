import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildExampleReportPreviewSearchResult } from "@/content/example-report-preview";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildPremiumReportData } from "@/lib/reports/premium-report";
import { PremiumReportView } from "@/components/premium-report/premium-report-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.exampleReportPage.heading} — ${dict.brand.name}` };
}

export default async function ExampleReportPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const searchResult = buildExampleReportPreviewSearchResult(dict.exampleReportPage.topicQuestion);
  const eligibility = assessEligibility(searchResult);
  const reportData = buildPremiumReportData({
    searchResult,
    eligibility,
    locale,
    reportDate: "2026-07-25T00:00:00.000Z",
  });

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.exampleReportPage.heading}
        </h1>
        <span className="rounded-full bg-brand-warning-100 px-3 py-1 text-xs font-medium text-brand-warning-600">
          {dict.exampleReportPage.status}
        </span>
        <p className="max-w-xl text-brand-neutral-600">{dict.exampleReportPage.body}</p>
        <p className="max-w-xl text-xs font-medium text-brand-warning-600">
          {dict.exampleReportPage.previewNote}
        </p>
      </div>

      <PremiumReportView dict={dict} report={reportData} />
    </main>
  );
}
