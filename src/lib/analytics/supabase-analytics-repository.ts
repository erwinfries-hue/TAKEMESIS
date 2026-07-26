import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { AnalyticsEventInput, AnalyticsEventRepository } from "./analytics-repository";

/** Untested against a live database — see the same note in supabase-report-repository.ts. */
export class SupabaseAnalyticsRepository implements AnalyticsEventRepository {
  async record(input: AnalyticsEventInput): Promise<void> {
    const { error } = await getSupabaseClient().from("analytics_events").insert({
      event_name: input.eventName,
      report_id: input.reportId,
      anonymized_session_id: input.anonymizedSessionId,
      metadata: input.metadata,
    });
    if (error) throw error;
  }
}
