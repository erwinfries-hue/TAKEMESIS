import "server-only";
import type { AnalyticsEventName, AnalyticsMetadata } from "./events";
import { sanitizeMetadata } from "./events";
import type { AnalyticsEventRepository } from "./analytics-repository";
import { SupabaseAnalyticsRepository } from "./supabase-analytics-repository";
import { forwardToPostHog } from "./posthog";

export interface TrackParams {
  eventName: AnalyticsEventName;
  reportId?: string | null;
  anonymizedSessionId?: string | null;
  metadata?: AnalyticsMetadata;
}

const defaultRepository = new SupabaseAnalyticsRepository();

/**
 * Single entry point for recording a funnel event: sanitizes metadata
 * against the allowlist first (so nothing else in the app needs to
 * remember not to pass raw question text), persists it to the
 * source-of-truth repository, and best-effort forwards to PostHog.
 */
export async function track(
  params: TrackParams,
  repository: AnalyticsEventRepository = defaultRepository,
): Promise<void> {
  const safeMetadata = sanitizeMetadata(params.metadata);

  await repository.record({
    eventName: params.eventName,
    reportId: params.reportId ?? null,
    anonymizedSessionId: params.anonymizedSessionId ?? null,
    metadata: safeMetadata,
  });

  forwardToPostHog(params.eventName, safeMetadata, params.anonymizedSessionId ?? undefined);
}
