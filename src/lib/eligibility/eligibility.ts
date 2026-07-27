import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";

/**
 * "restricted_high_risk" is decided earlier in the flow (Phase 3's
 * independent high-risk detector, before any search runs) and is not
 * produced here — this engine only ever returns one of the other three.
 */
export type EligibilityStatus = "eligible" | "eligible_with_limitations" | "not_eligible";

const REVIEW_TYPES = new Set(["systematic_review", "meta_analysis"]);

function isResultBearing(record: NormalizedRecord): boolean {
  return record.dataCompleteness !== "metadata_only";
}

/**
 * Rough count of the 9 mandatory report sections (06_PREMIUM_REPORT_SPECIFICATION.md)
 * that could be filled with real, non-"not reported" content given what was
 * found. 3 sections (method description, evidence-confidence label, source
 * list) are always fillable from our own process, regardless of study count;
 * the rest depend on having enough — and rich enough — included studies.
 * This is a conservative backstop, not the primary eligibility signal: the
 * study-count thresholds below do most of the gating.
 */
/** Counts-only core so callers without full `NormalizedRecord[]` (e.g. the interactive methodology demo) can derive the exact same depth estimate rather than a parallel reimplementation. */
export function estimateReportDepthFromCounts(includedCount: number, resultBearingCount: number): number {
  const ALWAYS_FILLABLE = 3; // scope/method, evidence-confidence label, source appendix
  let depth = ALWAYS_FILLABLE;

  if (includedCount >= 1) depth += 1; // cover/executive summary
  if (includedCount >= 2) depth += 1; // evidence landscape
  if (resultBearingCount >= 1) depth += 1; // detailed study profiles
  if (resultBearingCount >= 1) depth += 1; // practical interpretation
  if (resultBearingCount >= 2) depth += 1; // study comparison
  if (resultBearingCount >= 2) depth += 1; // integrated synthesis

  return depth;
}

export function estimateReportDepth(records: NormalizedRecord[]): number {
  const resultBearingCount = records.filter(isResultBearing).length;
  const includedCount = records.length;
  return estimateReportDepthFromCounts(includedCount, resultBearingCount);
}

export interface EligibilityAssessment {
  status: EligibilityStatus;
  includedCount: number;
  resultBearingCount: number;
  reviewOrMetaCount: number;
  estimatedReportDepthSections: number;
}

export const MIN_REPORT_DEPTH_SECTIONS = 3;

/** Decision #4 (DECISIONS_LOG.md) thresholds, implemented as named constants — not magic numbers, and tunable post-beta from real conversion/refund data. */
export const ELIGIBLE_MIN_RESULT_BEARING_STUDIES = 5;
export const ELIGIBLE_MIN_INDIVIDUAL_STUDIES_WITH_REVIEW = 2;
export const LIMITATIONS_MIN_RESULT_BEARING_STUDIES = 2;
export const LIMITATIONS_MIN_INCLUDED_STUDIES = 2;

export interface EligibilityCounts {
  includedCount: number;
  resultBearingCount: number;
  reviewOrMetaCount: number;
  individualResultBearingCount: number;
}

/** The actual decision rule, factored out to plain counts — single source of truth for both the real pipeline (`assessEligibility` below) and the interactive methodology demo, so the demo can never drift from what a real search actually decides. */
export function deriveEligibilityStatus(counts: EligibilityCounts): EligibilityStatus {
  const meetsFullThreshold =
    counts.resultBearingCount >= ELIGIBLE_MIN_RESULT_BEARING_STUDIES ||
    (counts.reviewOrMetaCount >= 1 &&
      counts.individualResultBearingCount >= ELIGIBLE_MIN_INDIVIDUAL_STUDIES_WITH_REVIEW);

  let status: EligibilityStatus;
  if (meetsFullThreshold) {
    status = "eligible";
  } else if (
    counts.resultBearingCount >= LIMITATIONS_MIN_RESULT_BEARING_STUDIES ||
    counts.includedCount >= LIMITATIONS_MIN_INCLUDED_STUDIES
  ) {
    status = "eligible_with_limitations";
  } else {
    status = "not_eligible";
  }

  const estimatedReportDepthSections = estimateReportDepthFromCounts(
    counts.includedCount,
    counts.resultBearingCount,
  );
  if (estimatedReportDepthSections < MIN_REPORT_DEPTH_SECTIONS) {
    status = "not_eligible";
  }

  return status;
}

export function assessEligibility(searchResult: SearchRunResult): EligibilityAssessment {
  const included = searchResult.rankedIncluded.map((scored) => scored.deduped.record);
  const resultBearing = included.filter(isResultBearing);
  const reviewsOrMeta = included.filter((r) => REVIEW_TYPES.has(r.publicationType));
  const individualResultBearing = resultBearing.filter((r) => !REVIEW_TYPES.has(r.publicationType));

  const status = deriveEligibilityStatus({
    includedCount: included.length,
    resultBearingCount: resultBearing.length,
    reviewOrMetaCount: reviewsOrMeta.length,
    individualResultBearingCount: individualResultBearing.length,
  });

  return {
    status,
    includedCount: included.length,
    resultBearingCount: resultBearing.length,
    reviewOrMetaCount: reviewsOrMeta.length,
    estimatedReportDepthSections: estimateReportDepthFromCounts(included.length, resultBearing.length),
  };
}
