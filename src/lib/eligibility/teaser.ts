import type { SearchRunResult } from "@/lib/search/run-search";
import type { SearchFilters } from "@/lib/search/filters";
import type { PublicationType, SourceId } from "@/lib/source-adapters/types";
import type { EligibilityAssessment } from "./eligibility";

/**
 * Approved confidence labels (08_EVIDENCE_SAFETY_AND_CONFIDENCE_MODEL.md).
 * Derived structurally here (study counts/types only) — this is explicitly
 * NOT the full AI-assessed confidence model from `08` (which also weighs
 * consistency, directness, precision, risk indicators from actual content
 * analysis). Labeled as preliminary in the UI for exactly that reason.
 */
export type ConfidenceLabel = "higher" | "moderate" | "limited" | "very_uncertain" | "not_assessed";

export interface StudyTypeCount {
  type: PublicationType;
  count: number;
}

export interface TeaserStudySummary {
  title: string | null;
  year: number | null;
  publicationType: PublicationType;
  sourceUrl: string | null;
  venue: string | null;
}

export interface TeaserData {
  query: string;
  searchDate: string;
  candidateCount: number;
  duplicatesRemoved: number;
  includedCount: number;
  studyTypeDistribution: StudyTypeCount[];
  topStudies: TeaserStudySummary[];
  confidenceLabel: ConfidenceLabel;
  sourcesUnavailable: SourceId[];
  filtersApplied: SearchFilters;
  excludedByFilterCount: number;
}

export function deriveConfidenceLabel(assessment: EligibilityAssessment): ConfidenceLabel {
  if (assessment.status === "not_eligible") {
    return "not_assessed";
  }
  if (assessment.status === "eligible_with_limitations") {
    return "limited";
  }
  // status === "eligible"
  if (assessment.reviewOrMetaCount >= 1 && assessment.resultBearingCount >= 8) {
    return "higher";
  }
  return "moderate";
}

const TOP_STUDIES_PREVIEW_COUNT = 3;

export function buildTeaserData(
  searchResult: SearchRunResult,
  assessment: EligibilityAssessment,
): TeaserData {
  const includedRecords = searchResult.rankedIncluded.map((scored) => scored.deduped.record);

  const distribution = new Map<PublicationType, number>();
  for (const record of includedRecords) {
    distribution.set(record.publicationType, (distribution.get(record.publicationType) ?? 0) + 1);
  }
  const studyTypeDistribution = Array.from(distribution.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const topStudies: TeaserStudySummary[] = searchResult.detailed
    .slice(0, TOP_STUDIES_PREVIEW_COUNT)
    .map((scored) => ({
      title: scored.deduped.record.title,
      year: scored.deduped.record.year,
      publicationType: scored.deduped.record.publicationType,
      sourceUrl: scored.deduped.record.sourceUrl,
      venue: scored.deduped.record.venue,
    }));

  const sourcesUnavailable = searchResult.perSource
    .filter((status) => !status.ok)
    .map((status) => status.source);

  return {
    query: searchResult.query,
    searchDate: searchResult.searchDate,
    candidateCount: searchResult.candidateCount,
    duplicatesRemoved: searchResult.duplicatesRemoved,
    includedCount: searchResult.includedCount,
    studyTypeDistribution,
    topStudies,
    confidenceLabel: deriveConfidenceLabel(assessment),
    sourcesUnavailable,
    filtersApplied: searchResult.filtersApplied,
    excludedByFilterCount: searchResult.excludedByFilterCount,
  };
}
