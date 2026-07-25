import { describe, expect, it } from "vitest";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";
import { makeRecord } from "@/lib/search/test-fixtures";
import { assessEligibility } from "./eligibility";
import { buildTeaserData, deriveConfidenceLabel } from "./teaser";

function fakeSearchResult(records: NormalizedRecord[], perSource: SearchRunResult["perSource"] = []): SearchRunResult {
  const scored = records.map((record) => ({
    deduped: { record, mergedFromSources: [record.source] },
    score: 0,
  }));
  return {
    query: "welche lernmethode verbessert den lernerfolg",
    topicSlug: "lernen-bildung",
    searchDate: "2026-07-25T12:00:00.000Z",
    screeningVersion: "screening-v1",
    candidateCount: records.length + 2,
    duplicatesRemoved: 2,
    includedCount: records.length,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0 },
    perSource,
    rankedIncluded: scored,
    detailed: scored,
  };
}

describe("deriveConfidenceLabel", () => {
  it("is not_assessed when not eligible", () => {
    const result = fakeSearchResult([]);
    expect(deriveConfidenceLabel(assessEligibility(result))).toBe("not_assessed");
  });

  it("is limited when eligible_with_limitations", () => {
    const records = [makeRecord({ dataCompleteness: "abstract" }), makeRecord({ dataCompleteness: "abstract" })];
    const result = fakeSearchResult(records);
    expect(deriveConfidenceLabel(assessEligibility(result))).toBe("limited");
  });

  it("is higher only with a review/meta-analysis and a strong study count", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "meta_analysis" }),
      ...Array.from({ length: 8 }, () => makeRecord({ dataCompleteness: "abstract", publicationType: "rct" })),
    ];
    const result = fakeSearchResult(records);
    expect(deriveConfidenceLabel(assessEligibility(result))).toBe("higher");
  });

  it("is moderate when eligible but without a strong review-backed count", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }));
    const result = fakeSearchResult(records);
    expect(deriveConfidenceLabel(assessEligibility(result))).toBe("moderate");
  });
});

describe("buildTeaserData", () => {
  it("summarizes study-type distribution across included records", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "cohort" }),
    ];
    const teaser = buildTeaserData(fakeSearchResult(records), assessEligibility(fakeSearchResult(records)));
    expect(teaser.studyTypeDistribution).toEqual([
      { type: "rct", count: 2 },
      { type: "cohort", count: 1 },
    ]);
  });

  it("carries through candidate/duplicate/included counts and search metadata", () => {
    const records = [makeRecord()];
    const result = fakeSearchResult(records);
    const teaser = buildTeaserData(result, assessEligibility(result));
    expect(teaser.query).toBe(result.query);
    expect(teaser.searchDate).toBe(result.searchDate);
    expect(teaser.candidateCount).toBe(result.candidateCount);
    expect(teaser.duplicatesRemoved).toBe(2);
    expect(teaser.includedCount).toBe(1);
  });

  it("lists which sources were unavailable", () => {
    const result = fakeSearchResult([makeRecord()], [
      { source: "ncbi_pubmed", ok: false, recordCount: 0, error: "timeout" },
      { source: "openalex", ok: true, recordCount: 1 },
    ]);
    const teaser = buildTeaserData(result, assessEligibility(result));
    expect(teaser.sourcesUnavailable).toEqual(["ncbi_pubmed"]);
  });

  it("previews only the top 3 studies even when more are detailed", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ dataCompleteness: "abstract" }));
    const result = fakeSearchResult(records);
    const teaser = buildTeaserData(result, assessEligibility(result));
    expect(teaser.topStudies).toHaveLength(3);
  });
});
