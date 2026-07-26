import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { AnalyticsEventName } from "./events";
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

  /** Filters on the jsonb `metadata->>domainSlug` text path via PostgREST's arrow-operator column syntax — no grouping query/DB function needed. */
  async countByEventAndDomain(eventName: AnalyticsEventName, domainSlug: string): Promise<number> {
    const { count, error } = await getSupabaseClient()
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", eventName)
      .eq("metadata->>domainSlug", domainSlug);
    if (error) throw error;
    return count ?? 0;
  }

  async countByEventAndDomainSince(
    eventName: AnalyticsEventName,
    domainSlug: string,
    since: Date,
  ): Promise<number> {
    const { count, error } = await getSupabaseClient()
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", eventName)
      .eq("metadata->>domainSlug", domainSlug)
      .gte("created_at", since.toISOString());
    if (error) throw error;
    return count ?? 0;
  }
}
