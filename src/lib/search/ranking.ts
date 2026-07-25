import type { PublicationType } from "@/lib/source-adapters/types";
import type { DedupedRecord } from "./dedupe";
import { computeRelevanceScore } from "./relevance";

/**
 * Study-design weight, roughly following the evidence hierarchy. Protocols
 * are weighted 0 defensively — they're excluded during screening before
 * ranking normally runs, but ranking must never accidentally promote one.
 */
const PUBLICATION_TYPE_WEIGHT: Record<PublicationType, number> = {
  meta_analysis: 5,
  systematic_review: 4.5,
  rct: 4,
  quasi_experimental: 3,
  cohort: 3,
  case_control: 2.5,
  cross_sectional: 2.5,
  review: 2,
  case_report: 1,
  other: 1,
  unknown: 1,
  protocol: 0,
};

export function publicationTypeWeight(type: PublicationType): number {
  return PUBLICATION_TYPE_WEIGHT[type];
}

/** 1.0 for current-year-or-newer, fading linearly to 0 at 20+ years old. Deliberately a small, capped signal — see "Do not rank solely by recency" in 07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md. */
export function computeRecencyScore(
  year: number | null,
  referenceYear: number = new Date().getFullYear(),
): number {
  if (year === null) {
    return 0;
  }
  const age = referenceYear - year;
  if (age <= 0) {
    return 1;
  }
  if (age >= 20) {
    return 0;
  }
  return 1 - age / 20;
}

export interface ScoredRecord {
  deduped: DedupedRecord;
  score: number;
}

export interface RankingWeights {
  relevance: number;
  publicationType: number;
  completenessBonus: number;
  recency: number;
  correctionPenalty: number;
}

/**
 * Relevance and study design dominate the score (max ~10 and 5); data
 * completeness and recency are minor tie-breakers (max ~1 each) — the
 * weight spread itself is what keeps this from ranking "solely by recency".
 */
export const DEFAULT_WEIGHTS: RankingWeights = {
  relevance: 10,
  publicationType: 1,
  completenessBonus: 1,
  recency: 1,
  correctionPenalty: 0.5,
};

export function scoreRecord(
  deduped: DedupedRecord,
  query: string,
  options: { referenceYear?: number; weights?: RankingWeights } = {},
): number {
  const weights = options.weights ?? DEFAULT_WEIGHTS;
  const { record } = deduped;

  const relevance = computeRelevanceScore(query, record) * weights.relevance;
  const typeWeight = publicationTypeWeight(record.publicationType) * weights.publicationType;
  const completenessBonus =
    record.dataCompleteness === "full_text"
      ? weights.completenessBonus * 1.5
      : record.dataCompleteness === "abstract"
        ? weights.completenessBonus
        : 0;
  const recency = computeRecencyScore(record.year, options.referenceYear) * weights.recency;
  const correctionPenalty = record.retractionStatus === "corrected" ? weights.correctionPenalty : 0;

  return relevance + typeWeight + completenessBonus + recency - correctionPenalty;
}

/** Ranks records highest-score-first. Does not truncate — callers apply the detailed-results cap (decision #8: 15) separately, since the full ranked list still belongs in the source appendix. */
export function rankRecords(
  records: DedupedRecord[],
  query: string,
  options: { referenceYear?: number; weights?: RankingWeights } = {},
): ScoredRecord[] {
  return records
    .map((deduped) => ({ deduped, score: scoreRecord(deduped, query, options) }))
    .sort((a, b) => b.score - a.score);
}
