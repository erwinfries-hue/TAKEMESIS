import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { FeedbackRepository } from "./feedback-repository";
import type { CreateFeedbackInput, FeedbackEntry } from "./types";

/** Untested against a live database — no Supabase project provisioned in this session, same status as the other Supabase repositories (see docs/OPEN_RISKS.md #13). */
interface FeedbackRow {
  id: string;
  report_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

function toDomain(row: FeedbackRow): FeedbackEntry {
  return {
    id: row.id,
    reportId: row.report_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export class SupabaseFeedbackRepository implements FeedbackRepository {
  async create(input: CreateFeedbackInput): Promise<FeedbackEntry> {
    const { data, error } = await getSupabaseClient()
      .from("feedback")
      .insert({ report_id: input.reportId, rating: input.rating, comment: input.comment })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as FeedbackRow);
  }

  async listAll(): Promise<FeedbackEntry[]> {
    const { data, error } = await getSupabaseClient()
      .from("feedback")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as FeedbackRow[]).map(toDomain);
  }
}
