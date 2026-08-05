import { describe, expect, it } from "vitest";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";
import { NO_FILTERS } from "@/lib/search/filters";
import { makeRecord } from "@/lib/search/test-fixtures";
import { assessEligibility } from "./eligibility";
import { buildEvidencePassport } from "./evidence-passport";

function fakeSearchResult(
  records: NormalizedRecord[],
  perSource: SearchRunResult["perSource"] = [],
): SearchRunResult {
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
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
    filtersApplied: NO_FILTERS,
    excludedByFilterCount: 0,
    perSource,
    rankedIncluded: scored,
    detailed: scored,
  };
}

describe("buildEvidencePassport", () => {
  it("summarizes study-type distribution across included records", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "rct" }),
      makeRecord({ dataCompleteness: "abstract", publicationType: "cohort" }),
    ];
    const result = fakeSearchResult(records);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.studyTypeDistribution).toEqual([
      { type: "rct", count: 2 },
      { type: "cohort", count: 1 },
    ]);
  });

  it("summarizes data-completeness (analysis basis) across included records", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract" }),
      makeRecord({ dataCompleteness: "abstract" }),
      makeRecord({ dataCompleteness: "metadata_only" }),
    ];
    const result = fakeSearchResult(records);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.analysisBasisDistribution).toEqual([
      { level: "abstract", count: 2 },
      { level: "metadata_only", count: 1 },
    ]);
  });

  it("counts searched vs. total sources from perSource status", () => {
    const result = fakeSearchResult([makeRecord()], [
      { source: "ncbi_pubmed", ok: false, recordCount: 0, error: "timeout" },
      { source: "openalex", ok: true, recordCount: 1 },
      { source: "crossref", ok: true, recordCount: 1 },
    ]);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.sourcesSearchedCount).toBe(2);
    expect(passport.sourcesTotalCount).toBe(3);
  });

  it("computes the earliest/latest publication year across included records", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", year: 2019 }),
      makeRecord({ dataCompleteness: "abstract", year: 2023 }),
      makeRecord({ dataCompleteness: "abstract", year: null }),
    ];
    const result = fakeSearchResult(records);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.publicationYearRange).toEqual({ earliest: 2019, latest: 2023 });
  });

  it("returns a null year range when no included record has a year", () => {
    const result = fakeSearchResult([]);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.publicationYearRange).toEqual({ earliest: null, latest: null });
  });

  it("counts corrected studies among included records, ignoring 'unknown' as a non-signal", () => {
    const records = [
      makeRecord({ dataCompleteness: "abstract", retractionStatus: "corrected" }),
      makeRecord({ dataCompleteness: "abstract", retractionStatus: "none" }),
      makeRecord({ dataCompleteness: "abstract", retractionStatus: "unknown" }),
    ];
    const result = fakeSearchResult(records);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.correctedStudyCount).toBe(1);
    expect(passport.includedCount).toBe(3);
  });

  it("reuses deriveConfidenceLabel for the confidence dimension", () => {
    const result = fakeSearchResult([]);
    const passport = buildEvidencePassport(result, assessEligibility(result));
    expect(passport.confidenceLabel).toBe("not_assessed");
  });
});
