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
/**
 * Persisting an event must never break the page that triggered it — same
 * "analytics is optional" principle as `forwardToPostHog`'s null-client
 * no-op, extended to the repository itself: a misconfigured or unreachable
 * Supabase (e.g. SUPABASE_URL unset) must not turn into a 500 on `/search`.
 */
export async function track(
  params: TrackParams,
  repository: AnalyticsEventRepository = defaultRepository,
): Promise<void> {
  const safeMetadata = sanitizeMetadata(params.metadata);

  try {
    await repository.record({
      eventName: params.eventName,
      reportId: params.reportId ?? null,
      anonymizedSessionId: params.anonymizedSessionId ?? null,
      metadata: safeMetadata,
    });
  } catch (error) {
    console.error(`Analytics: failed to record "${params.eventName}"`, error);
  }

  try {
    // Awaited (not fire-and-forget) so the flush this now performs actually
    // completes before a serverless function can freeze/return — see
    // posthog.ts's CaptureCapableClient.flush doc comment. A network hiccup
    // reaching PostHog must still never break the page, same as above.
    await forwardToPostHog(params.eventName, safeMetadata, params.anonymizedSessionId ?? undefined);
  } catch (error) {
    console.error(`Analytics: failed to forward "${params.eventName}" to PostHog`, error);
  }
}
