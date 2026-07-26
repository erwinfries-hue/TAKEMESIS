import "server-only";
import { SupabaseAnalyticsRepository } from "./supabase-analytics-repository";
import type { AnalyticsEventRepository } from "./analytics-repository";

/** Same "don't show a misleading near-zero number" principle as SOCIAL_PROOF_MIN_COUNT. */
export const TRENDING_MIN_COUNT = 3;
export const TRENDING_WINDOW_DAYS = 7;
export const TRENDING_TOP_N = 3;

export interface TrendingTopic {
  domainSlug: string;
  count: number;
}

const defaultRepository = new SupabaseAnalyticsRepository();

/**
 * Top domains by `domain_classified` events in the last `TRENDING_WINDOW_DAYS`
 * days — never raw question text (privacy rule: no raw queries in
 * analytics), only which topic was confirmed. Domains below
 * `TRENDING_MIN_COUNT` are excluded rather than shown with a near-zero
 * count; an empty result means "don't render the section" for the caller.
 */
export async function getTrendingTopics(
  domainSlugs: string[],
  repository: AnalyticsEventRepository = defaultRepository,
): Promise<TrendingTopic[]> {
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const counts = await Promise.all(
    domainSlugs.map(async (domainSlug): Promise<TrendingTopic> => {
      try {
        const count = await repository.countByEventAndDomainSince(
          "domain_classified",
          domainSlug,
          since,
        );
        return { domainSlug, count };
      } catch (error) {
        console.error(`Analytics: failed to fetch trending count for "${domainSlug}"`, error);
        return { domainSlug, count: 0 };
      }
    }),
  );

  return counts
    .filter((entry) => entry.count >= TRENDING_MIN_COUNT)
    .sort((a, b) => b.count - a.count)
    .slice(0, TRENDING_TOP_N);
}
