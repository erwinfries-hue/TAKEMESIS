import { randomUUID } from "node:crypto";
import type { StudyCacheRepository } from "./study-cache-repository";
import type { CachedStudy, StudyKey, UpsertStudyInput } from "./types";

function keyString(key: StudyKey | Pick<CachedStudy, "doi" | "source" | "sourceId">): string {
  return key.doi ? `doi:${key.doi}` : `src:${key.source}:${key.sourceId}`;
}

/** In-process implementation for tests and local development without a database. */
export class InMemoryStudyCacheRepository implements StudyCacheRepository {
  private readonly studies = new Map<string, CachedStudy>();

  async findByKey(key: StudyKey): Promise<CachedStudy | null> {
    return this.studies.get(keyString(key)) ?? null;
  }

  async upsert({ record, aiFields, topicSlug }: UpsertStudyInput): Promise<CachedStudy> {
    const now = new Date().toISOString();
    const k = keyString(record);
    const existing = this.studies.get(k);

    const topicSlugs = existing ? new Set(existing.topicSlugs) : new Set<string>();
    if (topicSlug) topicSlugs.add(topicSlug);

    const study: CachedStudy = {
      id: existing?.id ?? randomUUID(),
      doi: record.doi ?? null,
      source: record.source,
      sourceId: record.sourceId,
      title: record.title,
      authors: record.authors,
      year: record.year,
      venue: record.venue,
      publicationType: record.publicationType,
      dataCompleteness: record.dataCompleteness,
      sourceUrl: record.sourceUrl,
      aiFields,
      aiExtractedAt: now,
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      seenCount: (existing?.seenCount ?? 0) + 1,
      topicSlugs: Array.from(topicSlugs),
    };
    this.studies.set(k, study);
    return study;
  }

  async findRecentByTopic(topicSlug: string, sinceIso: string, limit: number): Promise<CachedStudy[]> {
    return Array.from(this.studies.values())
      .filter((study) => study.topicSlugs.includes(topicSlug) && study.firstSeenAt > sinceIso)
      .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))
      .slice(0, limit);
  }
}
