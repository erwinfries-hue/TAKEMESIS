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

  it("includes a topically relevant record even when its title has different exact wording", () => {
    const result = screenRecords(
      [wrap(makeRecord({ title: "Botenstoff hilft beim Muskelaufbau bei Muskelschwund" }))],
      "Hilft Kreatin beim Muskelaufbau?",
    );
    expect(result.included).toHaveLength(1);
  });

  it("MIN_RELEVANCE_SCORE is the documented 0.4 threshold", () => {
    expect(MIN_RELEVANCE_SCORE).toBe(0.4);
  });
});
