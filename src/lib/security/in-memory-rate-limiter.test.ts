import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./in-memory-rate-limiter";

describe("InMemoryRateLimiter", () => {
  it("allows requests up to the limit", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      const result = await limiter.consume("key-a", 5);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the request that would exceed the limit", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      await limiter.consume("key-b", 5);
    }
    const sixth = await limiter.consume("key-b", 5);
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    const limiter = new InMemoryRateLimiter();
    for (let i = 0; i < 5; i++) {
      await limiter.consume("key-c", 5);
    }
    const otherKey = await limiter.consume("key-d", 5);
    expect(otherKey.allowed).toBe(true);
  });

  it("reports remaining count correctly", async () => {
    const limiter = new InMemoryRateLimiter();
    const first = await limiter.consume("key-e", 3);
    expect(first.remaining).toBe(2);
    const second = await limiter.consume("key-e", 3);
    expect(second.remaining).toBe(1);
  });
});
