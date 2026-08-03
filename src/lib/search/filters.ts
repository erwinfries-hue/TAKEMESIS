import type { DedupedRecord } from "./dedupe";
import type { PublicationType } from "@/lib/source-adapters/types";
import { deriveStudyRegion, STUDY_REGION_IDS, type StudyRegionId } from "./mesh-geography";

/**
 * User-chosen scope restrictions, applied after evidence-quality screening
 * (screening.ts) and before ranking. Distinct from ExclusionReason: these
 * exclusions reflect what the user asked to narrow down, not an
 * evidence-quality judgment.
 *
 * maxAgeYears and studyTypes are always-reliable filters, backed by fields
 * every adapter populates. studyRegions (decision #6/OPEN_RISKS.md #22,
 * Option 2) is different and deliberately coarser/best-effort: it's derived
 * from MeSH geographic headings (mesh-geography.ts), which only Europe PMC
 * and NCBI/PubMed provide, and only for a subset of their records (mostly
 * epidemiology/public-health articles). A plain "country of study" filter
 * was considered and rejected outright — see git history / OPEN_RISKS.md
 * #22's original entry — because the only near-universal field (OpenAlex
 * author-institution country) reflects where *researchers* are affiliated,
 * not where the study *population* was drawn from. studyRegions never
 * silently drops a record it has no data for: STUDY_REGION_FILTER_IDS
 * always includes an explicit "not_reported" bucket (checked by default,
 * like every other region) so records without MeSH geographic data stay
 * visible unless the user actively excludes that bucket too.
 */
export interface SearchFilters {
  /** Only include studies published within the last N years (inclusive of the current year). Null = no restriction. */
  maxAgeYears: number | null;
  /** Only include studies whose publicationType is in this set. Null = no restriction. */
  studyTypes: PublicationType[] | null;
  /** Only include studies whose derived study region (or "not_reported") is in this set. Null = no restriction. */
  studyRegions: StudyRegionFilterId[] | null;
}

export const NO_FILTERS: SearchFilters = { maxAgeYears: null, studyTypes: null, studyRegions: null };

/** Selectable age-limit presets for the filter UI (years). */
export const AGE_FILTER_OPTIONS = [5, 10, 15] as const;

export type StudyTypeGroupId = "reviews" | "rct" | "observational" | "other";

/**
 * Groups the 11 non-protocol PublicationType values (protocol is already
 * excluded by screening.ts regardless of any filter) into a small set of
 * user-facing checkboxes. Every PublicationType except "protocol" belongs
 * to exactly one group, so "all groups selected" is equivalent to no
 * filter at all — search/page.tsx relies on this to treat an all-selected
 * submission the same as an absent one.
 */
export const STUDY_TYPE_GROUPS: Record<StudyTypeGroupId, PublicationType[]> = {
  reviews: ["systematic_review", "meta_analysis"],
  rct: ["rct"],
  observational: ["cohort", "case_control", "cross_sectional", "quasi_experimental"],
  other: ["review", "case_report", "other", "unknown"],
};

export const STUDY_TYPE_GROUP_IDS = Object.keys(STUDY_TYPE_GROUPS) as StudyTypeGroupId[];

/** A region-filter bucket also includes "not_reported" — records with no MeSH-derived region, never silently dropped. */
export type StudyRegionFilterId = StudyRegionId | "not_reported";

export const STUDY_REGION_FILTER_IDS: StudyRegionFilterId[] = [...STUDY_REGION_IDS, "not_reported"];

export function hasActiveFilters(filters: SearchFilters): boolean {
  return filters.maxAgeYears !== null || filters.studyTypes !== null || filters.studyRegions !== null;
}

/**
 * Builds SearchFilters from the raw `/search` URL query values (the
 * QuestionClarification form's `maxAgeYears` select and `studyTypeGroup`
 * checkboxes submit directly as GET params). Defensive against tampered/
 * malformed values: anything not a recognized option is ignored rather
 * than throwing, so a bad query string degrades to "no filter" instead of
 * breaking the page.
 */
export function parseFiltersFromParams(params: {
  maxAgeYears?: string;
  studyTypeGroup?: string | string[];
  studyRegion?: string | string[];
}): SearchFilters {
  const maxAgeYears = params.maxAgeYears
    ? (AGE_FILTER_OPTIONS.find((option) => option === Number(params.maxAgeYears)) ?? null)
    : null;

  const rawGroups = params.studyTypeGroup
    ? Array.isArray(params.studyTypeGroup)
      ? params.studyTypeGroup
      : [params.studyTypeGroup]
    : [];
  const selectedGroups = rawGroups.filter((id): id is StudyTypeGroupId =>
    STUDY_TYPE_GROUP_IDS.includes(id as StudyTypeGroupId),
  );

  // Every group selected means no restriction (see STUDY_TYPE_GROUPS's
  // comment on why "all groups" == "no filter"). Unchecked checkboxes
  // aren't submitted by browsers, so zero selected groups is
  // indistinguishable from none submitted at all — both fail open to "no
  // filter" rather than a would-be "match nothing" state, since an
  // evidence platform should never silently show zero results when it
  // could show more.
  const studyTypes =
    selectedGroups.length === 0 || selectedGroups.length === STUDY_TYPE_GROUP_IDS.length
      ? null
      : selectedGroups.flatMap((id) => STUDY_TYPE_GROUPS[id]);

  const rawRegions = params.studyRegion
    ? Array.isArray(params.studyRegion)
      ? params.studyRegion
      : [params.studyRegion]
    : [];
  const selectedRegions = rawRegions.filter((id): id is StudyRegionFilterId =>
    STUDY_REGION_FILTER_IDS.includes(id as StudyRegionFilterId),
  );
  // Same "all selected or none submitted" -> "no filter" logic as studyTypes above.
  const studyRegions =
    selectedRegions.length === 0 || selectedRegions.length === STUDY_REGION_FILTER_IDS.length
      ? null
      : selectedRegions;

  return { maxAgeYears, studyTypes, studyRegions };
}

export interface FilterResult {
  records: DedupedRecord[];
  excludedByFilterCount: number;
}

/**
 * A study with an unknown publication year is excluded by an active
 * age filter rather than assumed to pass it — per the "unknown stays
 * null, never guessed" rule, we never guess a study meets a restriction
 * we can't verify it against.
 */
export function applyFilters(records: DedupedRecord[], filters: SearchFilters): FilterResult {
  if (!hasActiveFilters(filters)) {
    return { records, excludedByFilterCount: 0 };
  }

  const currentYear = new Date().getFullYear();
  const minYear = filters.maxAgeYears !== null ? currentYear - filters.maxAgeYears : null;

  const filtered = records.filter(({ record }) => {
    if (minYear !== null && (record.year === null || record.year < minYear)) {
      return false;
    }
    if (filters.studyTypes !== null && !filters.studyTypes.includes(record.publicationType)) {
      return false;
    }
    if (filters.studyRegions !== null) {
      const region: StudyRegionFilterId = deriveStudyRegion(record.meshHeadings) ?? "not_reported";
      if (!filters.studyRegions.includes(region)) {
        return false;
      }
    }
    return true;
  });

  return { records: filtered, excludedByFilterCount: records.length - filtered.length };
}
