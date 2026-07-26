import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";

/**
 * Fictional placeholder records for the /example-report structural preview
 * ONLY — never presented as real evidence (see docs/20_VISUAL_ASSET_USAGE_RULES.md:
 * the same principle that applies to the supplied design-reference images
 * applies here). Every title/author/venue is invented and clearly labeled
 * as such in the UI. Deliberately varied publicationType/dataCompleteness so
 * the preview demonstrates the full range of report states.
 */
const PLACEHOLDER_RECORDS: NormalizedRecord[] = [
  {
    source: "openalex",
    sourceId: "placeholder-1",
    doi: null,
    title: "[Platzhalter] Beispielstudie 1 zu Methode A",
    authors: ["Platzhalter Autor:in 1", "Platzhalter Autor:in 2"],
    venue: "[Platzhalter-Fachzeitschrift]",
    year: 2022,
    publicationType: "rct",
    abstract:
      "[Platzhalter] Randomisierte kontrollierte Studie mit 180 gesunden Erwachsenen (18-45 Jahre). Die Interventionsgruppe erhielt Methode A über 8 Wochen, die Kontrollgruppe ein Placebo. Die Zielgrösse verbesserte sich in der Interventionsgruppe signifikant stärker als in der Kontrollgruppe (Unterschied: 12%, 95%-Konfidenzintervall 4-20%, p=0.03). Limitation: kurze Nachbeobachtungszeit von 4 Wochen nach Studienende.",
    isOpenAccess: null,
    retractionStatus: "none",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "abstract",
    fetchedAt: "2026-07-25T00:00:00.000Z",
  },
  {
    source: "crossref",
    sourceId: "placeholder-2",
    doi: null,
    title: "[Platzhalter] Systematische Übersicht zu Methode B",
    authors: ["Platzhalter Autor:in 3"],
    venue: "[Platzhalter-Fachzeitschrift 2]",
    year: 2020,
    publicationType: "systematic_review",
    abstract:
      "[Platzhalter] Systematische Übersichtsarbeit über 14 Studien mit insgesamt rund 2100 Teilnehmenden zu Methode B. Die meisten eingeschlossenen Studien berichteten einen positiven Effekt auf die Zielgrösse, einzelne Studien fanden jedoch keinen Effekt. Die Heterogenität zwischen den Studien war hoch. Limitation: uneinheitliche Studienqualität und unterschiedliche Falldefinitionen erschweren eine gepoolte Effektschätzung.",
    isOpenAccess: null,
    retractionStatus: "unknown",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "abstract",
    fetchedAt: "2026-07-25T00:00:00.000Z",
  },
  {
    source: "europe_pmc",
    sourceId: "placeholder-3",
    doi: null,
    title: "[Platzhalter] Kohortenstudie zu Methode C",
    authors: ["Platzhalter Autor:in 4"],
    venue: "[Platzhalter-Fachzeitschrift 3]",
    year: 2019,
    publicationType: "cohort",
    abstract: null,
    isOpenAccess: null,
    retractionStatus: "none",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "metadata_only",
    fetchedAt: "2026-07-25T00:00:00.000Z",
  },
  {
    source: "ncbi_pubmed",
    sourceId: "placeholder-4",
    doi: null,
    title: "[Platzhalter] Quasi-experimentelle Untersuchung zu Methode D",
    authors: [],
    venue: null,
    year: 2023,
    publicationType: "quasi_experimental",
    abstract: null,
    isOpenAccess: null,
    retractionStatus: "unknown",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "metadata_only",
    fetchedAt: "2026-07-25T00:00:00.000Z",
  },
  {
    source: "openalex",
    sourceId: "placeholder-5",
    doi: null,
    title: "[Platzhalter] Narrative Review zu Methode E",
    authors: ["Platzhalter Autor:in 5"],
    venue: "[Platzhalter-Fachzeitschrift 4]",
    year: 2024,
    publicationType: "review",
    abstract:
      "[Platzhalter] Narrative Übersichtsarbeit zu Methode E, basierend auf publizierten Studien der letzten zehn Jahre. Insgesamt fand sich in den meisten Einzelstudien kein eindeutiger Effekt von Methode E auf die untersuchte Zielgrösse. Limitation: keine systematische Suchstrategie, daher eingeschränkte Vollständigkeit der einbezogenen Literatur.",
    isOpenAccess: null,
    retractionStatus: "none",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "abstract",
    fetchedAt: "2026-07-25T00:00:00.000Z",
  },
];

export function buildExampleReportPreviewSearchResult(query: string): SearchRunResult {
  const scored = PLACEHOLDER_RECORDS.map((record) => ({
    deduped: { record, mergedFromSources: [record.source] },
    score: 0,
  }));

  return {
    query,
    topicSlug: "lernen-bildung",
    searchDate: "2026-07-25T00:00:00.000Z",
    screeningVersion: "preview",
    candidateCount: PLACEHOLDER_RECORDS.length + 2,
    duplicatesRemoved: 2,
    includedCount: PLACEHOLDER_RECORDS.length,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
    perSource: [
      { source: "openalex", ok: true, recordCount: 2 },
      { source: "crossref", ok: true, recordCount: 1 },
      { source: "europe_pmc", ok: true, recordCount: 1 },
      { source: "ncbi_pubmed", ok: true, recordCount: 1 },
    ],
    rankedIncluded: scored,
    detailed: scored,
  };
}
