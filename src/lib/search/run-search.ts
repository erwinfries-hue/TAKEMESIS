import "server-only";
import { adaptersForTopic } from "@/lib/source-adapters/registry";
import type { NormalizedRecord, SourceAdapter, SourceId } from "@/lib/source-adapters/types";
import { dedupeRecords } from "./dedupe";
import { screenRecords, SCREENING_VERSION, type ExclusionReason } from "./screening";
import { rankRecords, type ScoredRecord } from "./ranking";
import { applyFilters, NO_FILTERS, type SearchFilters } from "./filters";

/** Decision #8: max 15 studies in the detailed comparison/profile sections. */
export const DETAILED_RESULTS_CAP = 15;

export interface PerSourceResult {
  source: SourceId;
  ok: boolean;
  recordCount: number;
  error?: string;
}

export interface SearchRunResult {
  query: string;
  topicSlug: string;
  searchDate: string;
  screeningVersion: string;
  candidateCount: number;
  duplicatesRemoved: number;
  includedCount: number;
  excludedByReason: Record<ExclusionReason, number>;
  /** The user-chosen scope restrictions this run was executed with (NO_FILTERS if none). */
  filtersApplied: SearchFilters;
  /** How many otherwise-included studies were narrowed out by filtersApplied — distinct from excludedByReason (evidence-quality) and duplicatesRemoved. */
  excludedByFilterCount: number;
  perSource: PerSourceResult[];
  /** Every included, ranked record — this is what the source appendix must list in full (decision #8). */
  rankedIncluded: ScoredRecord[];
  /** Top DETAILED_RESULTS_CAP of rankedIncluded — what gets a full comparison/profile. */
  detailed: ScoredRecord[];
}

const EMPTY_EXCLUSION_COUNTS: Record<ExclusionReason, number> = {
  retracted: 0,
  protocol_only: 0,
  insufficient_detail: 0,
  not_relevant: 0,
};

/**
 * Core orchestration logic, parameterized over an explicit adapter list so
 * it's testable without real network access or fetch mocking (tests pass
 * fake SourceAdapter implementations directly). `runSearch` below is the
 * entry point real app code uses, which looks up the real routed adapters.
 */
export async function runSearchWithAdapters(
  question: string,
  topicSlug: string,
  adapters: SourceAdapter[],
  filters: SearchFilters = NO_FILTERS,
): Promise<SearchRunResult> {
  const searchDate = new Date().toISOString();
  const perSource: PerSourceResult[] = [];
  const allRecords: NormalizedRecord[] = [];

  // Each source's failure is isolated — one adapter being down must not
  // prevent results from the others (docs/10, "Resilience").
  await Promise.all(
    adapters.map(async (adapter) => {
      try {
        const records = await adapter.search({ query: question, limit: DETAILED_RESULTS_CAP });
        allRecords.push(...records);
        perSource.push({ source: adapter.capabilities.id, ok: true, recordCount: records.length });
      } catch (error) {
        perSource.push({
          source: adapter.capabilities.id,
          ok: false,
          recordCount: 0,
          error: error instanceof Error ? error.message : "unknown error",
        });
      }
    }),
  );

  const candidateCount = allRecords.length;
  const { records: deduped, duplicatesRemoved } = dedupeRecords(allRecords);
  const { included, excluded } = screenRecords(deduped, question);

  const excludedByReason: Record<ExclusionReason, number> = { ...EMPTY_EXCLUSION_COUNTS };
  for (const decision of excluded) {
    excludedByReason[decision.reason] += 1;
  }

  const { records: filteredIncluded, excludedByFilterCount } = applyFilters(included, filters);

  const rankedIncluded = rankRecords(filteredIncluded, question);
  const detailed = rankedIncluded.slice(0, DETAILED_RESULTS_CAP);

  return {
    query: question,
    topicSlug,
    searchDate,
    screeningVersion: SCREENING_VERSION,
    candidateCount,
    duplicatesRemoved,
    includedCount: filteredIncluded.length,
    excludedByReason,
    filtersApplied: filters,
    excludedByFilterCount,
    perSource,
    rankedIncluded,
    detailed,
  };
}

export async function runSearch(
  question: string,
  topicSlug: string,
  filters: SearchFilters = NO_FILTERS,
): Promise<SearchRunResult> {
  return runSearchWithAdapters(question, topicSlug, adaptersForTopic(topicSlug), filters);
}
