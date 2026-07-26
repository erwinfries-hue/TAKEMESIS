import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { RATE_LIMIT_SECRET: "test-rate-limit-secret" },
}));

import { dailyWindowKey, hashRateLimitKey } from "./rate-limit-key";

describe("hashRateLimitKey", () => {
  it("hashes the same input deterministically", () => {
    expect(hashRateLimitKey("1.2.3.4")).toBe(hashRateLimitKey("1.2.3.4"));
  });

  it("never returns the raw input", () => {
    expect(hashRateLimitKey("1.2.3.4")).not.toContain("1.2.3.4");
  });

  it("produces different hashes for different inputs", () => {
    expect(hashRateLimitKey("1.2.3.4")).not.toBe(hashRateLimitKey("5.6.7.8"));
  });
});

describe("dailyWindowKey", () => {
  it("scopes the same hashed key to the same UTC day", () => {
    const hashed = "abc123";
    const morning = new Date("2026-07-26T01:00:00.000Z");
    const evening = new Date("2026-07-26T23:00:00.000Z");
    expect(dailyWindowKey(hashed, morning)).toBe(dailyWindowKey(hashed, evening));
  });

  it("produces a different key on a different UTC day", () => {
    const hashed = "abc123";
    const day1 = new Date("2026-07-26T12:00:00.000Z");
    const day2 = new Date("2026-07-27T12:00:00.000Z");
    expect(dailyWindowKey(hashed, day1)).not.toBe(dailyWindowKey(hashed, day2));
  });
});
