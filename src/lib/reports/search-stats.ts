import type { SearchRunResult, PerSourceResult } from "@/lib/search/run-search";
import type { ExclusionReason } from "@/lib/search/screening";
import type { SourceId } from "@/lib/source-adapters/types";

/**
 * A lightweight, admin-facing summary of a search run — scalar counts and
 * per-source status only, never the full record list (that lives in
 * TeaserData/PremiumReportData, which already carry everything needed to
 * render the actual report). Kept separate so `reports.search_stats` stays
 * small and readable in the admin dashboard rather than duplicating the
 * full payloads.
 */
export interface SearchStatsSummary {
  query: string;
  searchDate: string;
  screeningVersion: string;
  candidateCount: number;
  duplicatesRemoved: number;
  includedCount: number;
  excludedByReason: Record<ExclusionReason, number>;
  perSource: Array<{ source: SourceId; ok: boolean; error: string | null }>;
}

export function buildSearchStatsSummary(result: SearchRunResult): SearchStatsSummary {
  return {
    query: result.query,
    searchDate: result.searchDate,
    screeningVersion: result.screeningVersion,
    candidateCount: result.candidateCount,
    duplicatesRemoved: result.duplicatesRemoved,
    includedCount: result.includedCount,
    excludedByReason: result.excludedByReason,
    perSource: result.perSource.map((entry: PerSourceResult) => ({
      source: entry.source,
      ok: entry.ok,
      error: entry.error ?? null,
    })),
  };
}
