import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { buildExampleReportPreviewSearchResult } from "@/content/example-report-preview";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildPremiumReportData, type PremiumReportData } from "@/lib/reports/premium-report";
import { enrichPremiumReportWithAi } from "@/lib/ai/report-enrichment";
import { PremiumReportView } from "@/components/premium-report/premium-report-view";

// AI enrichment on a cache miss (first visitor after a deploy or cache
// eviction) is a real, potentially slow Anthropic call — same reasoning as
// the Stripe webhook route's maxDuration = 60 (well past the default 10s
// serverless budget). Live-reported symptom (ChatGPT review, 2026-07-31):
// the example report timed out twice.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: `${dict.exampleReportPage.heading} — ${dict.brand.name}`,
    description: dict.exampleReportPage.body,
    alternates: { canonical: "/example-report" },
  };
}

/**
 * The demo's underlying data (content/example-report-preview.ts) never
 * changes, so calling AI extraction/synthesis fresh on every page view
 * would be a pointless repeated cost. Cached per locale for 24h — a real
 * AI call happens at most once a day per locale, not once per visitor.
 */
const getCachedExampleReportData = unstable_cache(
  async (locale: Locale): Promise<PremiumReportData> => {
    const dict = getDictionary(locale);
    const searchResult = buildExampleReportPreviewSearchResult(dict.exampleReportPage.topicQuestion);
    const eligibility = assessEligibility(searchResult);
    const reportData = buildPremiumReportData({
      searchResult,
      eligibility,
      locale,
      reportDate: "2026-07-25T00:00:00.000Z",
    });
    const detailedRecords = searchResult.detailed.map((scored) => scored.deduped.record);
    return enrichPremiumReportWithAi({ report: reportData, detailedRecords });
  },
  ["example-report-data"],
  { revalidate: 60 * 60 * 24 },
);

export default async function ExampleReportPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const reportData = await getCachedExampleReportData(locale);

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
