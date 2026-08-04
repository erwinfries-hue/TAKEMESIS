import type { CachedStudy, StudyKey, UpsertStudyInput } from "./types";

export interface StudyCacheRepository {
  findByKey(key: StudyKey): Promise<CachedStudy | null>;
  /** Creates the study on first sight, or merges a new AI extraction / topic / seen-count into an existing row. */
  upsert(input: UpsertStudyInput): Promise<CachedStudy>;
  /** Studies tagged with `topicSlug` first cached after `sinceIso`, newest first, capped at `limit` — the Themen-Digest's only content source (topics/digest-content.ts), so it only ever surfaces studies a real search actually found. */
  findRecentByTopic(topicSlug: string, sinceIso: string, limit: number): Promise<CachedStudy[]>;
}
