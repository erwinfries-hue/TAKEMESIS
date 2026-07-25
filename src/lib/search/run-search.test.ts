import { describe, expect, it } from "vitest";
import type { SourceAdapter } from "@/lib/source-adapters/types";
import { runSearchWithAdapters, DETAILED_RESULTS_CAP } from "./run-search";
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

    const result = await runSearchWithAdapters("spaced repetition", "lernen-bildung", [a, b]);

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

    const result = await runSearchWithAdapters("x", "lernen-bildung", [working, broken]);

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

    const result = await runSearchWithAdapters("study", "lernen-bildung", [a, b]);

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

    const result = await runSearchWithAdapters("spaced repetition", "lernen-bildung", [a]);

    expect(result.rankedIncluded.length).toBe(DETAILED_RESULTS_CAP + 5);
    expect(result.detailed.length).toBe(DETAILED_RESULTS_CAP);
  });

  it("records the screening version and search date", async () => {
    const a = fakeAdapter("openalex", { records: [] });
    const result = await runSearchWithAdapters("x", "lernen-bildung", [a]);
    expect(result.screeningVersion).toBe("screening-v1");
    expect(() => new Date(result.searchDate).toISOString()).not.toThrow();
  });
});
