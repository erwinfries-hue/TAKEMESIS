import { describe, expect, it } from "vitest";
import { screenRecords, MIN_RELEVANCE_SCORE } from "./screening";
import { makeRecord } from "./test-fixtures";

function wrap(record: ReturnType<typeof makeRecord>) {
  return { record, mergedFromSources: [record.source] };
}

describe("screenRecords", () => {
  it("excludes retracted records", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "retracted" }))],
      "Fixture Study",
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded).toEqual([
      expect.objectContaining({ reason: "retracted" }),
    ]);
  });

  it("excludes study protocols (not outcome studies)", () => {
    const result = screenRecords(
      [wrap(makeRecord({ publicationType: "protocol" }))],
      "Fixture Study",
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("protocol_only");
  });

  it("excludes records with no usable title", () => {
    const result = screenRecords([wrap(makeRecord({ title: null }))], "Fixture Study");
    expect(result.excluded[0].reason).toBe("insufficient_detail");
  });

  it("includes an otherwise-ordinary record that matches the query", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "none", publicationType: "rct", title: "A Trial" }))],
      "A Trial",
    );
    expect(result.included).toHaveLength(1);
    expect(result.excluded).toHaveLength(0);
  });

  it("includes corrected (not retracted) records — correction alone isn't disqualifying", () => {
    const result = screenRecords(
      [wrap(makeRecord({ retractionStatus: "corrected" }))],
      "Fixture Study",
    );
    expect(result.included).toHaveLength(1);
  });

  it("does not exclude metadata-only records — that's an eligibility-tier signal, not a screening exclusion", () => {
    const result = screenRecords(
      [wrap(makeRecord({ dataCompleteness: "metadata_only", abstract: null }))],
      "Fixture Study",
    );
    expect(result.included).toHaveLength(1);
  });

  it("excludes records below the relevance threshold as not_relevant (2026-07-26 live production finding)", () => {
    const result = screenRecords(
      [wrap(makeRecord({ title: "Offene Kultur hilft beim Risikomanagement" }))],
      "Hilft Kreatin beim Muskelaufbau?",
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
      "Hilft Kreatin beim Muskelaufbau?",
    );
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("not_relevant");
  });

  it("includes a record that genuinely mentions both meaningful terms of a short question", () => {
    const result = screenRecords(
      [wrap(makeRecord({ title: "Kreatin-Supplementierung und Muskelaufbau bei Kraftsportlern" }))],
      "Hilft Kreatin beim Muskelaufbau?",
    );
    expect(result.included).toHaveLength(1);
  });

  it("uses the plain fraction threshold (not full-match) once a question has 3+ meaningful terms", () => {
    // "kreatin", "sportlern", "muskelaufbau" — 3 terms; matching 2 of 3 (0.67) clears 0.4 even without every term.
    const result = screenRecords(
      [wrap(makeRecord({ title: "Kreatin und Muskelaufbau: eine Übersicht" }))],
      "Hilft Kreatin Sportlern beim Muskelaufbau?",
    );
    expect(result.included).toHaveLength(1);
  });

  it("MIN_RELEVANCE_SCORE is the documented 0.4 threshold", () => {
    expect(MIN_RELEVANCE_SCORE).toBe(0.4);
  });
});
