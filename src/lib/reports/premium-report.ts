import type { Locale } from "@/lib/i18n/config";
import type {
  DataCompleteness,
  NormalizedRecord,
  PublicationType,
  SourceId,
} from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";
import type { EligibilityAssessment } from "@/lib/eligibility/eligibility";
import { deriveConfidenceLabel, type ConfidenceLabel } from "@/lib/eligibility/teaser";

export const PREMIUM_REPORT_VERSION = "premium-v1";

/**
 * Structured data for all 9 sections of 06_PREMIUM_REPORT_SPECIFICATION.md.
 * Deliberately holds no baked prose — like TeaserData, display copy comes
 * from the i18n dictionaries in the view layer, this only holds facts.
 *
 * Fields set to `null` are not a bug: they are content that genuinely
 * requires AI-based extraction/synthesis (docs/01: "query interpretation,
 * structured extraction, clustering/comparison, plain-language synthesis"),
 * which isn't available yet (no ANTHROPIC_API_KEY provisioned). Per the
 * evidence-integrity rules, unknown stays null and is displayed as "Nicht
 * angegeben" / "Not reported" — never guessed or invented.
 */
export interface PremiumReportData {
  originalQuestion: string;
  interpretedQuestion: string | null;
  locale: Locale;
  reportVersion: string;
  reportDate: string;
  searchDate: string;
  sourcesSearched: SourceId[];
  sourcesUnavailable: SourceId[];
  candidateCount: number;
  duplicatesRemoved: number;
  includedCount: number;
  studyTypeDistribution: Array<{ type: PublicationType; count: number }>;
  publicationYearRange: { earliest: number | null; latest: number | null };
  confidenceLabel: ConfidenceLabel;
  /** 5-7 key findings — always null until AI-based synthesis exists; never fabricated. */
  keyFindings: string[] | null;
  comparison: PremiumComparisonRow[];
  profiles: PremiumStudyProfile[];
  synthesisAvailable: boolean;
  /** The actual synthesis prose — null until AI-based synthesis exists; never fabricated. */
  synthesisText: string | null;
  practicalInterpretationAvailable: boolean;
  /** The actual practical-interpretation prose — null until AI-based synthesis exists; never fabricated. */
  practicalInterpretationText: string | null;
  sources: PremiumSourceEntry[];
}

export interface PremiumComparisonRow {
  citation: string;
  year: number | null;
  design: PublicationType;
  dataCompleteness: DataCompleteness;
  sourceUrl: string | null;
  outcome: string | null;
  effectEstimate: string | null;
  keyFinding: string | null;
  limitations: string | null;
}

export interface PremiumStudyProfile {
  citation: string;
  design: PublicationType;
  source: SourceId;
  sourceUrl: string | null;
  doi: string | null;
  dataCompleteness: DataCompleteness;
  population: string | null;
  intervention: string | null;
  outcome: string | null;
  result: string | null;
  uncertainty: string | null;
  limitations: string | null;
  fundingConflicts: string | null;
}

export interface PremiumSourceEntry {
  citation: string;
  doi: string | null;
  sourceUrl: string | null;
  source: SourceId;
}

function buildCitation(record: NormalizedRecord, locale: Locale): string {
  const notReported = locale === "de" ? "nicht angegeben" : "not reported";
  const authors = record.authors.length > 0 ? record.authors.join(", ") : notReported;
  const year = record.year ? `(${record.year})` : `(${notReported})`;
  const title = record.title ?? (locale === "de" ? "Titel nicht angegeben" : "Title not reported");
  const venue = record.venue ? ` ${record.venue}.` : "";
  return `${authors} ${year}. ${title}.${venue}`;
}

function studyTypeDistribution(
  records: NormalizedRecord[],
): Array<{ type: PublicationType; count: number }> {
  const counts = new Map<PublicationType, number>();
  for (const record of records) {
    counts.set(record.publicationType, (counts.get(record.publicationType) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

function publicationYearRange(records: NormalizedRecord[]): {
  earliest: number | null;
  latest: number | null;
} {
  const years = records.map((r) => r.year).filter((y): y is number => y !== null);
  if (years.length === 0) {
    return { earliest: null, latest: null };
  }
  return { earliest: Math.min(...years), latest: Math.max(...years) };
}

export interface BuildPremiumReportParams {
  searchResult: SearchRunResult;
  eligibility: EligibilityAssessment;
  locale: Locale;
  reportDate?: string;
  reportVersion?: string;
}

export function buildPremiumReportData(params: BuildPremiumReportParams): PremiumReportData {
  const { searchResult, eligibility, locale } = params;
  const includedRecords = searchResult.rankedIncluded.map((s) => s.deduped.record);
  const detailedRecords = searchResult.detailed.map((s) => s.deduped.record);

  return {
    originalQuestion: searchResult.query,
    // No AI-based query interpretation exists yet (Phase 3 is rule-based
    // classification only) — honestly null rather than echoing the raw
    // question back as if it were a distinct interpretation.
    interpretedQuestion: null,
    locale,
    reportVersion: params.reportVersion ?? PREMIUM_REPORT_VERSION,
    reportDate: params.reportDate ?? new Date().toISOString(),
    searchDate: searchResult.searchDate,
    sourcesSearched: searchResult.perSource.filter((s) => s.ok).map((s) => s.source),
    sourcesUnavailable: searchResult.perSource.filter((s) => !s.ok).map((s) => s.source),
    candidateCount: searchResult.candidateCount,
    duplicatesRemoved: searchResult.duplicatesRemoved,
    includedCount: searchResult.includedCount,
    studyTypeDistribution: studyTypeDistribution(includedRecords),
    publicationYearRange: publicationYearRange(includedRecords),
    confidenceLabel: deriveConfidenceLabel(eligibility),
    keyFindings: null,
    comparison: detailedRecords.map((record) => ({
      citation: buildCitation(record, locale),
      year: record.year,
      design: record.publicationType,
      dataCompleteness: record.dataCompleteness,
      sourceUrl: record.sourceUrl,
      outcome: null,
      effectEstimate: null,
      keyFinding: null,
      limitations: null,
    })),
    profiles: detailedRecords.map((record) => ({
      citation: buildCitation(record, locale),
      design: record.publicationType,
      source: record.source,
      sourceUrl: record.sourceUrl,
      doi: record.doi,
      dataCompleteness: record.dataCompleteness,
      population: null,
      intervention: null,
      outcome: null,
      result: null,
      uncertainty: null,
      limitations: null,
      fundingConflicts: null,
    })),
    synthesisAvailable: false,
    synthesisText: null,
    practicalInterpretationAvailable: false,
    practicalInterpretationText: null,
    sources: includedRecords.map((record) => ({
      citation: buildCitation(record, locale),
      doi: record.doi,
      sourceUrl: record.sourceUrl,
      source: record.source,
    })),
  };
}
