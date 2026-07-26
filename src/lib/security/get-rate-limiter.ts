import "server-only";
import { serverEnv } from "@/lib/env/server";
import type { RateLimiter } from "./rate-limiter";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";
import { SupabaseRateLimiter } from "./supabase-rate-limiter";

// Module-level singletons: the in-memory limiter must persist counts across
// requests within the same process, and there's no need to reconstruct the
// Supabase-backed one per call either.
const inMemoryLimiter = new InMemoryRateLimiter();
const supabaseLimiter = new SupabaseRateLimiter();

/**
 * Prefers the Supabase-backed limiter (correct under serverless/multi-
 * instance deployment) once it's configured; falls back to the in-memory
 * one otherwise, which still gives real protection for a single persistent
 * process (local dev, `next start`) rather than no rate limiting at all.
 */
export function getRateLimiter(): RateLimiter {
  if (serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseLimiter;
  }
  return inMemoryLimiter;
}
