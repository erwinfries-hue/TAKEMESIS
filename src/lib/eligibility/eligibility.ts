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
export function estimateReportDepth(records: NormalizedRecord[]): number {
  const resultBearingCount = records.filter(isResultBearing).length;
  const includedCount = records.length;

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

export interface EligibilityAssessment {
  status: EligibilityStatus;
  includedCount: number;
  resultBearingCount: number;
  reviewOrMetaCount: number;
  estimatedReportDepthSections: number;
}

const MIN_REPORT_DEPTH_SECTIONS = 3;

/** Decision #4 (DECISIONS_LOG.md) thresholds, implemented as named constants — not magic numbers, and tunable post-beta from real conversion/refund data. */
export const ELIGIBLE_MIN_RESULT_BEARING_STUDIES = 5;
export const ELIGIBLE_MIN_INDIVIDUAL_STUDIES_WITH_REVIEW = 2;
export const LIMITATIONS_MIN_RESULT_BEARING_STUDIES = 2;
export const LIMITATIONS_MIN_INCLUDED_STUDIES = 2;

export function assessEligibility(searchResult: SearchRunResult): EligibilityAssessment {
  const included = searchResult.rankedIncluded.map((scored) => scored.deduped.record);
  const resultBearing = included.filter(isResultBearing);
  const reviewsOrMeta = included.filter((r) => REVIEW_TYPES.has(r.publicationType));
  const individualResultBearing = resultBearing.filter((r) => !REVIEW_TYPES.has(r.publicationType));

  const meetsFullThreshold =
    resultBearing.length >= ELIGIBLE_MIN_RESULT_BEARING_STUDIES ||
    (reviewsOrMeta.length >= 1 &&
      individualResultBearing.length >= ELIGIBLE_MIN_INDIVIDUAL_STUDIES_WITH_REVIEW);

  let status: EligibilityStatus;
  if (meetsFullThreshold) {
    status = "eligible";
  } else if (
    resultBearing.length >= LIMITATIONS_MIN_RESULT_BEARING_STUDIES ||
    included.length >= LIMITATIONS_MIN_INCLUDED_STUDIES
  ) {
    status = "eligible_with_limitations";
  } else {
    status = "not_eligible";
  }

  const estimatedReportDepthSections = estimateReportDepth(included);
  if (estimatedReportDepthSections < MIN_REPORT_DEPTH_SECTIONS) {
    status = "not_eligible";
  }

  return {
    status,
    includedCount: included.length,
    resultBearingCount: resultBearing.length,
    reviewOrMetaCount: reviewsOrMeta.length,
    estimatedReportDepthSections,
  };
}
