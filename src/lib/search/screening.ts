import type { DedupedRecord } from "./dedupe";
import { meetsRelevanceThreshold, MIN_RELEVANCE_SCORE } from "./relevance";

export { MIN_RELEVANCE_SCORE };

/**
 * Exclusion reasons we can honestly compute from adapter metadata alone.
 * docs/07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md lists more reasons
 * (wrong population/context, non-comparable intervention, unsupported
 * language/content) — those require deeper semantic content understanding
 * (AI-based, not yet built; see OPEN_RISKS.md) and are deliberately not
 * faked here. "not_relevant" (below) is the one exception: it's a real,
 * mechanically computable signal (term overlap with the question), not a
 * fabricated judgment — see MIN_RELEVANCE_SCORE. "duplicate" is tracked
 * separately by the dedupe step's `duplicatesRemoved` count, not as a
 * per-record exclusion reason here.
 */
export type ExclusionReason =
  | "retracted"
  | "protocol_only"
  | "insufficient_detail"
  | "not_relevant";

export interface ScreeningDecision {
  record: DedupedRecord;
  reason: ExclusionReason;
}

export interface ScreeningResult {
  included: DedupedRecord[];
  excluded: ScreeningDecision[];
}

/** Bump when the screening rules change, so a stored search run can record which version produced it. */
export const SCREENING_VERSION = "screening-v2";

export function screenRecords(records: DedupedRecord[], query: string): ScreeningResult {
  const included: DedupedRecord[] = [];
  const excluded: ScreeningDecision[] = [];

  for (const deduped of records) {
    const { record } = deduped;

    if (record.retractionStatus === "retracted") {
      excluded.push({ record: deduped, reason: "retracted" });
      continue;
    }
    if (record.publicationType === "protocol") {
      excluded.push({ record: deduped, reason: "protocol_only" });
      continue;
    }
    if (!record.title || record.title.trim().length === 0) {
      excluded.push({ record: deduped, reason: "insufficient_detail" });
      continue;
    }
    if (!meetsRelevanceThreshold(query, record)) {
      excluded.push({ record: deduped, reason: "not_relevant" });
      continue;
    }

    included.push(deduped);
  }

  return { included, excluded };
}
