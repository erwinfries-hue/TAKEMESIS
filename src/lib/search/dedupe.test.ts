import { describe, expect, it } from "vitest";
import { dedupeRecords } from "./dedupe";
import { makeRecord } from "./test-fixtures";

describe("dedupeRecords", () => {
  it("merges records sharing a DOI across sources, regardless of URL formatting", () => {
    const a = makeRecord({ source: "openalex", doi: "https://doi.org/10.1/ABC" });
    const b = makeRecord({ source: "crossref", doi: "10.1/abc" });

    const result = dedupeRecords([a, b]);
    expect(result.records).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
    expect(result.records[0].mergedFromSources.sort()).toEqual(["crossref", "openalex"]);
  });

  it("merges records with no DOI by normalized title + year", () => {
    const a = makeRecord({ doi: null, title: "Active Recall Improves Retention!", year: 2019 });
    const b = makeRecord({ doi: null, title: "active recall improves retention", year: 2019 });
    const c = makeRecord({ doi: null, title: "active recall improves retention", year: 2021 });

    const result = dedupeRecords([a, b, c]);
    expect(result.records).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it("never collides records that have neither DOI nor title", () => {
    const a = makeRecord({ doi: null, title: null, source: "ncbi_pubmed", sourceId: "1" });
    const b = makeRecord({ doi: null, title: null, source: "ncbi_pubmed", sourceId: "2" });

    const result = dedupeRecords([a, b]);
    expect(result.records).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(0);
  });

  it("fills in missing fields from the duplicate rather than discarding data", () => {
    const withAbstract = makeRecord({
      doi: "10.1/x",
      abstract: "A real abstract.",
      dataCompleteness: "abstract",
      authors: [],
    });
    const withAuthors = makeRecord({
      doi: "10.1/x",
      abstract: null,
      dataCompleteness: "metadata_only",
      authors: ["Real Author"],
    });

    const result = dedupeRecords([withAuthors, withAbstract]);
    expect(result.records).toHaveLength(1);
    const merged = result.records[0].record;
    expect(merged.abstract).toBe("A real abstract.");
    expect(merged.authors).toEqual(["Real Author"]);
    expect(merged.dataCompleteness).toBe("abstract");
  });

  it("never lets a 'retracted' flag from one source be hidden by another source's 'unknown'", () => {
    const flagged = makeRecord({ doi: "10.1/y", retractionStatus: "retracted" });
    const unflagged = makeRecord({ doi: "10.1/y", retractionStatus: "unknown" });

    const result1 = dedupeRecords([flagged, unflagged]);
    expect(result1.records[0].record.retractionStatus).toBe("retracted");

    const result2 = dedupeRecords([unflagged, flagged]);
    expect(result2.records[0].record.retractionStatus).toBe("retracted");
  });

  it("returns zero duplicates removed and every record when nothing matches", () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    const result = dedupeRecords(records);
    expect(result.records).toHaveLength(3);
    expect(result.duplicatesRemoved).toBe(0);
  });
});
