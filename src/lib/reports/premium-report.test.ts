import { describe, expect, it } from "vitest";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import type { SearchRunResult } from "@/lib/search/run-search";
import { NO_FILTERS } from "@/lib/search/filters";
import { makeRecord } from "@/lib/search/test-fixtures";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildPremiumReportData, PREMIUM_REPORT_VERSION } from "./premium-report";

function fakeSearchResult(records: NormalizedRecord[]): SearchRunResult {
  const scored = records.map((record) => ({
    deduped: { record, mergedFromSources: [record.source] },
    score: 0,
  }));
  return {
    query: "Welche Lernmethode verbessert den Lernerfolg?",
    topicSlug: "lernen-bildung",
    searchDate: "2026-07-25T12:00:00.000Z",
    screeningVersion: "screening-v1",
    candidateCount: records.length + 3,
    duplicatesRemoved: 3,
    includedCount: records.length,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
    filtersApplied: NO_FILTERS,
    excludedByFilterCount: 0,
    perSource: [
      { source: "openalex", ok: true, recordCount: records.length },
      { source: "crossref", ok: false, recordCount: 0, error: "timeout" },
    ],
    rankedIncluded: scored,
    detailed: scored,
  };
}

function baselineRecords(): NormalizedRecord[] {
  return [
    makeRecord({
      title: "Retrieval Practice Produces More Learning",
      authors: ["Jeffrey D. Karpicke", "Janell R. Blunt"],
      year: 2011,
      venue: "Science",
      publicationType: "rct",
      dataCompleteness: "abstract",
      doi: "10.1000/fixture.001",
      sourceUrl: "https://example.org/fixture-1",
    }),
    makeRecord({
      title: "A Systematic Review of Spaced Repetition",
      authors: [],
      year: 2016,
      venue: null,
      publicationType: "systematic_review",
      dataCompleteness: "metadata_only",
      doi: null,
      sourceUrl: null,
    }),
  ];
}

describe("buildPremiumReportData", () => {
  it("never fabricates AI-dependent content — it stays null", () => {
    const records = baselineRecords();
    const result = fakeSearchResult(records);
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });

    expect(report.keyFindings).toBeNull();
    expect(report.interpretedQuestion).toBeNull();
    expect(report.synthesisAvailable).toBe(false);
    expect(report.synthesisText).toBeNull();
    expect(report.practicalInterpretationAvailable).toBe(false);
    expect(report.practicalInterpretationText).toBeNull();
    for (const row of report.comparison) {
      expect(row.outcome).toBeNull();
      expect(row.effectEstimate).toBeNull();
      expect(row.keyFinding).toBeNull();
      expect(row.limitations).toBeNull();
    }
    for (const profile of report.profiles) {
      expect(profile.population).toBeNull();
      expect(profile.intervention).toBeNull();
      expect(profile.outcome).toBeNull();
      expect(profile.result).toBeNull();
      expect(profile.uncertainty).toBeNull();
      expect(profile.limitations).toBeNull();
      expect(profile.fundingConflicts).toBeNull();
    }
  });

  it("builds a real citation string from authors/year/title/venue", () => {
    const records = baselineRecords();
    const report = buildPremiumReportData({
      searchResult: fakeSearchResult(records),
      eligibility: assessEligibility(fakeSearchResult(records)),
      locale: "de",
    });
    expect(report.comparison[0].citation).toBe(
      "Jeffrey D. Karpicke, Janell R. Blunt (2011). Retrieval Practice Produces More Learning. Science.",
    );
  });

  it("falls back to 'nicht angegeben' / 'not reported' for missing citation fields, per locale", () => {
    const records = [makeRecord({ title: null, authors: [], year: null, venue: null })];
    const reportDe = buildPremiumReportData({
      searchResult: fakeSearchResult(records),
      eligibility: assessEligibility(fakeSearchResult(records)),
      locale: "de",
    });
    expect(reportDe.comparison[0].citation).toContain("nicht angegeben");

    const reportEn = buildPremiumReportData({
      searchResult: fakeSearchResult(records),
      eligibility: assessEligibility(fakeSearchResult(records)),
      locale: "en",
    });
    expect(reportEn.comparison[0].citation).toContain("not reported");
  });

  it("carries through real search statistics and source availability", () => {
    const records = baselineRecords();
    const result = fakeSearchResult(records);
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });
    expect(report.candidateCount).toBe(result.candidateCount);
    expect(report.duplicatesRemoved).toBe(3);
    expect(report.includedCount).toBe(2);
    expect(report.sourcesSearched).toEqual(["openalex"]);
    expect(report.sourcesUnavailable).toEqual(["crossref"]);
  });

  it("computes study-type distribution and publication-year range from real data", () => {
    const records = baselineRecords();
    const report = buildPremiumReportData({
      searchResult: fakeSearchResult(records),
      eligibility: assessEligibility(fakeSearchResult(records)),
      locale: "de",
    });
    expect(report.studyTypeDistribution).toEqual([
      { type: "rct", count: 1 },
      { type: "systematic_review", count: 1 },
    ]);
    expect(report.publicationYearRange).toEqual({ earliest: 2011, latest: 2016 });
  });

  it("lists the full source appendix (not capped at the detailed-results limit)", () => {
    const records = Array.from({ length: 20 }, () => makeRecord({ dataCompleteness: "abstract" }));
    const scored = records.map((record) => ({
      deduped: { record, mergedFromSources: [record.source] },
      score: 0,
    }));
    const result: SearchRunResult = {
      ...fakeSearchResult([]),
      includedCount: 20,
      rankedIncluded: scored,
      detailed: scored.slice(0, 15),
    };
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });
    expect(report.sources).toHaveLength(20);
    expect(report.comparison).toHaveLength(15);
    expect(report.profiles).toHaveLength(15);
  });

  it("uses the default PREMIUM_REPORT_VERSION unless overridden", () => {
    const records = baselineRecords();
    const result = fakeSearchResult(records);
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });
    expect(report.reportVersion).toBe(PREMIUM_REPORT_VERSION);

    const overridden = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
      reportVersion: "custom-v2",
    });
    expect(overridden.reportVersion).toBe("custom-v2");
  });
});
