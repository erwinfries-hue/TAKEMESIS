export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface RateLimiter {
  /** `key` should already be a daily-windowed, HMAC-hashed key (see rate-limit-key.ts) — this just counts. */
  consume(key: string, limit: number): Promise<RateLimitResult>;
}
