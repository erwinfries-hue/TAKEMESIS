import { describe, expect, it } from "vitest";
import {
  applyFilters,
  hasActiveFilters,
  NO_FILTERS,
  parseFiltersFromParams,
  STUDY_REGION_FILTER_IDS,
  STUDY_TYPE_GROUPS,
  type SearchFilters,
} from "./filters";
import { makeRecord } from "./test-fixtures";
import type { DedupedRecord } from "./dedupe";

function wrap(overrides: Parameters<typeof makeRecord>[0] = {}): DedupedRecord {
  const record = makeRecord(overrides);
  return { record, mergedFromSources: [record.source] };
}

describe("hasActiveFilters", () => {
  it("is false for NO_FILTERS", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });

  it("is true when any field is set", () => {
    expect(hasActiveFilters({ maxAgeYears: 5, studyTypes: null, studyRegions: null })).toBe(true);
    expect(hasActiveFilters({ maxAgeYears: null, studyTypes: ["rct"], studyRegions: null })).toBe(true);
    expect(hasActiveFilters({ maxAgeYears: null, studyTypes: null, studyRegions: ["europe"] })).toBe(
      true,
    );
  });
});

describe("parseFiltersFromParams", () => {
  it("returns NO_FILTERS when no params are given", () => {
    expect(parseFiltersFromParams({})).toEqual(NO_FILTERS);
  });

  it("parses a recognized age-limit option", () => {
    expect(parseFiltersFromParams({ maxAgeYears: "10" })).toEqual({
      maxAgeYears: 10,
      studyTypes: null,
      studyRegions: null,
    });
  });

  it("ignores an unrecognized age-limit value rather than throwing", () => {
    expect(parseFiltersFromParams({ maxAgeYears: "999" })).toEqual(NO_FILTERS);
    expect(parseFiltersFromParams({ maxAgeYears: "not-a-number" })).toEqual(NO_FILTERS);
  });

  it("restricts to the selected study-type groups", () => {
    const result = parseFiltersFromParams({ studyTypeGroup: "rct" });
    expect(result.studyTypes).toEqual(STUDY_TYPE_GROUPS.rct);
  });

  it("combines multiple selected groups", () => {
    const result = parseFiltersFromParams({ studyTypeGroup: ["rct", "reviews"] });
    expect(result.studyTypes).toEqual(
      expect.arrayContaining([...STUDY_TYPE_GROUPS.rct, ...STUDY_TYPE_GROUPS.reviews]),
    );
    expect(result.studyTypes).toHaveLength(3);
  });

  it("treats all four groups selected as no restriction", () => {
    const result = parseFiltersFromParams({
      studyTypeGroup: ["reviews", "rct", "observational", "other"],
    });
    expect(result.studyTypes).toBeNull();
  });

  it("treats zero groups selected (nothing submitted) as no restriction, not 'match nothing'", () => {
    expect(parseFiltersFromParams({ studyTypeGroup: undefined })).toEqual(NO_FILTERS);
  });

  it("ignores unrecognized group ids rather than throwing", () => {
    const result = parseFiltersFromParams({ studyTypeGroup: "not-a-real-group" });
    expect(result.studyTypes).toBeNull();
  });

  it("restricts to the selected study regions, including the 'not_reported' bucket", () => {
    const result = parseFiltersFromParams({ studyRegion: ["europe", "not_reported"] });
    expect(result.studyRegions).toEqual(["europe", "not_reported"]);
  });

  it("treats every region bucket selected as no restriction", () => {
    const result = parseFiltersFromParams({ studyRegion: [...STUDY_REGION_FILTER_IDS] });
    expect(result.studyRegions).toBeNull();
  });

  it("treats zero regions selected (nothing submitted) as no restriction, not 'match nothing'", () => {
    expect(parseFiltersFromParams({ studyRegion: undefined })).toEqual(NO_FILTERS);
  });

  it("ignores unrecognized region ids rather than throwing", () => {
    const result = parseFiltersFromParams({ studyRegion: "atlantis" });
    expect(result.studyRegions).toBeNull();
  });
});

describe("applyFilters", () => {
  const currentYear = new Date().getFullYear();

  it("returns all records unchanged when no filters are active", () => {
    const records = [wrap({ year: 1990 }), wrap({ year: null })];
    const result = applyFilters(records, NO_FILTERS);
    expect(result.records).toEqual(records);
    expect(result.excludedByFilterCount).toBe(0);
  });

  it("excludes studies older than the age limit", () => {
    const recent = wrap({ year: currentYear });
    const old = wrap({ year: currentYear - 10 });
    const filters: SearchFilters = { maxAgeYears: 5, studyTypes: null, studyRegions: null };
    const result = applyFilters([recent, old], filters);
    expect(result.records).toEqual([recent]);
    expect(result.excludedByFilterCount).toBe(1);
  });

  it("excludes studies with an unknown year when an age filter is active — never guesses they'd pass", () => {
    const unknown = wrap({ year: null });
    const filters: SearchFilters = { maxAgeYears: 5, studyTypes: null, studyRegions: null };
    const result = applyFilters([unknown], filters);
    expect(result.records).toEqual([]);
    expect(result.excludedByFilterCount).toBe(1);
  });

  it("keeps a study exactly at the age boundary", () => {
    const boundary = wrap({ year: currentYear - 5 });
    const filters: SearchFilters = { maxAgeYears: 5, studyTypes: null, studyRegions: null };
    const result = applyFilters([boundary], filters);
    expect(result.records).toEqual([boundary]);
  });

  it("restricts to the chosen study types", () => {
    const rct = wrap({ publicationType: "rct" });
    const cohort = wrap({ publicationType: "cohort" });
    const filters: SearchFilters = { maxAgeYears: null, studyTypes: ["rct"], studyRegions: null };
    const result = applyFilters([rct, cohort], filters);
    expect(result.records).toEqual([rct]);
    expect(result.excludedByFilterCount).toBe(1);
  });

  it("combines all three filters (a record must pass all of them)", () => {
    const passesAll = wrap({ year: currentYear, publicationType: "rct" });
    const failsAge = wrap({ year: currentYear - 20, publicationType: "rct" });
    const failsType = wrap({ year: currentYear, publicationType: "case_report" });
    const filters: SearchFilters = { maxAgeYears: 5, studyTypes: ["rct"], studyRegions: null };
    const result = applyFilters([passesAll, failsAge, failsType], filters);
    expect(result.records).toEqual([passesAll]);
    expect(result.excludedByFilterCount).toBe(2);
  });

  it("restricts to studies whose derived MeSH region is in the chosen set", () => {
    const germany = wrap({ meshHeadings: ["Germany"] });
    const brazil = wrap({ meshHeadings: ["Brazil"] });
    const filters: SearchFilters = { maxAgeYears: null, studyTypes: null, studyRegions: ["europe"] };
    const result = applyFilters([germany, brazil], filters);
    expect(result.records).toEqual([germany]);
    expect(result.excludedByFilterCount).toBe(1);
  });

  it("keeps a study with no MeSH data when 'not_reported' is among the selected buckets", () => {
    const noMesh = wrap({ meshHeadings: undefined });
    const germany = wrap({ meshHeadings: ["Germany"] });
    const filters: SearchFilters = {
      maxAgeYears: null,
      studyTypes: null,
      studyRegions: ["not_reported"],
    };
    const result = applyFilters([noMesh, germany], filters);
    expect(result.records).toEqual([noMesh]);
  });

  it("excludes a study with no MeSH data when 'not_reported' is NOT among the selected buckets", () => {
    const noMesh = wrap({ meshHeadings: undefined });
    const filters: SearchFilters = { maxAgeYears: null, studyTypes: null, studyRegions: ["europe"] };
    const result = applyFilters([noMesh], filters);
    expect(result.records).toEqual([]);
    expect(result.excludedByFilterCount).toBe(1);
  });
});
