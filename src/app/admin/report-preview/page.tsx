import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { topics, topicCopy } from "@/content/topics";
import { runSearch } from "@/lib/search/run-search";
import { buildSearchQuery } from "@/lib/search/query-translation";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildPremiumReportData } from "@/lib/reports/premium-report";
import { enrichPremiumReportWithAi } from "@/lib/ai/report-enrichment";
import { PremiumReportView } from "@/components/premium-report/premium-report-view";

export const metadata: Metadata = { title: "Report-Vorschau (mit KI) — Admin — TEKMESIS" };

// Real live search + AI extraction/synthesis against a genuine question —
// several sequential network calls, well past a default 10s serverless
// budget. Same reasoning as /admin/example-questions.
export const maxDuration = 60;

export default async function AdminReportPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; domain?: string; locale?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const locale = isLocale(params.locale ?? "") ? (params.locale as "de" | "en") : defaultLocale;
  const dict = getDictionary(locale);
  const question = params.q?.trim() ?? "";
  const domain = params.domain && topics.some((t) => t.slug === params.domain) ? params.domain : null;

  let reportView = null;
  let debugPanel = null;
  if (question && domain) {
    const searchResult = await runSearch(question, domain, locale);
    const eligibility = assessEligibility(searchResult);
    const baseReport = buildPremiumReportData({ searchResult, eligibility, locale });
    const detailedRecords = searchResult.detailed.map((scored) => scored.deduped.record);
    const report = await enrichPremiumReportWithAi({
      report: baseReport,
      detailedRecords,
      topicSlug: searchResult.topicSlug,
    });
    reportView = <PremiumReportView dict={dict} report={report} />;

    // Temporary admin-only diagnostic (not shown to real users) — the
    // premium report has no built-in exclusion-reason breakdown, which
    // made a live "0 included, 23 found" result impossible to debug
    // without this. Safe to remove once the underlying gap is understood.
    debugPanel = (
      <div className="rounded-lg border border-brand-warning-600 bg-brand-warning-100 p-4 text-sm">
        <p className="font-semibold text-brand-navy-900">Debug: Übersetzte Suchanfrage & Ausschlussgründe</p>
        <p className="mt-1">
          Original: <code>{question}</code>
        </p>
        <p className="mt-1">
          Übersetzt/an Quellen gesendet: <code>{buildSearchQuery(question, locale)}</code>
        </p>
        <p className="mt-3 font-semibold text-brand-navy-900">Treffer pro Quelle</p>
        <ul className="mt-1 list-disc pl-5">
          {searchResult.perSource.map((s) => (
            <li key={s.source}>
              {s.source}: {s.ok ? `${s.recordCount} Treffer` : `Fehler (${s.error})`}
            </li>
          ))}
        </ul>
        <p className="mt-3 font-semibold text-brand-navy-900">Kandidaten & Duplikate</p>
        <p className="mt-1">
          {searchResult.candidateCount} Rohtreffer insgesamt, {searchResult.duplicatesRemoved} als
          Duplikate zusammengeführt.
        </p>
        <p className="mt-3 font-semibold text-brand-navy-900">Ausschlussgründe</p>
        <ul className="mt-1 list-disc pl-5">
          {Object.entries(searchResult.excludedByReason).map(([reason, count]) => (
            <li key={reason}>
              {reason}: {count}
            </li>
          ))}
        </ul>
        {searchResult.excludedSample && searchResult.excludedSample.length > 0 && (
          <>
            <p className="mt-3 font-semibold text-brand-navy-900">
              Ausgeschlossene Titel ({searchResult.excludedSample.length})
            </p>
            <ul className="mt-1 list-disc pl-5">
              {searchResult.excludedSample.map((sample, index) => (
                <li key={index}>
                  [{sample.source}
                  {sample.mergedFromSources.length > 1 &&
                    ` +${sample.mergedFromSources.filter((s) => s !== sample.source).join(",")}`}
                  /{sample.reason}/{sample.hasAbstract ? "mit Abstract" : "ohne Abstract"}]{" "}
                  {sample.title ?? "(kein Titel)"}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-navy-900">Report-Vorschau (mit KI)</h1>
        <a href="/admin" className="text-sm text-brand-teal-700 hover:underline">
          Zurück zur Übersicht
        </a>
      </div>

      <p className="max-w-2xl text-sm text-brand-neutral-600">
        Läuft gegen die echte Suche und echte KI-Extraktion/Synthese (falls{" "}
        <code>ANTHROPIC_API_KEY</code> und <code>AI_EXTRACTION_ENABLED</code> gesetzt sind) — nicht
        gegen Platzhalterdaten. Nur für dich sichtbar, damit echte Kosten nicht durch öffentlichen
        Traffic entstehen.
      </p>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-1 min-w-[16rem] flex-col gap-1 text-sm">
          <span className="font-medium text-brand-neutral-950">Frage</span>
          <input
            type="text"
            name="q"
            defaultValue={question}
            className="rounded-lg border border-brand-neutral-200 p-2"
            placeholder="z. B. Hilft Kreatin beim Muskelaufbau?"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-neutral-950">Thema</span>
          <select
            name="domain"
            defaultValue={domain ?? ""}
            className="rounded-lg border border-brand-neutral-200 p-2"
          >
            <option value="" disabled>
              Thema wählen …
            </option>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topicCopy(topic, locale).name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-neutral-950">Sprache</span>
          <select name="locale" defaultValue={locale} className="rounded-lg border border-brand-neutral-200 p-2">
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white hover:bg-brand-navy-800"
        >
          Report generieren
        </button>
      </form>

      {debugPanel}
      {reportView}
    </main>
  );
}
