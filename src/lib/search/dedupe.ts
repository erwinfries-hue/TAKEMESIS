import type { NormalizedRecord, RetractionStatus, SourceId } from "@/lib/source-adapters/types";

export interface DedupedRecord {
  record: NormalizedRecord;
  /** Every source that returned this record — provenance for the coverage-transparency disclosure. */
  mergedFromSources: SourceId[];
}

export interface DedupeResult {
  records: DedupedRecord[];
  duplicatesRemoved: number;
}

export function normalizeDoi(doi: string | null): string | null {
  if (!doi) {
    return null;
  }
  const trimmed = doi.trim().toLowerCase();
  return trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//, "") || null;
}

function normalizeTitleKey(title: string | null, year: number | null): string | null {
  if (!title) {
    return null;
  }
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return normalized ? `${normalized}::${year ?? "unknown"}` : null;
}

function dedupeKey(record: NormalizedRecord): string {
  return (
    normalizeDoi(record.doi) ??
    normalizeTitleKey(record.title, record.year) ??
    `${record.source}:${record.sourceId}`
  );
}

const DATA_COMPLETENESS_RANK: Record<NormalizedRecord["dataCompleteness"], number> = {
  metadata_only: 0,
  abstract: 1,
  full_text: 2,
};

const RETRACTION_PRIORITY: RetractionStatus[] = ["retracted", "corrected", "none", "unknown"];

/**
 * When two sources disagree on retraction status, the more concerning
 * status always wins — a "none"/"unknown" from one source must never hide
 * a "retracted" flag another source provided.
 */
function mergeRetractionStatus(a: RetractionStatus, b: RetractionStatus): RetractionStatus {
  const rank = (status: RetractionStatus) => RETRACTION_PRIORITY.indexOf(status);
  return rank(a) <= rank(b) ? a : b;
}

function mergeRecords(a: NormalizedRecord, b: NormalizedRecord): NormalizedRecord {
  return {
    ...a,
    doi: a.doi ?? b.doi,
    title: a.title ?? b.title,
    authors: a.authors.length > 0 ? a.authors : b.authors,
    venue: a.venue ?? b.venue,
    year: a.year ?? b.year,
    publicationType: a.publicationType !== "unknown" ? a.publicationType : b.publicationType,
    abstract: a.abstract ?? b.abstract,
    isOpenAccess: a.isOpenAccess ?? b.isOpenAccess,
    retractionStatus: mergeRetractionStatus(a.retractionStatus, b.retractionStatus),
    subjectConcepts: a.subjectConcepts.length > 0 ? a.subjectConcepts : b.subjectConcepts,
    sourceUrl: a.sourceUrl ?? b.sourceUrl,
    dataCompleteness:
      DATA_COMPLETENESS_RANK[a.dataCompleteness] >= DATA_COMPLETENESS_RANK[b.dataCompleteness]
        ? a.dataCompleteness
        : b.dataCompleteness,
  };
}

/**
 * Merges records that represent the same underlying work across multiple
 * adapters — matched by normalized DOI first, then normalized title+year,
 * then falling back to (source, sourceId) so records with neither never
 * collide with each other under a shared empty key.
 */
export function dedupeRecords(records: NormalizedRecord[]): DedupeResult {
  const byKey = new Map<string, DedupedRecord>();
  let duplicatesRemoved = 0;

  for (const record of records) {
    const key = dedupeKey(record);
    const existing = byKey.get(key);
    if (existing) {
      existing.record = mergeRecords(existing.record, record);
      if (!existing.mergedFromSources.includes(record.source)) {
        existing.mergedFromSources.push(record.source);
      }
      duplicatesRemoved += 1;
    } else {
      byKey.set(key, { record, mergedFromSources: [record.source] });
    }
  }

  return { records: Array.from(byKey.values()), duplicatesRemoved };
}
