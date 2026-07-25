import { describe, expect, it } from "vitest";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";
import { makeRecord } from "@/lib/search/test-fixtures";
import { assessEligibility, estimateReportDepth } from "./eligibility";

function fakeSearchResult(records: NormalizedRecord[]): SearchRunResult {
  return {
    query: "test question",
    topicSlug: "lernen-bildung",
    searchDate: new Date().toISOString(),
    screeningVersion: "screening-v1",
    candidateCount: records.length,
    duplicatesRemoved: 0,
    includedCount: records.length,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0 },
    perSource: [],
    rankedIncluded: records.map((record) => ({
      deduped: { record, mergedFromSources: [record.source] },
      score: 0,
    })),
    detailed: [],
  };
}

describe("estimateReportDepth", () => {
  it("returns the 3 always-fillable sections for zero studies", () => {
    expect(estimateReportDepth([])).toBe(3);
  });

  it("increases as result-bearing studies accumulate, capping at 9", () => {
    const oneAbstract = [makeRecord({ dataCompleteness: "abstract" })];
    const twoAbstracts = [
      makeRecord({ dataCompleteness: "abstract" }),
      makeRecord({ dataCompleteness: "abstract" }),
    ];
    expect(estimateReportDepth(oneAbstract)).toBeGreaterThan(estimateReportDepth([]));
    expect(estimateReportDepth(twoAbstracts)).toBe(9);
  });
});

describe("assessEligibility", () => {
  it("is eligible with 5+ result-bearing studies", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
    );
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.status).toBe("eligible");
  });

  it("is eligible with 1 review/meta-analysis plus 2 individual result-bearing studies", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "systematic_review" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "cohort" }),
    ];
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.status).toBe("eligible");
  });

  it("is NOT eligible via the review path with only 1 individual study alongside the review", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "systematic_review" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
    ];
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.status).not.toBe("eligible");
  });

  it("is eligible_with_limitations with 2-4 result-bearing studies", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract" }),
      makeRecord({ dataCompleteness: "abstract" }),
    ];
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.status).toBe("eligible_with_limitations");
  });

  it("is eligible_with_limitations when enough studies exist but are mostly metadata-only", () => {
    const records = [
      makeRecord({ dataCompleteness: "metadata_only" }),
      makeRecord({ dataCompleteness: "metadata_only" }),
      makeRecord({ dataCompleteness: "metadata_only" }),
    ];
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.status).toBe("eligible_with_limitations");
  });

  it("is not_eligible with fewer than 2 studies total", () => {
    expect(assessEligibility(fakeSearchResult([])).status).toBe("not_eligible");
    expect(
      assessEligibility(fakeSearchResult([makeRecord({ dataCompleteness: "abstract" })])).status,
    ).toBe("not_eligible");
  });

  it("reports the underlying counts alongside the status", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "meta_analysis" }),
      makeRecord({ dataCompleteness: "abstract" }),
      makeRecord({ dataCompleteness: "metadata_only" }),
    ];
    const result = assessEligibility(fakeSearchResult(records));
    expect(result.includedCount).toBe(3);
    expect(result.resultBearingCount).toBe(2);
    expect(result.reviewOrMetaCount).toBe(1);
  });
});
