import { describe, expect, it, vi } from "vitest";
import { makeRecord } from "@/lib/search/test-fixtures";
import { buildPremiumReportData } from "@/lib/reports/premium-report";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import type { SearchRunResult } from "@/lib/search/run-search";
import { NO_FILTERS } from "@/lib/search/filters";
import { enrichPremiumReportWithAi } from "./report-enrichment";

function fakeSearchResult() {
  const record = makeRecord({ title: "A Trial", abstract: "An abstract." });
  const scored = [{ deduped: { record, mergedFromSources: [record.source] }, score: 0 }];
  const result: SearchRunResult = {
    query: "Does X help with Y?",
    topicSlug: "lernen-bildung",
    searchDate: "2026-07-25T12:00:00.000Z",
    screeningVersion: "screening-v2",
    candidateCount: 1,
    duplicatesRemoved: 0,
    includedCount: 1,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
    filtersApplied: NO_FILTERS,
    excludedByFilterCount: 0,
    perSource: [{ source: "openalex", ok: true, recordCount: 1 }],
    rankedIncluded: scored,
    detailed: scored,
  };
  return { result, record };
}

describe("enrichPremiumReportWithAi (AI_EXTRACTION_ENABLED unset — real serverEnv)", () => {
  it("returns the report unchanged when AI is not configured, without calling any AI function", async () => {
    const { result, record } = fakeSearchResult();
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });

    const extractStudyFields = vi.fn();
    const synthesizeReport = vi.fn();

    const enriched = await enrichPremiumReportWithAi(
      { report, detailedRecords: [record] },
      { extractStudyFields, synthesizeReport },
    );

    expect(enriched).toEqual(report);
    expect(extractStudyFields).not.toHaveBeenCalled();
    expect(synthesizeReport).not.toHaveBeenCalled();
  });
});
