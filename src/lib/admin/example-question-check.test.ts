import { describe, expect, it } from "vitest";
import type { SourceAdapter } from "@/lib/source-adapters/types";
import { checkExampleQuestionsForTopicWithAdapters } from "./example-question-check";
import { makeRecord } from "@/lib/search/test-fixtures";

function fakeAdapter(records: ReturnType<typeof makeRecord>[]): SourceAdapter {
  return {
    capabilities: { id: "openalex", name: "openalex", domainCoverage: "broad_discovery", requiresApiKey: false },
    async search() {
      return records;
    },
    async checkStatus() {
      return { source: "openalex", ok: true, checkedAt: new Date().toISOString() };
    },
  };
}

describe("checkExampleQuestionsForTopicWithAdapters", () => {
  it("returns one result per example question of the given topic/locale, in order", async () => {
    const adapter = fakeAdapter([]);
    const results = await checkExampleQuestionsForTopicWithAdapters(
      "lernen-bildung",
      "de",
      [adapter],
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => typeof r.question === "string" && r.question.length > 0)).toBe(
      true,
    );
  });

  it("returns not_eligible with zero included count when the adapter returns nothing", async () => {
    const adapter = fakeAdapter([]);
    const results = await checkExampleQuestionsForTopicWithAdapters(
      "lernen-bildung",
      "de",
      [adapter],
    );
    for (const result of results) {
      expect(result.eligibility).toBe("not_eligible");
      expect(result.includedCount).toBe(0);
    }
  });

  it("reports eligible when enough genuinely matching, result-bearing records come back", async () => {
    const question = "Welche Lernmethode verbessert den Lernerfolg?";
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        title: `Lernmethode Nummer ${i} und Lernerfolg`,
        abstract: "Diese Studie untersucht Lernmethode und Lernerfolg im Detail.",
        dataCompleteness: "abstract",
      }),
    );
    const adapter = fakeAdapter(records);
    const results = await checkExampleQuestionsForTopicWithAdapters(
      "lernen-bildung",
      "de",
      [adapter],
    );
    const match = results.find((r) => r.question === question);
    expect(match?.eligibility).toBe("eligible");
    expect(match?.includedCount).toBe(5);
  });

  it("surfaces per-source errors instead of swallowing them", async () => {
    const brokenAdapter: SourceAdapter = {
      capabilities: {
        id: "crossref",
        name: "crossref",
        domainCoverage: "broad_discovery",
        requiresApiKey: false,
      },
      async search() {
        throw new Error("crossref is down");
      },
      async checkStatus() {
        return { source: "crossref", ok: false, checkedAt: new Date().toISOString() };
      },
    };
    const results = await checkExampleQuestionsForTopicWithAdapters(
      "lernen-bildung",
      "de",
      [brokenAdapter],
    );
    expect(results[0].sourceErrors).toEqual(["crossref: crossref is down"]);
  });

  it("returns an empty list for an unknown topic slug rather than throwing", async () => {
    const results = await checkExampleQuestionsForTopicWithAdapters(
      "not-a-real-topic",
      "de",
      [fakeAdapter([])],
    );
    expect(results).toEqual([]);
  });
});
