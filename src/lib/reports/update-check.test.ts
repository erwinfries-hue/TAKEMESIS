import { describe, expect, it } from "vitest";
import { canRunUpdateCheck, MIN_UPDATE_CHECK_INTERVAL_HOURS, runUpdateCheck } from "./update-check";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { makeRecord } from "@/lib/search/test-fixtures";
import type { SearchRunResult } from "@/lib/search/run-search";
import type { PremiumReportData, PremiumSourceEntry } from "./premium-report";
import type { Report } from "./types";

const FAKE_SEARCH_STATS = {
  query: "q",
  searchDate: new Date().toISOString(),
  screeningVersion: "screening-v2",
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
  perSource: [],
};

const FAKE_TEASER = {
  query: "q",
  searchDate: new Date().toISOString(),
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  studyTypeDistribution: [],
  topStudies: [],
  confidenceLabel: "moderate" as const,
  sourcesUnavailable: [],
  filtersApplied: { maxAgeYears: 10 as const, studyTypes: null, studyRegions: null },
  excludedByFilterCount: 0,
};

function makeSourceEntry(overrides: Partial<PremiumSourceEntry> = {}): PremiumSourceEntry {
  return {
    citation: "Fixture Author (2020). Fixture Study.",
    doi: "10.1/known",
    sourceUrl: "https://example.com/known",
    source: "openalex",
    authors: ["Fixture Author"],
    year: 2020,
    title: "Fixture Study",
    venue: "Fixture Journal",
    ...overrides,
  };
}

function makeFinalPayload(sources: PremiumSourceEntry[]): PremiumReportData {
  return {
    originalQuestion: "Frage",
    interpretedQuestion: null,
    locale: "de",
    reportVersion: "premium-v1",
    reportDate: new Date().toISOString(),
    searchDate: new Date().toISOString(),
    sourcesSearched: ["openalex"],
    sourcesUnavailable: [],
    candidateCount: 1,
    duplicatesRemoved: 0,
    includedCount: sources.length,
    studyTypeDistribution: [],
    publicationYearRange: { earliest: null, latest: null },
    confidenceLabel: "moderate",
    keyFindings: null,
    comparison: [],
    profiles: [],
    synthesisAvailable: false,
    synthesisText: null,
    practicalInterpretationAvailable: false,
    practicalInterpretationText: null,
    sources,
  };
}

async function setUpReadyReport(sources: PremiumSourceEntry[]): Promise<{
  repository: InMemoryReportRepository;
  report: Report;
}> {
  const repository = new InMemoryReportRepository();
  const created = await repository.create({
    tokenHash: "hash",
    originalQuestion: "Welchen Effekt hat Kreatin auf Muskelaufbau?",
    locale: "de",
    domainSlug: "fitness-leistungsfaehigkeit",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS,
    previewPayload: FAKE_TEASER,
  });
  await transitionReportStatus(repository, created.id, "preview_ready");
  await transitionReportStatus(repository, created.id, "checkout_started");
  await transitionReportStatus(repository, created.id, "paid", { email: "buyer@example.com" });
  await transitionReportStatus(repository, created.id, "processing");
  const report = await transitionReportStatus(repository, created.id, "ready", {
    finalPayload: makeFinalPayload(sources),
  });
  return { repository, report };
}

describe("canRunUpdateCheck", () => {
  it("is false for a report that isn't ready yet", () => {
    expect(canRunUpdateCheck({ status: "paid", email: "a@b.com", lastUpdateCheckAt: null })).toBe(
      false,
    );
  });

  it("is false without an email on file (the only channel without a mandatory account)", () => {
    expect(canRunUpdateCheck({ status: "ready", email: null, lastUpdateCheckAt: null })).toBe(false);
  });

  it("is true for a ready report with an email that was never checked before", () => {
    expect(canRunUpdateCheck({ status: "ready", email: "a@b.com", lastUpdateCheckAt: null })).toBe(
      true,
    );
  });

  it("is false when the interval hasn't elapsed since the last check", () => {
    const now = new Date("2026-08-03T12:00:00.000Z");
    const lastUpdateCheckAt = new Date(
      now.getTime() - (MIN_UPDATE_CHECK_INTERVAL_HOURS - 1) * 60 * 60 * 1000,
    ).toISOString();
    expect(
      canRunUpdateCheck({ status: "ready", email: "a@b.com", lastUpdateCheckAt }, now),
    ).toBe(false);
  });

  it("is true once the interval has fully elapsed", () => {
    const now = new Date("2026-08-03T12:00:00.000Z");
    const lastUpdateCheckAt = new Date(
      now.getTime() - MIN_UPDATE_CHECK_INTERVAL_HOURS * 60 * 60 * 1000,
    ).toISOString();
    expect(
      canRunUpdateCheck({ status: "ready", email: "a@b.com", lastUpdateCheckAt }, now),
    ).toBe(true);
  });
});

describe("runUpdateCheck", () => {
  it("throws when the report has no domainSlug (can't re-run its search)", async () => {
    const { report } = await setUpReadyReport([]);
    await expect(
      runUpdateCheck(
        { ...report, domainSlug: null },
        { runSearch: async () => makeSearchResult([]) },
      ),
    ).rejects.toThrow(/domainSlug/);
  });

  it("reports a study as new when its DOI isn't in the report's already-shown sources", async () => {
    const known = makeSourceEntry({ doi: "10.1/known", sourceUrl: null });
    const { report } = await setUpReadyReport([known]);
    const newRecord = makeRecord({ doi: "10.1/brand-new", title: "New Study" });

    const result = await runUpdateCheck(report, {
      runSearch: async () => makeSearchResult([newRecord]),
    });

    expect(result.newStudies).toHaveLength(1);
    expect(result.newStudies[0].title).toBe("New Study");
    expect(result.newStudies[0].doi).toBe("10.1/brand-new");
  });

  it("does not report a study whose DOI already appears in the report's sources", async () => {
    const known = makeSourceEntry({ doi: "10.1/known" });
    const { report } = await setUpReadyReport([known]);
    const sameRecord = makeRecord({ doi: "10.1/known" });

    const result = await runUpdateCheck(report, {
      runSearch: async () => makeSearchResult([sameRecord]),
    });

    expect(result.newStudies).toHaveLength(0);
  });

  it("falls back to sourceUrl when neither record has a DOI", async () => {
    const known = makeSourceEntry({ doi: null, sourceUrl: "https://example.com/known" });
    const { report } = await setUpReadyReport([known]);
    const sameUrlRecord = makeRecord({ doi: null, sourceUrl: "https://example.com/known" });
    const newUrlRecord = makeRecord({ doi: null, sourceUrl: "https://example.com/new", title: "New" });

    const result = await runUpdateCheck(report, {
      runSearch: async () => makeSearchResult([sameUrlRecord, newUrlRecord]),
    });

    expect(result.newStudies).toHaveLength(1);
    expect(result.newStudies[0].title).toBe("New");
  });

  it("never guesses a study is new when it has neither a DOI nor a sourceUrl", async () => {
    const { report } = await setUpReadyReport([]);
    const unidentifiable = makeRecord({ doi: null, sourceUrl: null });

    const result = await runUpdateCheck(report, {
      runSearch: async () => makeSearchResult([unidentifiable]),
    });

    expect(result.newStudies).toHaveLength(0);
  });

  it("re-runs the search with the report's original question, domain, locale, and filters", async () => {
    const { report } = await setUpReadyReport([]);
    let capturedArgs: unknown[] = [];

    await runUpdateCheck(report, {
      runSearch: async (...args: unknown[]) => {
        capturedArgs = args;
        return makeSearchResult([]);
      },
    });

    expect(capturedArgs[0]).toBe(report.originalQuestion);
    expect(capturedArgs[1]).toBe(report.domainSlug);
    expect(capturedArgs[2]).toBe(report.locale);
    expect(capturedArgs[3]).toEqual(report.previewPayload?.filtersApplied);
  });
});

function makeSearchResult(newRecords: ReturnType<typeof makeRecord>[]): SearchRunResult {
  return {
    query: "q",
    topicSlug: "fitness-leistungsfaehigkeit",
    searchDate: new Date().toISOString(),
    screeningVersion: "screening-v2",
    candidateCount: newRecords.length,
    duplicatesRemoved: 0,
    includedCount: newRecords.length,
    excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
    filtersApplied: { maxAgeYears: null, studyTypes: null, studyRegions: null },
    excludedByFilterCount: 0,
    perSource: [{ source: "openalex", ok: true, recordCount: newRecords.length }],
    rankedIncluded: newRecords.map((record) => ({
      deduped: { record, mergedFromSources: [record.source] },
      score: 1,
    })),
    detailed: [],
  };
}
