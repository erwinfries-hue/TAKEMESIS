import "server-only";
import { createHmac } from "node:crypto";
import { serverEnv } from "@/lib/env/server";

/**
 * Never store or key on a raw IP address (docs/12: "no unnecessary personal
 * data") — HMAC it with RATE_LIMIT_SECRET into an opaque, non-reversible
 * key. Returns null when the secret isn't configured, which callers must
 * treat as "rate limiting disabled" (fail open) rather than an error — same
 * graceful-degradation pattern as every other credential-gated feature in
 * this app.
 */
export function hashRateLimitKey(rawKey: string): string | null {
  if (!serverEnv.RATE_LIMIT_SECRET) {
    return null;
  }
  return createHmac("sha256", serverEnv.RATE_LIMIT_SECRET).update(rawKey).digest("hex");
}

/** Scopes a hashed key to the current UTC calendar day, for a fixed daily window. */
export function dailyWindowKey(hashedKey: string, now: Date = new Date()): string {
  const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${hashedKey}:${dateString}`;
}
