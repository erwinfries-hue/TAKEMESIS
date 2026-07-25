import { describe, expect, it } from "vitest";
import { computeRelevanceScore } from "./relevance";
import { makeRecord } from "./test-fixtures";

describe("computeRelevanceScore", () => {
  it("scores 1 when every query term appears in the title", () => {
    const record = makeRecord({ title: "Spaced Repetition Improves Long-Term Retention" });
    expect(computeRelevanceScore("spaced repetition retention", record)).toBe(1);
  });

  it("scores partial overlap proportionally", () => {
    const record = makeRecord({ title: "Spaced Repetition and Memory", abstract: null });
    // 2 of 3 query terms ("spaced", "repetition") appear; "unrelatedword" does not.
    expect(computeRelevanceScore("spaced repetition unrelatedword", record)).toBeCloseTo(2 / 3);
  });

  it("scores 0 when nothing overlaps", () => {
    const record = makeRecord({ title: "Completely Different Topic", abstract: null });
    expect(computeRelevanceScore("spaced repetition", record)).toBe(0);
  });

  it("also searches the abstract, not just the title", () => {
    const record = makeRecord({
      title: "A Generic Study",
      abstract: "This paper investigates spaced repetition effects.",
    });
    expect(computeRelevanceScore("spaced repetition", record)).toBe(1);
  });

  it("returns 0 for an empty query rather than dividing by zero", () => {
    const record = makeRecord({ title: "Anything" });
    expect(computeRelevanceScore("   ", record)).toBe(0);
  });
});
