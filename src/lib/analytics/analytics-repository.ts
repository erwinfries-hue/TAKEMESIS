import type { AnalyticsEventName, AnalyticsMetadata } from "./events";

export interface AnalyticsEventInput {
  eventName: AnalyticsEventName;
  reportId: string | null;
  anonymizedSessionId: string | null;
  metadata: AnalyticsMetadata;
}

/** The `analytics_events` Supabase table is the source-of-truth internal record; PostHog is the operator-facing funnel/dashboard view (decision #14). */
export interface AnalyticsEventRepository {
  record(input: AnalyticsEventInput): Promise<void>;
}
