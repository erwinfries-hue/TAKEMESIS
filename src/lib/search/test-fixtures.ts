import type { NormalizedRecord } from "@/lib/source-adapters/types";

let counter = 0;

/** Builds a NormalizedRecord with sensible defaults for tests, overridable per field. */
export function makeRecord(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  counter += 1;
  return {
    source: "openalex",
    sourceId: `fixture-${counter}`,
    doi: null,
    title: `Fixture Study ${counter}`,
    authors: ["Fixture Author"],
    venue: "Fixture Journal",
    year: 2020,
    publicationType: "unknown",
    abstract: null,
    isOpenAccess: null,
    retractionStatus: "none",
    subjectConcepts: [],
    sourceUrl: null,
    dataCompleteness: "metadata_only",
    fetchedAt: "2026-07-25T00:00:00.000Z",
    ...overrides,
  };
}
