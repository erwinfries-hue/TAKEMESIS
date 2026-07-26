import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { RATE_LIMIT_SECRET: "test-secret", FREE_SEARCH_LIMIT: 5 },
}));

import { checkFreeSearchLimit } from "./check-free-search-limit";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";

describe("checkFreeSearchLimit", () => {
  it("allows up to FREE_SEARCH_LIMIT searches for the same identifier", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      const result = await checkFreeSearchLimit("1.2.3.4", limiter);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 6th search from the same identifier on the same day", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      await checkFreeSearchLimit("1.2.3.4", limiter);
    }
    const result = await checkFreeSearchLimit("1.2.3.4", limiter);
    expect(result.allowed).toBe(false);
  });

  it("tracks different identifiers independently", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      await checkFreeSearchLimit("1.2.3.4", limiter);
    }
    const result = await checkFreeSearchLimit("5.6.7.8", limiter);
    expect(result.allowed).toBe(true);
  });
});
