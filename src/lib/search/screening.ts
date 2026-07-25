import type { DedupedRecord } from "./dedupe";

/**
 * Exclusion reasons we can honestly compute from adapter metadata alone.
 * docs/07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md lists more reasons
 * (wrong topic, wrong population/context, non-comparable intervention,
 * unsupported language/content) — those require semantic content
 * understanding (AI-based, not yet built; see OPEN_RISKS.md) and are
 * deliberately not faked here. "duplicate" is tracked separately by the
 * dedupe step's `duplicatesRemoved` count, not as a per-record exclusion
 * reason here.
 */
export type ExclusionReason = "retracted" | "protocol_only" | "insufficient_detail";

export interface ScreeningDecision {
  record: DedupedRecord;
  reason: ExclusionReason;
}

export interface ScreeningResult {
  included: DedupedRecord[];
  excluded: ScreeningDecision[];
}

/** Bump when the screening rules change, so a stored search run can record which version produced it. */
export const SCREENING_VERSION = "screening-v1";

export function screenRecords(records: DedupedRecord[]): ScreeningResult {
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

    included.push(deduped);
  }

  return { included, excluded };
}
