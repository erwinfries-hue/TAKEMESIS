import { describe, expect, it } from "vitest";
import { computeRelevanceScore, meetsRelevanceThreshold } from "./relevance";
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

  it("does not let generic connector words alone count as relevance (real production case)", () => {
    // "Hilft Kreatin beim Muskelaufbau?" vs. a record only sharing "hilft"/"beim".
    const record = makeRecord({ title: "Offene Kultur hilft beim Risikomanagement", abstract: null });
    const score = computeRelevanceScore("Hilft Kreatin beim Muskelaufbau?", record);
    expect(score).toBeLessThan(0.4);
  });

  it("still scores highly when the actual content terms overlap, ignoring stopwords", () => {
    const record = makeRecord({
      title: "Botenstoff hilft beim Muskelaufbau bei Muskelschwund",
      abstract: null,
    });
    const score = computeRelevanceScore("Hilft Kreatin beim Muskelaufbau?", record);
    expect(score).toBeGreaterThanOrEqual(0.4);
  });

  it("ignores German and English stopwords when tokenizing (they never count toward the denominator)", () => {
    const record = makeRecord({ title: "Retention", abstract: null });
    // "does" and "the" are stopwords - "retention" is the only meaningful term.
    expect(computeRelevanceScore("does the retention", record)).toBe(1);
  });

  it("treats 'warum' ('why') as a stopword, not a meaningful term", () => {
    const record = makeRecord({ title: "Etwas ganz anderes", abstract: null });
    expect(computeRelevanceScore("warum ist das so", record)).toBe(0);
  });
});

describe("meetsRelevanceThreshold", () => {
  it("real production case (2026-08-05): a nonsense trivia question no longer matches unrelated German papers sharing only 'warum'/'hoch'", () => {
    // "Warum ist der Eiffelturm so hoch?" — "eiffelturm" is untranslated
    // (not in the DE-EN dictionary), so each meaningful word becomes its
    // own 1-word concept, same as buildSearchQueryConcepts would produce.
    const concepts = [["warum"], ["eiffelturm"], ["hoch"]];
    const unrelatedRecords = [
      makeRecord({
        title:
          'Ökonomische (Fehl-)Anreize der Siedlungsflächenentwicklung – Warum ist der Druck auf die „Grüne Wiese" so hoch?',
        abstract: null,
      }),
      makeRecord({
        title: "55 Kirchensteuer Warum ist die Kirchensteuer in Deutschland unterschiedlich hoch?",
        abstract: null,
      }),
      makeRecord({ title: "Warum sind die Abbruchzahlen in Mathe so hoch?", abstract: null }),
    ];
    for (const record of unrelatedRecords) {
      expect(meetsRelevanceThreshold(concepts, record)).toBe(false);
    }
  });

  it("still matches a record that genuinely contains all concept words", () => {
    const concepts = [["warum"], ["eiffelturm"], ["hoch"]];
    const record = makeRecord({
      title: "Warum ist der Eiffelturm so hoch gebaut worden?",
      abstract: null,
    });
    expect(meetsRelevanceThreshold(concepts, record)).toBe(true);
  });

  it("real production case (2026-08-05): 'measures' + 'everyday life' alone no longer clear the bar for an unrelated climate-change query", () => {
    // buildSearchQueryConcepts("Welche Massnahmen reduzieren den
    // CO2-Fussabdruck im Alltag nachweislich?", "de") produces this concept
    // shape: [["measures"],["co2"],["footprint"],["everyday","life"],["demonstrably"]].
    // Both records below only ever share "measures" and "everyday"/"life"
    // with the query — nothing climate-related — but used to clear the
    // 40%-of-5-concepts bar (2/5) purely on those two generic concepts.
    const concepts = [["measures"], ["co2"], ["footprint"], ["everyday", "life"], ["demonstrably"]];
    const unrelatedRecords = [
      makeRecord({
        title:
          "Subjective and physiological measures reveal emotionally salient moments in virtual everyday life",
        abstract: null,
      }),
      makeRecord({
        title: "Repressive Measures and Everyday Life of Different Segments of Belarusian Society",
        abstract: null,
      }),
    ];
    for (const record of unrelatedRecords) {
      expect(meetsRelevanceThreshold(concepts, record)).toBe(false);
    }

    // The genuinely relevant record (real climate/CO2 content) still passes.
    const relevant = makeRecord({
      title: "Energy Storage Assessment Towards Lowest Life Cycle CO2 Footprint",
      abstract: null,
    });
    expect(meetsRelevanceThreshold(concepts, relevant)).toBe(true);
  });
});
