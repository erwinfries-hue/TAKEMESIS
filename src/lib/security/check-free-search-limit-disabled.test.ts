import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { RATE_LIMIT_SECRET: undefined, FREE_SEARCH_LIMIT: 5 },
}));

import { checkFreeSearchLimit } from "./check-free-search-limit";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";

describe("checkFreeSearchLimit with RATE_LIMIT_SECRET unset", () => {
  it("fails open (always allowed) rather than breaking search", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 10; i++) {
      const result = await checkFreeSearchLimit("1.2.3.4", limiter);
      expect(result.allowed).toBe(true);
    }
  });
});
