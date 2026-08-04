import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { ExtractedStudyFields } from "@/lib/ai/study-extraction";
import type { DataCompleteness, PublicationType, SourceId } from "@/lib/source-adapters/types";
import type { StudyCacheRepository } from "./study-cache-repository";
import type { CachedStudy, StudyKey, UpsertStudyInput } from "./types";

/**
 * Untested against a live database (no Supabase project provisioned in this
 * session — see docs/OPEN_RISKS.md), same caveat as the other Supabase
 * repositories. Read-then-write, not a single atomic upsert — the two
 * partial unique indexes on `studies` (doi vs. source+source_id) can't both
 * be expressed as a single onConflict target via the Supabase client, so
 * this mirrors SupabaseRateLimiter's documented read-then-write race
 * window, acceptable at this app's traffic level and non-gating nature (a
 * lost race here just means one extra AI extraction, never a wrong report).
 */
interface StudyRow {
  id: string;
  doi: string | null;
  source: SourceId;
  source_id: string;
  title: string | null;
  authors: string[];
  year: number | null;
  venue: string | null;
  publication_type: PublicationType;
  data_completeness: DataCompleteness;
  source_url: string | null;
  ai_population: string | null;
  ai_intervention: string | null;
  ai_outcome: string | null;
  ai_result: string | null;
  ai_uncertainty: string | null;
  ai_limitations: string | null;
  ai_funding_conflicts: string | null;
  ai_extracted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  seen_count: number;
  topic_slugs: string[];
}

function toDomain(row: StudyRow): CachedStudy {
  const aiFields: ExtractedStudyFields | null = row.ai_extracted_at
    ? {
        population: row.ai_population,
        intervention: row.ai_intervention,
        outcome: row.ai_outcome,
        result: row.ai_result,
        uncertainty: row.ai_uncertainty,
        limitations: row.ai_limitations,
        fundingConflicts: row.ai_funding_conflicts,
      }
    : null;

  return {
    id: row.id,
    doi: row.doi,
    source: row.source,
    sourceId: row.source_id,
    title: row.title,
    authors: row.authors,
    year: row.year,
    venue: row.venue,
    publicationType: row.publication_type,
    dataCompleteness: row.data_completeness,
    sourceUrl: row.source_url,
    aiFields,
    aiExtractedAt: row.ai_extracted_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    seenCount: row.seen_count,
    topicSlugs: row.topic_slugs,
  };
}

export class SupabaseStudyCacheRepository implements StudyCacheRepository {
  async findByKey(key: StudyKey): Promise<CachedStudy | null> {
    const query = getSupabaseClient().from("studies").select();
    const { data, error } = key.doi
      ? await query.eq("doi", key.doi).maybeSingle()
      : await query.eq("source", key.source).eq("source_id", key.sourceId).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as StudyRow) : null;
  }

  async upsert({ record, aiFields, topicSlug }: UpsertStudyInput): Promise<CachedStudy> {
    const client = getSupabaseClient();
    const key: StudyKey = record.doi ? { doi: record.doi } : { source: record.source, sourceId: record.sourceId };
    const existing = await this.findByKey(key);
    const now = new Date().toISOString();

    const topicSlugs = new Set(existing?.topicSlugs ?? []);
    if (topicSlug) topicSlugs.add(topicSlug);

    const fields = {
      doi: record.doi,
      source: record.source,
      source_id: record.sourceId,
      title: record.title,
      authors: record.authors,
      year: record.year,
      venue: record.venue,
      publication_type: record.publicationType,
      data_completeness: record.dataCompleteness,
      source_url: record.sourceUrl,
      ai_population: aiFields.population,
      ai_intervention: aiFields.intervention,
      ai_outcome: aiFields.outcome,
      ai_result: aiFields.result,
      ai_uncertainty: aiFields.uncertainty,
      ai_limitations: aiFields.limitations,
      ai_funding_conflicts: aiFields.fundingConflicts,
      ai_extracted_at: now,
      last_seen_at: now,
      topic_slugs: Array.from(topicSlugs),
    };

    if (existing) {
      const { data, error } = await client
        .from("studies")
        .update({ ...fields, seen_count: existing.seenCount + 1 })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return toDomain(data as StudyRow);
    }

    const { data, error } = await client
      .from("studies")
      .insert({ ...fields, first_seen_at: now, seen_count: 1 })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as StudyRow);
  }

  async findRecentByTopic(topicSlug: string, sinceIso: string, limit: number): Promise<CachedStudy[]> {
    const { data, error } = await getSupabaseClient()
      .from("studies")
      .select()
      .contains("topic_slugs", [topicSlug])
      .gt("first_seen_at", sinceIso)
      .order("first_seen_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as StudyRow[]).map(toDomain);
  }
}
