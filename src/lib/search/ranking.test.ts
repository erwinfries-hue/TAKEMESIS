import { describe, expect, it } from "vitest";
import { computeRecencyScore, publicationTypeWeight, rankRecords, scoreRecord } from "./ranking";
import { makeRecord } from "./test-fixtures";

function wrap(record: ReturnType<typeof makeRecord>) {
  return { record, mergedFromSources: [record.source] };
}

describe("publicationTypeWeight", () => {
  it("weights meta-analyses highest and protocols at zero", () => {
    expect(publicationTypeWeight("meta_analysis")).toBeGreaterThan(
      publicationTypeWeight("rct"),
    );
    expect(publicationTypeWeight("rct")).toBeGreaterThan(publicationTypeWeight("case_report"));
    expect(publicationTypeWeight("protocol")).toBe(0);
  });
});

describe("computeRecencyScore", () => {
  it("scores 1 for the current year and fades to 0 by 20 years old", () => {
    expect(computeRecencyScore(2026, 2026)).toBe(1);
    expect(computeRecencyScore(2006, 2026)).toBe(0);
    expect(computeRecencyScore(1990, 2026)).toBe(0);
  });

  it("returns 0 for an unknown year rather than penalizing unfairly hard or guessing", () => {
    expect(computeRecencyScore(null, 2026)).toBe(0);
  });
});

describe("scoreRecord / rankRecords", () => {
  it("ranks a highly relevant meta-analysis above an irrelevant one", () => {
    const relevant = wrap(
      makeRecord({
        title: "Spaced Repetition Improves Long-Term Retention",
        publicationType: "meta_analysis",
        dataCompleteness: "abstract",
        abstract: "spaced repetition retention",
      }),
    );
    const irrelevant = wrap(
      makeRecord({
        title: "Unrelated Topic Entirely",
        publicationType: "meta_analysis",
      }),
    );

    const ranked = rankRecords([irrelevant, relevant], "spaced repetition retention");
    expect(ranked[0].deduped).toBe(relevant);
  });

  it("prefers a stronger study design when relevance ties", () => {
    const rct = wrap(
      makeRecord({ title: "Sleep and Melatonin", publicationType: "rct" }),
    );
    const caseReport = wrap(
      makeRecord({ title: "Sleep and Melatonin", publicationType: "case_report" }),
    );

    const ranked = rankRecords([caseReport, rct], "sleep melatonin");
    expect(ranked[0].deduped).toBe(rct);
  });

  it("does not let recency alone override relevance and study design", () => {
    const oldButRelevantMeta = wrap(
      makeRecord({
        title: "Spaced Repetition Meta-Analysis",
        publicationType: "meta_analysis",
        year: 2000,
      }),
    );
    const newButIrrelevant = wrap(
      makeRecord({ title: "Completely Unrelated", publicationType: "case_report", year: 2026 }),
    );

    const ranked = rankRecords([newButIrrelevant, oldButRelevantMeta], "spaced repetition");
    expect(ranked[0].deduped).toBe(oldButRelevantMeta);
  });

  it("applies a small penalty for corrected records without excluding them", () => {
    const base = makeRecord({ title: "Same Title", retractionStatus: "none" });
    const corrected = makeRecord({ title: "Same Title", retractionStatus: "corrected" });

    const scoreBase = scoreRecord(wrap(base), "same title");
    const scoreCorrected = scoreRecord(wrap(corrected), "same title");
    expect(scoreCorrected).toBeLessThan(scoreBase);
  });
});
