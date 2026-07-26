import "server-only";
import { serverEnv } from "@/lib/env/server";
import { dailyWindowKey, hashRateLimitKey } from "./rate-limit-key";
import { getRateLimiter } from "./get-rate-limiter";
import type { RateLimiter } from "./rate-limiter";

export interface FreeSearchLimitResult {
  allowed: boolean;
}

/**
 * Decision #7: FREE_SEARCH_LIMIT (default 5) per IP per UTC day, checked
 * right before the costly step (a real multi-adapter search), not before
 * the free/local classification step.
 */
export async function checkFreeSearchLimit(
  rawIdentifier: string,
  rateLimiter: RateLimiter = getRateLimiter(),
): Promise<FreeSearchLimitResult> {
  const hashed = hashRateLimitKey(rawIdentifier);
  if (!hashed) {
    // RATE_LIMIT_SECRET not configured — fail open rather than break search.
    return { allowed: true };
  }
  const key = dailyWindowKey(hashed);
  const result = await rateLimiter.consume(key, serverEnv.FREE_SEARCH_LIMIT);
  return { allowed: result.allowed };
}
