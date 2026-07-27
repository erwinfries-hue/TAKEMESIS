import { describe, expect, it } from "vitest";
import type { SourceAdapter } from "@/lib/source-adapters/types";
import { runSearchWithAdapters, DETAILED_RESULTS_CAP } from "./run-search";
import { NO_FILTERS } from "./filters";
import { makeRecord } from "./test-fixtures";

function fakeAdapter(
  id: SourceAdapter["capabilities"]["id"],
  behavior: { records?: ReturnType<typeof makeRecord>[]; fails?: boolean },
): SourceAdapter {
  return {
    capabilities: { id, name: id, domainCoverage: "broad_discovery", requiresApiKey: false },
    async search() {
      if (behavior.fails) {
        throw new Error(`${id} is down`);
      }
      return behavior.records ?? [];
    },
    async checkStatus() {
      return { source: id, ok: !behavior.fails, checkedAt: new Date().toISOString() };
    },
  };
}

describe("runSearchWithAdapters", () => {
  it("combines results from multiple sources and reports per-source success", async () => {
    const a = fakeAdapter("openalex", {
      records: [makeRecord({ source: "openalex", title: "Spaced Repetition Study" })],
    });
    const b = fakeAdapter("crossref", {
      records: [makeRecord({ source: "crossref", title: "Active Recall Study" })],
    });

    const result = await runSearchWithAdapters(
      "spaced repetition active recall study",
      "lernen-bildung",
      [a, b],
      "en",
    );

    expect(result.candidateCount).toBe(2);
    expect(result.includedCount).toBe(2);
    expect(result.perSource).toEqual(
      expect.arrayContaining([
        { source: "openalex", ok: true, recordCount: 1 },
        { source: "crossref", ok: true, recordCount: 1 },
      ]),
    );
  });

  it("isolates a failing source instead of failing the whole search", async () => {
    const working = fakeAdapter("openalex", {
      records: [makeRecord({ source: "openalex" })],
    });
    const broken = fakeAdapter("crossref", { fails: true });

    const result = await runSearchWithAdapters("Fixture Study", "lernen-bildung", [
      working,
      broken,
    ], "en");

    expect(result.includedCount).toBe(1);
    const crossrefStatus = result.perSource.find((s) => s.source === "crossref");
    expect(crossrefStatus?.ok).toBe(false);
    expect(crossrefStatus?.error).toContain("is down");
  });

  it("reflects deduplication and screening in the returned counts", async () => {
    const duplicate = makeRecord({ doi: "10.1/dup", title: "Duplicate Study" });
    const retracted = makeRecord({ retractionStatus: "retracted", title: "Retracted Study" });
    const a = fakeAdapter("openalex", { records: [duplicate, retracted] });
    const b = fakeAdapter("crossref", { records: [{ ...duplicate, source: "crossref" }] });

    const result = await runSearchWithAdapters("study", "lernen-bildung", [a, b], "en");

    expect(result.candidateCount).toBe(3);
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.includedCount).toBe(1);
    expect(result.excludedByReason.retracted).toBe(1);
  });

  it("caps the detailed set at DETAILED_RESULTS_CAP but keeps all included records in rankedIncluded", async () => {
    const many = Array.from({ length: DETAILED_RESULTS_CAP + 5 }, (_, i) =>
      makeRecord({ title: `Study number ${i} about spaced repetition` }),
    );
    const a = fakeAdapter("openalex", { records: many });

    const result = await runSearchWithAdapters("spaced repetition", "lernen-bildung", [a], "en");

    expect(result.rankedIncluded.length).toBe(DETAILED_RESULTS_CAP + 5);
    expect(result.detailed.length).toBe(DETAILED_RESULTS_CAP);
  });

  it("records the screening version and search date", async () => {
    const a = fakeAdapter("openalex", { records: [] });
    const result = await runSearchWithAdapters("x", "lernen-bildung", [a], "en");
    expect(result.screeningVersion).toBe("screening-v2");
    expect(() => new Date(result.searchDate).toISOString()).not.toThrow();
  });

  it("defaults to NO_FILTERS and applies no scope restriction", async () => {
    const a = fakeAdapter("openalex", {
      records: [makeRecord({ year: 1999, publicationType: "case_report" })],
    });
    const result = await runSearchWithAdapters("study", "lernen-bildung", [a], "en");
    expect(result.filtersApplied).toEqual(NO_FILTERS);
    expect(result.excludedByFilterCount).toBe(0);
    expect(result.includedCount).toBe(1);
  });

  it("narrows the included set per the given filters and reports the excluded count", async () => {
    const currentYear = new Date().getFullYear();
    const recentRct = makeRecord({
      title: "Recent RCT about spaced repetition",
      year: currentYear,
      publicationType: "rct",
    });
    const oldRct = makeRecord({
      title: "Old RCT about spaced repetition",
      year: currentYear - 20,
      publicationType: "rct",
    });
    const recentCohort = makeRecord({
      title: "Recent cohort study about spaced repetition",
      year: currentYear,
      publicationType: "cohort",
    });
    const a = fakeAdapter("openalex", { records: [recentRct, oldRct, recentCohort] });

    const result = await runSearchWithAdapters("spaced repetition", "lernen-bildung", [a], "en", {
      maxAgeYears: 5,
      studyTypes: ["rct"],
    });

    expect(result.includedCount).toBe(1);
    expect(result.rankedIncluded).toHaveLength(1);
    expect(result.rankedIncluded[0].deduped.record.title).toBe(recentRct.title);
    expect(result.excludedByFilterCount).toBe(2);
  });

  it("omits a record matching excludeDoi entirely, from candidateCount onward", async () => {
    const seed = makeRecord({ doi: "10.1000/seed-study", title: "Spaced repetition seed study" });
    const other = makeRecord({ title: "Spaced repetition comparable study" });
    const a = fakeAdapter("openalex", { records: [seed, other] });

    const result = await runSearchWithAdapters(
      "spaced repetition",
      "lernen-bildung",
      [a],
      "en",
      NO_FILTERS,
      "10.1000/seed-study",
    );

    expect(result.candidateCount).toBe(1);
    expect(result.rankedIncluded).toHaveLength(1);
    expect(result.rankedIncluded[0].deduped.record.title).toBe(other.title);
  });

  it("matches excludeDoi case-insensitively and regardless of a doi.org URL prefix", async () => {
    const seed = makeRecord({ doi: "10.1000/Seed-Study", title: "The seed study itself" });
    const a = fakeAdapter("openalex", { records: [seed] });

    const result = await runSearchWithAdapters(
      "seed study topic",
      "lernen-bildung",
      [a],
      "en",
      NO_FILTERS,
      "https://doi.org/10.1000/seed-study",
    );

    expect(result.candidateCount).toBe(0);
  });

  it("does not filter anything when excludeDoi is omitted, even for records with a null doi", async () => {
    const a = fakeAdapter("openalex", { records: [makeRecord({ doi: null })] });
    const result = await runSearchWithAdapters("x", "lernen-bildung", [a], "en");
    expect(result.candidateCount).toBe(1);
  });

  it("includes an English-language record found for a German question — screening compares against the translated query, not the raw German text", async () => {
    const record = makeRecord({
      title: "Effects of afternoon caffeine consumption on sleep quality",
      abstract:
        "This study examines caffeine consumption in the afternoon and its effect on sleep quality and sleep onset in healthy adults.",
      dataCompleteness: "abstract",
    });
    const a = fakeAdapter("openalex", { records: [record] });

    const result = await runSearchWithAdapters(
      "Welchen Effekt hat Koffeinkonsum am Nachmittag auf den Schlaf?",
      "schlaf-regeneration",
      [a],
      "de",
    );

    expect(result.includedCount).toBe(1);
    expect(result.excludedByReason.not_relevant).toBe(0);
  });
});
