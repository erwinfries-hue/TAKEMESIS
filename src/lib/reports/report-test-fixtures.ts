import type { SearchStatsSummary } from "./search-stats";
import type { TeaserData } from "@/lib/eligibility/teaser";

/** Minimal, valid fixtures for the two payload fields CreateReportInput now requires — shared across test files so each doesn't hand-roll its own. */
export const FAKE_SEARCH_STATS_FIXTURE: SearchStatsSummary = {
  query: "q",
  searchDate: new Date().toISOString(),
  screeningVersion: "screening-v2",
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
  perSource: [],
};

export const FAKE_TEASER_FIXTURE: TeaserData = {
  query: "q",
  searchDate: new Date().toISOString(),
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  studyTypeDistribution: [],
  topStudies: [],
  confidenceLabel: "moderate",
  sourcesUnavailable: [],
  filtersApplied: { maxAgeYears: null, studyTypes: null, studyRegions: null },
  excludedByFilterCount: 0,
};
