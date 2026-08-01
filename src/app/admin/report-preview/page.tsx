import type { Metadata } from "next";
import { XMLParser } from "fast-xml-parser";
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
import { serverEnv } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Report-Vorschau (mit KI) — Admin — TEKMESIS",
  robots: { index: false, follow: false },
};

interface ClinicalTrialCheckInput {
  title: string | null;
  source: string;
  sourceId: string;
  doi: string | null;
}

interface ClinicalTrialCheckResult {
  checked: number;
  linked: Array<{ title: string | null; source: string; trialIds: string[] }>;
}

const trialXmlParser = new XMLParser({
  ignoreAttributes: false,
  isArray: (tagName) => ["PubmedArticle", "DataBank", "AccessionNumber"].includes(tagName),
});

/**
 * Temporary, admin-only diagnostic for the country-filter concept
 * (docs/OPEN_RISKS.md #22, "Option 3") — checks how many of a real search's
 * included studies carry a linked clinical-trial registry ID (Crossref's
 * top-level `clinical-trial-number` array, or a PubMed
 * DataBankList/ClinicalTrials.gov accession number), the only honest
 * per-study population-country signal found in research. Not a shipped
 * feature — no NormalizedRecord/adapter changes, just a one-off count to
 * see whether Option 3's coverage is worth the engineering effort before
 * building it for real. Safe to delete once that decision is made.
 */
async function checkClinicalTrialCoverage(
  records: ClinicalTrialCheckInput[],
): Promise<ClinicalTrialCheckResult> {
  const linked: ClinicalTrialCheckResult["linked"] = [];
  let checked = 0;

  await Promise.all(
    records.map(async (record) => {
      try {
        if (record.source === "crossref" && record.doi) {
          checked += 1;
          const res = await fetch(
            `${serverEnv.CROSSREF_BASE_URL}/works/${encodeURIComponent(record.doi)}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as {
            message?: { "clinical-trial-number"?: Array<{ "clinical-trial-number"?: string }> };
          };
          const ids = (data.message?.["clinical-trial-number"] ?? [])
            .map((entry) => entry["clinical-trial-number"])
            .filter((id): id is string => Boolean(id));
          if (ids.length > 0) {
            linked.push({ title: record.title, source: "crossref", trialIds: ids });
          }
        } else if (record.source === "ncbi_pubmed") {
          checked += 1;
          const url = new URL(`${serverEnv.NCBI_EUTILS_BASE_URL}/efetch.fcgi`);
          url.searchParams.set("db", "pubmed");
          url.searchParams.set("id", record.sourceId);
          url.searchParams.set("retmode", "xml");
          url.searchParams.set("rettype", "abstract");
          url.searchParams.set("tool", serverEnv.NCBI_TOOL);
          if (serverEnv.NCBI_EMAIL) url.searchParams.set("email", serverEnv.NCBI_EMAIL);
          if (serverEnv.NCBI_API_KEY) url.searchParams.set("api_key", serverEnv.NCBI_API_KEY);
          const res = await fetch(url.toString());
          if (!res.ok) return;
          const xml = await res.text();
          const parsed = trialXmlParser.parse(xml) as {
            PubmedArticleSet?: {
              PubmedArticle?: Array<{
                MedlineCitation?: {
                  Article?: {
                    DataBankList?: {
                      DataBank?: Array<{
                        DataBankName?: string;
                        AccessionNumberList?: { AccessionNumber?: string[] };
                      }>;
                    };
                  };
                };
              }>;
            };
          };
          const article = parsed.PubmedArticleSet?.PubmedArticle?.[0];
          const banks = article?.MedlineCitation?.Article?.DataBankList?.DataBank ?? [];
          const ids = banks
            .filter((bank) => bank.DataBankName === "ClinicalTrials.gov" || bank.DataBankName === "NCT")
            .flatMap((bank) => bank.AccessionNumberList?.AccessionNumber ?? []);
          if (ids.length > 0) {
            linked.push({ title: record.title, source: "ncbi_pubmed", trialIds: ids });
          }
        }
      } catch {
        // Best-effort diagnostic only — a failed check just doesn't count, never breaks the page.
      }
    }),
  );

  return { checked, linked };
}

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

    const trialCoverage = await checkClinicalTrialCoverage(
      detailedRecords.map((record) => ({
        title: record.title,
        source: record.source,
        sourceId: record.sourceId,
        doi: record.doi,
      })),
    );

    const translatedQuery = await buildSearchQuery(question, locale);

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
          Übersetzt/an Quellen gesendet: <code>{translatedQuery}</code>
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
        <p className="mt-3 font-semibold text-brand-navy-900">
          Diagnose: Klinische-Studien-Verknüpfung (Länderfilter-Konzept, Option 3)
        </p>
        <p className="mt-1">
          {trialCoverage.linked.length} von {trialCoverage.checked} geprüften Studien (Crossref/NCBI)
          haben eine verknüpfte Registrierungsnummer
          {trialCoverage.checked > 0 &&
            ` (${Math.round((trialCoverage.linked.length / trialCoverage.checked) * 100)} %)`}
          .
        </p>
        {trialCoverage.linked.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {trialCoverage.linked.map((entry, index) => (
              <li key={index}>
                [{entry.source}] {entry.title ?? "(kein Titel)"} — {entry.trialIds.join(", ")}
              </li>
            ))}
          </ul>
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
