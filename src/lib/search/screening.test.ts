import { describe, expect, it } from "vitest";
import { screenRecords, MIN_RELEVANCE_SCORE } from "./screening";
import { makeRecord } from "./test-fixtures";

function wrap(record: ReturnType<typeof makeRecord>) {
  return { record, mergedFromSources: [record.source] };
}

/** Test-only stand-in for buildSearchQueryConcepts: one word per concept, matching how an untranslated (already-English or single-word) query is grouped in production. */
function toConcepts(query: string): string[][] {
  return query.split(/\s+/).map((word) => [word]);
}

describe("screenRecords", () => {
  it("excludes retracted records", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "retracted" }))],
      toConcepts("Fixture Study"),
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded).toEqual([
      expect.objectContaining({ reason: "retracted" }),
    ]);
  });

  it("excludes study protocols (not outcome studies)", () => {
    const result = screenRecords(
      [wrap(makeRecord({ publicationType: "protocol" }))],
      toConcepts("Fixture Study"),
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("protocol_only");
  });

  it("excludes records with no usable title", () => {
    const result = screenRecords([wrap(makeRecord({ title: null }))], toConcepts("Fixture Study"));
    expect(result.excluded[0].reason).toBe("insufficient_detail");
  });

  it("includes an otherwise-ordinary record that matches the query", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "none", publicationType: "rct", title: "A Trial" }))],
      toConcepts("A Trial"),
    );
    expect(result.included).toHaveLength(1);
    expect(result.excluded).toHaveLength(0);
  });

  it("includes corrected (not retracted) records — correction alone isn't disqualifying", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "corrected" }))],
      toConcepts("Fixture Study"),
    );
    expect(result.included).toHaveLength(1);
  });

  it("does not exclude metadata-only records — that's an eligibility-tier signal, not a screening exclusion", () => {
    const result = screenRecords(
      [wrap(makeRecord({ dataCompleteness: "metadata_only", abstract: null }))],
      toConcepts("Fixture Study"),
    );
    expect(result.included).toHaveLength(1);
  });

  it("excludes records below the relevance threshold as not_relevant (2026-07-26 live production finding)", () => {
    const result = screenRecords(
      [wrap(makeRecord({ title: "Offene Kultur hilft beim Risikomanagement" }))],
      toConcepts("Hilft Kreatin beim Muskelaufbau?"),
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("not_relevant");
  });

  it("excludes a record matching only the generic noun, missing the actual named subject (2026-07-26 live production finding, round 2)", () => {
    // This is the exact record from the live test that motivated the first
    // fix: it shares "Muskelaufbau" with the question but never mentions
    // "Kreatin" at all — the real subject of the question. With only 2
    // meaningful query terms, matching one of two isn't enough signal.
    const result = screenRecords(
      [wrap(makeRecord({ title: "Botenstoff hilft beim Muskelaufbau bei Muskelschwund" }))],
      toConcepts("Hilft Kreatin beim Muskelaufbau?"),
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("not_relevant");
  });

  it("includes a record that genuinely mentions both meaningful terms of a short question", () => {
    const result = screenRecords(
      [wrap(makeRecord({ title: "Kreatin-Supplementierung und Muskelaufbau bei Kraftsportlern" }))],
      toConcepts("Hilft Kreatin beim Muskelaufbau?"),
    );
    expect(result.included).toHaveLength(1);
  });

  it("uses the plain fraction threshold (not full-match) once a question has 3+ meaningful terms", () => {
    // "kreatin", "sportlern", "muskelaufbau" — 3 terms; matching 2 of 3 (0.67) clears 0.4 even without every term.
    const result = screenRecords(
      [wrap(makeRecord({ title: "Kreatin und Muskelaufbau: eine Übersicht" }))],
      toConcepts("Hilft Kreatin Sportlern beim Muskelaufbau?"),
    );
    expect(result.included).toHaveLength(1);
  });

  it("MIN_RELEVANCE_SCORE is the documented 0.4 threshold", () => {
    expect(MIN_RELEVANCE_SCORE).toBe(0.4);
  });

  it("excludes a record matching one word from each of two concepts but never both words of either (2026-08-01 live production finding)", () => {
    // Real case: "Trainingsfrequenz" → "training frequency" and
    // "Kraftzuwachs" → "strength gain" — 2 two-word concepts. The old flat
    // word-overlap check let this MRI-imaging record through because it
    // happens to say "frequency" (signal frequency) and "gain" (signal
    // gain), clearing the old 2-of-4 (50%) fraction threshold despite never
    // mentioning "training" or "strength" at all.
    const result = screenRecords(
      [
        wrap(
          makeRecord({
            title: "Multiscale frequency attention transformer for resolution enhancement",
            abstract: "Achieved a 2.48 dB gain over the second strongest baseline.",
          }),
        ),
      ],
      [
        ["training", "frequency"],
        ["strength", "gain"],
      ],
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("not_relevant");
  });

  it("includes a record that genuinely covers both words of every concept, tolerating plurals", () => {
    const result = screenRecords(
      [
        wrap(
          makeRecord({
            title: "Effect of Resistance Training Frequency on Gains in Muscular Strength",
          }),
        ),
      ],
      [
        ["training", "frequency"],
        ["strength", "gain"],
      ],
    );
    expect(result.included).toHaveLength(1);
  });
});
