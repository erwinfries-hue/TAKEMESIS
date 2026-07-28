import "server-only";
import { arxivAdapter } from "./arxiv";
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
  arxivAdapter,
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
const TECHNOLOGY_ROUTE: SourceAdapter[] = [openAlexAdapter, arxivAdapter, crossrefAdapter];

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
  "technologie-digital-life": TECHNOLOGY_ROUTE,
};

/** Falls back to the broad route for an unmapped slug rather than throwing — routing is a search-quality concern, not a hard failure. */
export function adaptersForTopic(slug: string): SourceAdapter[] {
  return TOPIC_ROUTES[slug] ?? BROAD_ROUTE;
}

/**
 * Union of routes across multiple confirmed topics (multi-domain question
 * clarification), deduplicated by adapter identity and order-preserving —
 * a source already pulled in by an earlier slug's route isn't queried
 * twice. A single slug behaves identically to `adaptersForTopic`.
 */
export function adaptersForTopics(slugs: string[]): SourceAdapter[] {
  const seen = new Set<string>();
  const combined: SourceAdapter[] = [];
  for (const slug of slugs) {
    for (const adapter of adaptersForTopic(slug)) {
      if (!seen.has(adapter.capabilities.id)) {
        seen.add(adapter.capabilities.id);
        combined.push(adapter);
      }
    }
  }
  return combined;
}

export async function checkAllSourceStatuses(): Promise<SourceStatus[]> {
  return Promise.all(allAdapters.map((adapter) => adapter.checkStatus()));
}
