import type { RateLimiter, RateLimitResult } from "./rate-limiter";

/**
 * Real, functional rate limiting for a single persistent process (local
 * dev, or `next start` on one long-lived server) — but note this does NOT
 * work correctly across multiple stateless serverless instances (e.g.
 * Vercel functions), since each instance has its own memory. That's what
 * SupabaseRateLimiter is for; see get-rate-limiter.ts for the selection
 * logic and docs/OPEN_RISKS.md for the live-validation status.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly counts = new Map<string, number>();

  async consume(key: string, limit: number): Promise<RateLimitResult> {
    const current = this.counts.get(key) ?? 0;
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    const next = current + 1;
    this.counts.set(key, next);
    return { allowed: true, remaining: limit - next };
  }
}
