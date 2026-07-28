import "server-only";
import { PostHog } from "posthog-node";
import { clientEnv } from "@/lib/env/client";
import type { AnalyticsMetadata } from "./events";

const POSTHOG_EU_HOST = "https://eu.posthog.com";

let cachedClient: PostHog | null = null;

/**
 * Returns null (safe no-op) whenever analytics is disabled or unconfigured
 * — decision #14: PostHog EU Cloud, but only once
 * NEXT_PUBLIC_ANALYTICS_ENABLED and a site ID are actually set. Unlike the
 * Stripe/Supabase clients, a missing PostHog config is never an error
 * condition: analytics is optional, the app must work without it.
 */
export function getPostHogClient(): PostHog | null {
  if (!clientEnv.NEXT_PUBLIC_ANALYTICS_ENABLED || !clientEnv.NEXT_PUBLIC_ANALYTICS_SITE_ID) {
    return null;
  }
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new PostHog(clientEnv.NEXT_PUBLIC_ANALYTICS_SITE_ID, { host: POSTHOG_EU_HOST });
  return cachedClient;
}

export interface CaptureCapableClient {
  capture: (params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) => void;
  /**
   * posthog-node batches captured events and sends them on an internal
   * timer, not immediately — harmless on a long-lived server, but on
   * Vercel's serverless runtime the execution environment can freeze right
   * after the response is sent, before that timer ever fires, silently
   * dropping the event. Optional so test doubles that only care about
   * `capture` don't need to implement it.
   */
  flush?: () => Promise<void>;
}

export async function forwardToPostHog(
  eventName: string,
  metadata: AnalyticsMetadata,
  distinctId = "anonymous",
  client: CaptureCapableClient | null = getPostHogClient(),
): Promise<void> {
  if (!client) {
    return;
  }
  client.capture({ distinctId, event: eventName, properties: metadata });
  await client.flush?.();
}
