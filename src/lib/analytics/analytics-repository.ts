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
  /** Social-proof count ("N questions already asked in this domain") — see `SOCIAL_PROOF_MIN_COUNT` for the display gate. */
  countByEventAndDomain(eventName: AnalyticsEventName, domainSlug: string): Promise<number>;
  /** Windowed variant for "trending this week" — see `TRENDING_MIN_COUNT`. */
  countByEventAndDomainSince(
    eventName: AnalyticsEventName,
    domainSlug: string,
    since: Date,
  ): Promise<number>;
}
