import "server-only";
import type { StudyCacheRepository } from "@/lib/studies/study-cache-repository";
import type { CachedStudy } from "@/lib/studies/types";

/** Per-topic cap so a very active topic's section can't dwarf the whole digest — same intent as the report's DETAILED_RESULTS_CAP, just for a different content source. */
export const DIGEST_STUDIES_PER_TOPIC = 5;

export interface DigestTopicSection {
  topicSlug: string;
  studies: CachedStudy[];
}

/**
 * Builds one section per subscribed topic that actually has new studies —
 * topics with nothing new since `sinceIso` are silently omitted, never
 * padded with a "nothing found" filler (decision: see docs/OPEN_RISKS.md
 * item #25's 2026-08-04 update — "generate automatically from real search
 * hits, no manual curation" also means never inventing content for a quiet
 * week). The studies cache is the only source: every entry there already
 * came from a real, live TEKMESIS search (see studies/types.ts), so this
 * never surfaces anything that wasn't actually found.
 */
export async function buildDigestSections(
  topicSlugs: string[],
  sinceIso: string,
  studyCache: StudyCacheRepository,
): Promise<DigestTopicSection[]> {
  const sections: DigestTopicSection[] = [];
  for (const topicSlug of topicSlugs) {
    const studies = await studyCache.findRecentByTopic(topicSlug, sinceIso, DIGEST_STUDIES_PER_TOPIC);
    if (studies.length > 0) {
      sections.push({ topicSlug, studies });
    }
  }
  return sections;
}
