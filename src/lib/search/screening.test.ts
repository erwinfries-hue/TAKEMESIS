import { describe, expect, it } from "vitest";
import { screenRecords } from "./screening";
import { makeRecord } from "./test-fixtures";

function wrap(record: ReturnType<typeof makeRecord>) {
  return { record, mergedFromSources: [record.source] };
}

describe("screenRecords", () => {
  it("excludes retracted records", () => {
    const result = screenRecords([wrap(makeRecord({ retractionStatus: "retracted" }))]);
    expect(result.included).toHaveLength(0);
    expect(result.excluded).toEqual([
      expect.objectContaining({ reason: "retracted" }),
    ]);
  });

  it("excludes study protocols (not outcome studies)", () => {
    const result = screenRecords([wrap(makeRecord({ publicationType: "protocol" }))]);
    expect(result.included).toHaveLength(0);
    expect(result.excluded[0].reason).toBe("protocol_only");
  });

  it("excludes records with no usable title", () => {
    const result = screenRecords([wrap(makeRecord({ title: null }))]);
    expect(result.excluded[0].reason).toBe("insufficient_detail");
  });

  it("includes an otherwise-ordinary record", () => {
    const result = screenRecords([
      wrap(makeRecord({ retractionStatus: "none", publicationType: "rct", title: "A Trial" })),
    ]);
    expect(result.included).toHaveLength(1);
    expect(result.excluded).toHaveLength(0);
  });

  it("includes corrected (not retracted) records — correction alone isn't disqualifying", () => {
    const result = screenRecords([wrap(makeRecord({ retractionStatus: "corrected" }))]);
    expect(result.included).toHaveLength(1);
  });

  it("does not exclude metadata-only records — that's an eligibility-tier signal, not a screening exclusion", () => {
    const result = screenRecords([
      wrap(makeRecord({ dataCompleteness: "metadata_only", abstract: null })),
    ]);
    expect(result.included).toHaveLength(1);
  });
});
