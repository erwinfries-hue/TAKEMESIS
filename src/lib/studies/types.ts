import type {
  DataCompleteness,
  NormalizedRecord,
  PublicationType,
  SourceId,
} from "@/lib/source-adapters/types";
import type { ExtractedStudyFields } from "@/lib/ai/study-extraction";

/**
 * Identifies a cached study the same way the underlying database keys it:
 * by DOI when present, otherwise by the source-native ID. Never both at
 * once — mirrors the two partial unique indexes in the studies migration.
 */
export type StudyKey =
  | { doi: string; source?: undefined; sourceId?: undefined }
  | { doi?: null; source: SourceId; sourceId: string };

export function studyKeyFor(record: Pick<NormalizedRecord, "doi" | "source" | "sourceId">): StudyKey {
  return record.doi ? { doi: record.doi } : { source: record.source, sourceId: record.sourceId };
}

export interface CachedStudy {
  id: string;
  doi: string | null;
  source: SourceId;
  sourceId: string;
  title: string | null;
  authors: string[];
  year: number | null;
  venue: string | null;
  publicationType: PublicationType;
  dataCompleteness: DataCompleteness;
  sourceUrl: string | null;
  /** Null until an AI extraction has been cached for this study. */
  aiFields: ExtractedStudyFields | null;
  aiExtractedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  topicSlugs: string[];
}

export type UpsertStudyRecord = Pick<
  NormalizedRecord,
  "source" | "sourceId" | "doi" | "title" | "authors" | "year" | "venue" | "publicationType" | "dataCompleteness" | "sourceUrl"
>;

export interface UpsertStudyInput {
  record: UpsertStudyRecord;
  aiFields: ExtractedStudyFields;
  /** Merged into the study's topic_slugs, not replaced — a study can surface under more than one topic. */
  topicSlug?: string | null;
}
