import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    ANTHROPIC_API_KEY: "test-key",
    AI_EXTRACTION_ENABLED: true,
    AI_MODEL: "test-model",
    AI_MAX_INPUT_CHARS: 24000,
  },
}));

import { makeRecord } from "@/lib/search/test-fixtures";
import { buildPremiumReportData } from "@/lib/reports/premium-report";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import type { SearchRunResult } from "@/lib/search/run-search";
import { NO_FILTERS } from "@/lib/search/filters";
import type { ExtractedStudyFields } from "./study-extraction";
import type { ReportSynthesisResult } from "./report-synthesis";
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

const FIELDS: ExtractedStudyFields = {
  population: "Adults",
  intervention: "X",
  outcome: "Y",
  result: "Increase in Y",
  uncertainty: null,
  limitations: "Small sample",
  fundingConflicts: null,
};

const SYNTHESIS: ReportSynthesisResult = {
  keyFindings: ["X modestly increases Y."],
  synthesis: "The one included study shows a small positive effect.",
  practicalInterpretation: "General orientation only, not individualized advice.",
};

describe("enrichPremiumReportWithAi (AI_EXTRACTION_ENABLED=true, mocked env)", () => {
  it("populates profiles, comparison, key findings, and synthesis text from the injected AI functions", async () => {
    const { result, record } = fakeSearchResult();
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });

    const extractStudyFields = vi.fn().mockResolvedValue(FIELDS);
    const synthesizeReport = vi.fn().mockResolvedValue(SYNTHESIS);

    const enriched = await enrichPremiumReportWithAi(
      { report, detailedRecords: [record] },
      { extractStudyFields, synthesizeReport },
    );

    expect(enriched.profiles[0]).toMatchObject(FIELDS);
    expect(enriched.comparison[0].outcome).toBe(FIELDS.outcome);
    expect(enriched.comparison[0].keyFinding).toBe(FIELDS.result);
    expect(enriched.comparison[0].limitations).toBe(FIELDS.limitations);
    expect(enriched.keyFindings).toEqual(SYNTHESIS.keyFindings);
    expect(enriched.synthesisAvailable).toBe(true);
    expect(enriched.synthesisText).toBe(SYNTHESIS.synthesis);
    expect(enriched.practicalInterpretationAvailable).toBe(true);
    expect(enriched.practicalInterpretationText).toBe(SYNTHESIS.practicalInterpretation);
  });

  it("falls back to the unchanged report if the AI call throws — never crashes, never fabricates", async () => {
    const { result, record } = fakeSearchResult();
    const report = buildPremiumReportData({
      searchResult: result,
      eligibility: assessEligibility(result),
      locale: "de",
    });

    const extractStudyFields = vi.fn().mockRejectedValue(new Error("AI is down"));
    const synthesizeReport = vi.fn();

    const enriched = await enrichPremiumReportWithAi(
      { report, detailedRecords: [record] },
      { extractStudyFields, synthesizeReport },
    );

    expect(enriched).toEqual(report);
    expect(enriched.keyFindings).toBeNull();
    expect(enriched.synthesisAvailable).toBe(false);
  });
});
