import type { SearchRunResult } from "@/lib/search/run-search";
import type { DataCompleteness, NormalizedRecord, PublicationType } from "@/lib/source-adapters/types";
import type { EligibilityAssessment } from "./eligibility";
import { deriveConfidenceLabel, type ConfidenceLabel } from "./teaser";

/**
 * "Evidenz-Profil" — a standardized, multi-dimension snapshot of a search's
 * evidence quality, shown alongside the free teaser (compact) and the paid
 * report (full). Deliberately synthesizes only facts already computed
 * elsewhere in the pipeline (confidence label, study-type mix, source
 * coverage, data completeness, publication recency, correction status) —
 * this is a presentation layer over existing signals, not a new scoring
 * model. Two dimensions the catalog envisioned (result consistency,
 * population transferability) require structured per-study extraction
 * (population/outcome fields) that only exists once AI synthesis is wired
 * up (see premium-report.ts's `profiles`/`comparison`, currently always
 * null) — deliberately left out of this data shape rather than faked, and
 * shown as "not reported" in the UI layer per the evidence-integrity rules.
 */
export interface EvidencePassportData {
  confidenceLabel: ConfidenceLabel;
  studyTypeDistribution: Array<{ type: PublicationType; count: number }>;
  analysisBasisDistribution: Array<{ level: DataCompleteness; count: number }>;
  sourcesSearchedCount: number;
  sourcesTotalCount: number;
  publicationYearRange: { earliest: number | null; latest: number | null };
  correctedStudyCount: number;
  includedCount: number;
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

function analysisBasisDistribution(
  records: NormalizedRecord[],
): Array<{ level: DataCompleteness; count: number }> {
  const counts = new Map<DataCompleteness, number>();
  for (const record of records) {
    counts.set(record.dataCompleteness, (counts.get(record.dataCompleteness) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([level, count]) => ({ level, count }))
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

export function buildEvidencePassport(
  searchResult: SearchRunResult,
  assessment: EligibilityAssessment,
): EvidencePassportData {
  const includedRecords = searchResult.rankedIncluded.map((scored) => scored.deduped.record);

  return {
    confidenceLabel: deriveConfidenceLabel(assessment),
    studyTypeDistribution: studyTypeDistribution(includedRecords),
    analysisBasisDistribution: analysisBasisDistribution(includedRecords),
    sourcesSearchedCount: searchResult.perSource.filter((status) => status.ok).length,
    sourcesTotalCount: searchResult.perSource.length,
    publicationYearRange: publicationYearRange(includedRecords),
    // Retracted studies are already excluded during screening (screening.ts)
    // — among *included* records, "corrected" is the only integrity signal
    // left to surface (retractionStatus "unknown" just means the source
    // didn't report it, not a red flag, so it isn't counted here).
    correctedStudyCount: includedRecords.filter((r) => r.retractionStatus === "corrected").length,
    includedCount: includedRecords.length,
  };
}
