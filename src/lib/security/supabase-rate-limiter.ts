import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { RateLimiter, RateLimitResult } from "./rate-limiter";

/**
 * Untested against a live database — see the same note in
 * supabase-report-repository.ts. Correct for serverless/multi-instance
 * deployment (unlike InMemoryRateLimiter), at the cost of two round trips
 * per check (read-then-write, not a single atomic increment) — an
 * acceptable, documented race-condition window at closed-beta traffic
 * levels (decision #15), not appropriate to leave as-is at higher volume.
 */
export class SupabaseRateLimiter implements RateLimiter {
  async consume(key: string, limit: number): Promise<RateLimitResult> {
    const client = getSupabaseClient();
    const now = new Date();

    const { data: existing, error: selectError } = await client
      .from("rate_limit_counters")
      .select()
      .eq("key", key)
      .maybeSingle();
    if (selectError) throw selectError;

    const currentCount = (existing?.count as number | undefined) ?? 0;
    if (currentCount >= limit) {
      return { allowed: false, remaining: 0 };
    }

    const nextCount = currentCount + 1;
    const { error: upsertError } = await client.from("rate_limit_counters").upsert({
      key,
      window_start: now.toISOString(),
      count: nextCount,
      updated_at: now.toISOString(),
    });
    if (upsertError) throw upsertError;

    return { allowed: true, remaining: limit - nextCount };
  }
}
