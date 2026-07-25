import "server-only";
import { crossrefAdapter } from "./crossref";
import { europePmcAdapter } from "./europe-pmc";
import { ncbiAdapter } from "./ncbi";
import { openAlexAdapter } from "./openalex";
import type { SourceAdapter, SourceStatus } from "./types";

/**
 * Structured, machine-usable version of docs/SOURCE_COVERAGE_MATRIX.md.
 * `src/content/topics.ts`'s `sourceRoute` field is the human-readable display
 * text shown on `/sources`; this is the routing table that actually drives
 * which adapters get queried for a given topic. Order matters: earlier
 * adapters are the primary role for that topic, later ones are enrichment.
 */
export const allAdapters: SourceAdapter[] = [
  openAlexAdapter,
  crossrefAdapter,
  europePmcAdapter,
  ncbiAdapter,
];

const BIOMEDICAL_ROUTE: SourceAdapter[] = [
  europePmcAdapter,
  ncbiAdapter,
  openAlexAdapter,
  crossrefAdapter,
];
const BROAD_ROUTE: SourceAdapter[] = [openAlexAdapter, crossrefAdapter];
const BROAD_WITH_BIOMEDICAL_ENRICHMENT: SourceAdapter[] = [
  openAlexAdapter,
  europePmcAdapter,
  crossrefAdapter,
];

const TOPIC_ROUTES: Record<string, SourceAdapter[]> = {
  "gesundheit-praevention": BIOMEDICAL_ROUTE,
  "ernaehrung-supplements": BIOMEDICAL_ROUTE,
  "schlaf-regeneration": BIOMEDICAL_ROUTE,
  "fitness-leistungsfaehigkeit": BIOMEDICAL_ROUTE,
  "lernen-bildung": BROAD_ROUTE,
  "arbeit-produktivitaet": BROAD_ROUTE,
  "psychologie-wohlbefinden": BROAD_WITH_BIOMEDICAL_ENRICHMENT,
  "beziehungen-kommunikation": BROAD_ROUTE,
  "kinder-erziehung": BROAD_WITH_BIOMEDICAL_ENRICHMENT,
  "konsum-kaufentscheidungen": BROAD_ROUTE,
  "umwelt-nachhaltigkeit": BROAD_ROUTE,
  "technologie-digital-life": BROAD_ROUTE,
};

/** Falls back to the broad route for an unmapped slug rather than throwing — routing is a search-quality concern, not a hard failure. */
export function adaptersForTopic(slug: string): SourceAdapter[] {
  return TOPIC_ROUTES[slug] ?? BROAD_ROUTE;
}

export async function checkAllSourceStatuses(): Promise<SourceStatus[]> {
  return Promise.all(allAdapters.map((adapter) => adapter.checkStatus()));
}
