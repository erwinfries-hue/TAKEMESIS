import "server-only";
import { SupabaseAnalyticsRepository } from "./supabase-analytics-repository";
import type { AnalyticsEventRepository } from "./analytics-repository";

/**
 * Below this, the "N people already asked this" line doesn't render at all.
 * Showing "0" or "1 person" before real beta traffic exists would undermine
 * the social-proof signal rather than build it — better to show nothing
 * until there's genuinely something worth showing.
 */
export const SOCIAL_PROOF_MIN_COUNT = 5;

const defaultRepository = new SupabaseAnalyticsRepository();

export async function getAskedCountForDomain(
  domainSlug: string,
  repository: AnalyticsEventRepository = defaultRepository,
): Promise<number | null> {
  try {
    const count = await repository.countByEventAndDomain("domain_classified", domainSlug);
    return count >= SOCIAL_PROOF_MIN_COUNT ? count : null;
  } catch (error) {
    console.error(`Analytics: failed to fetch asked-count for "${domainSlug}"`, error);
    return null;
  }
}
