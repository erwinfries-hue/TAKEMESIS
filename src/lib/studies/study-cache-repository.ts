import type { CachedStudy, StudyKey, UpsertStudyInput } from "./types";

export interface StudyCacheRepository {
  findByKey(key: StudyKey): Promise<CachedStudy | null>;
  /** Creates the study on first sight, or merges a new AI extraction / topic / seen-count into an existing row. */
  upsert(input: UpsertStudyInput): Promise<CachedStudy>;
}
