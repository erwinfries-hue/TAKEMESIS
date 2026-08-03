/**
 * Approximates a study's population region from its MeSH geographic
 * headings (NLM's "Z" tree) — decision #6 / OPEN_RISKS.md #22, Option 2.
 *
 * Deliberately coarse (continent-level, not per-country) and deliberately
 * best-effort: only Europe PMC and NCBI/PubMed provide MeSH indexing at
 * all, and even there, geographic tagging is real but sparse (mostly
 * epidemiology/public-health articles; preprints and non-MEDLINE content
 * have none). A record with no match here is never assumed to be outside a
 * selected region — it falls into the explicit "not_reported" bucket
 * (filters.ts) so the search-scope filter never silently drops studies it
 * simply has no geographic data for. Per CLAUDE.md's evidence-integrity
 * rule ("never invent source coverage"), this label is presented as
 * approximate, not authoritative.
 *
 * The term list below was built from general knowledge of MeSH's published
 * Geographic descriptor tree and common English country names, not a live
 * fetch of NLM's current MeSH descriptor list — this sandbox has no
 * outbound network access to verify exact spelling/coverage against a real
 * MeSH/Europe PMC/PubMed response (same constraint noted throughout
 * OPEN_RISKS.md). Flagged for a live spot-check once deployed: confirm a
 * few known geographically-tagged PubMed/Europe PMC records actually match
 * here. An unmatched real MeSH term degrades safely to "not_reported"
 * rather than breaking anything.
 */

export type StudyRegionId =
  | "europe"
  | "north_america"
  | "latin_america"
  | "middle_east"
  | "africa"
  | "asia"
  | "oceania";

export const STUDY_REGION_IDS: StudyRegionId[] = [
  "europe",
  "north_america",
  "latin_america",
  "middle_east",
  "africa",
  "asia",
  "oceania",
];

/**
 * Lowercased MeSH geographic term -> broad region. Includes both
 * continent/sub-region-level descriptors (e.g. "Europe", "Scandinavian and
 * Nordic Countries") and individual country-level descriptors MEDLINE
 * commonly indexes with. Not exhaustive of every micro-territory — a miss
 * here just means "not_reported", never a wrong region.
 */
const MESH_TERM_TO_REGION: Record<string, StudyRegionId> = {
  // Europe
  europe: "europe",
  "western europe": "europe",
  "eastern europe": "europe",
  "northern europe": "europe",
  "southern europe": "europe",
  "scandinavian and nordic countries": "europe",
  "baltic states": "europe",
  "european union": "europe",
  austria: "europe",
  belgium: "europe",
  bulgaria: "europe",
  croatia: "europe",
  cyprus: "europe",
  "czech republic": "europe",
  czechia: "europe",
  denmark: "europe",
  estonia: "europe",
  finland: "europe",
  france: "europe",
  germany: "europe",
  greece: "europe",
  hungary: "europe",
  iceland: "europe",
  ireland: "europe",
  italy: "europe",
  latvia: "europe",
  liechtenstein: "europe",
  lithuania: "europe",
  luxembourg: "europe",
  malta: "europe",
  netherlands: "europe",
  norway: "europe",
  poland: "europe",
  portugal: "europe",
  romania: "europe",
  slovakia: "europe",
  slovenia: "europe",
  spain: "europe",
  sweden: "europe",
  switzerland: "europe",
  "united kingdom": "europe",
  england: "europe",
  scotland: "europe",
  wales: "europe",
  "northern ireland": "europe",
  albania: "europe",
  belarus: "europe",
  "bosnia and herzegovina": "europe",
  kosovo: "europe",
  moldova: "europe",
  monaco: "europe",
  montenegro: "europe",
  "north macedonia": "europe",
  serbia: "europe",
  ukraine: "europe",
  russia: "europe",
  "russian federation": "europe",

  // North America
  "north america": "north_america",
  "united states": "north_america",
  usa: "north_america",
  "united states of america": "north_america",
  canada: "north_america",
  greenland: "north_america",

  // Latin America (Mexico, Central America, Caribbean, South America)
  "latin america": "latin_america",
  "central america": "latin_america",
  "caribbean region": "latin_america",
  "south america": "latin_america",
  mexico: "latin_america",
  argentina: "latin_america",
  bolivia: "latin_america",
  brazil: "latin_america",
  chile: "latin_america",
  colombia: "latin_america",
  "costa rica": "latin_america",
  cuba: "latin_america",
  "dominican republic": "latin_america",
  ecuador: "latin_america",
  "el salvador": "latin_america",
  guatemala: "latin_america",
  haiti: "latin_america",
  honduras: "latin_america",
  jamaica: "latin_america",
  nicaragua: "latin_america",
  panama: "latin_america",
  paraguay: "latin_america",
  peru: "latin_america",
  "puerto rico": "latin_america",
  "trinidad and tobago": "latin_america",
  uruguay: "latin_america",
  venezuela: "latin_america",

  // Middle East
  "middle east": "middle_east",
  bahrain: "middle_east",
  iran: "middle_east",
  iraq: "middle_east",
  israel: "middle_east",
  jordan: "middle_east",
  kuwait: "middle_east",
  lebanon: "middle_east",
  oman: "middle_east",
  qatar: "middle_east",
  "saudi arabia": "middle_east",
  syria: "middle_east",
  turkey: "middle_east",
  "united arab emirates": "middle_east",
  yemen: "middle_east",
  palestine: "middle_east",

  // Africa
  africa: "africa",
  "north africa": "africa",
  "africa, northern": "africa",
  "africa south of the sahara": "africa",
  algeria: "africa",
  angola: "africa",
  benin: "africa",
  botswana: "africa",
  "burkina faso": "africa",
  burundi: "africa",
  cameroon: "africa",
  chad: "africa",
  congo: "africa",
  "democratic republic of the congo": "africa",
  "cote d'ivoire": "africa",
  "ivory coast": "africa",
  egypt: "africa",
  ethiopia: "africa",
  gabon: "africa",
  ghana: "africa",
  guinea: "africa",
  kenya: "africa",
  liberia: "africa",
  libya: "africa",
  madagascar: "africa",
  malawi: "africa",
  mali: "africa",
  mauritania: "africa",
  mauritius: "africa",
  morocco: "africa",
  mozambique: "africa",
  namibia: "africa",
  niger: "africa",
  nigeria: "africa",
  rwanda: "africa",
  senegal: "africa",
  "sierra leone": "africa",
  somalia: "africa",
  "south africa": "africa",
  "south sudan": "africa",
  sudan: "africa",
  tanzania: "africa",
  togo: "africa",
  tunisia: "africa",
  uganda: "africa",
  zambia: "africa",
  zimbabwe: "africa",

  // Asia
  asia: "asia",
  "central asia": "asia",
  "asia, eastern": "asia",
  "far east": "asia",
  "asia, southeastern": "asia",
  "asia, western": "asia",
  afghanistan: "asia",
  bangladesh: "asia",
  bhutan: "asia",
  brunei: "asia",
  cambodia: "asia",
  china: "asia",
  india: "asia",
  indonesia: "asia",
  japan: "asia",
  kazakhstan: "asia",
  kyrgyzstan: "asia",
  laos: "asia",
  malaysia: "asia",
  mongolia: "asia",
  myanmar: "asia",
  nepal: "asia",
  "north korea": "asia",
  pakistan: "asia",
  philippines: "asia",
  singapore: "asia",
  "south korea": "asia",
  korea: "asia",
  "sri lanka": "asia",
  taiwan: "asia",
  tajikistan: "asia",
  thailand: "asia",
  turkmenistan: "asia",
  uzbekistan: "asia",
  vietnam: "asia",
  "hong kong": "asia",

  // Oceania
  oceania: "oceania",
  australia: "oceania",
  "new zealand": "oceania",
  fiji: "oceania",
  "papua new guinea": "oceania",
  polynesia: "oceania",
  melanesia: "oceania",
  micronesia: "oceania",
  "pacific islands": "oceania",
};

/**
 * Best-effort, first-match region for a record's MeSH headings — null when
 * no heading matches (caller maps that to the "not_reported" filter
 * bucket, not to "excluded"). A record can carry many unrelated MeSH terms
 * (methodology, MeSH "check tags" like "Humans", disease terms); the first
 * geographic match found wins rather than trying to rank multiple matches
 * against each other.
 */
export function deriveStudyRegion(meshHeadings: string[] | undefined): StudyRegionId | null {
  if (!meshHeadings || meshHeadings.length === 0) {
    return null;
  }
  for (const heading of meshHeadings) {
    const region = MESH_TERM_TO_REGION[heading.trim().toLowerCase()];
    if (region) {
      return region;
    }
  }
  return null;
}
