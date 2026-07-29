import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    ANTHROPIC_API_KEY: "test-key",
    AI_EXTRACTION_ENABLED: true,
    AI_MODEL: "test-model",
    AI_MAX_INPUT_CHARS: 24000,
  },
}));

import { buildSearchQuery } from "./query-translation";
import { InMemoryLearnedTermRepository } from "./learned-terms/in-memory-learned-term-repository";

describe("buildSearchQuery — AI fallback + learned-term cache (AI_EXTRACTION_ENABLED=true, mocked env)", () => {
  it("serves an already-learned term from the cache without calling the AI fallback", async () => {
    const learnedTermRepository = new InMemoryLearnedTermRepository();
    await learnedTermRepository.upsert("fr", "poudremagique", "magic powder");
    let aiCalled = false;

    const query = await buildSearchQuery(
      "Quel effet a la poudremagique sur la concentration ?",
      "fr",
      {
        learnedTermRepository,
        translateTermsWithAi: async () => {
          aiCalled = true;
          return new Map();
        },
      },
    );

    expect(query).toContain("magic powder");
    expect(aiCalled).toBe(false);
  });

  it("falls back to a live AI translation for a term unknown to both the dictionary and the cache, then persists it", async () => {
    const learnedTermRepository = new InMemoryLearnedTermRepository();

    const query = await buildSearchQuery(
      "Quel effet a la poudremagique sur la concentration ?",
      "fr",
      {
        learnedTermRepository,
        translateTermsWithAi: async (terms) => {
          expect(terms).toEqual(["poudremagique"]);
          return new Map([["poudremagique", "magic powder"]]);
        },
      },
    );

    expect(query).toContain("magic powder");
    const cached = await learnedTermRepository.findMany("fr", ["poudremagique"]);
    expect(cached.get("poudremagique")).toBe("magic powder");
  });

  it("degrades safely when the AI fallback itself fails, leaving the token untranslated", async () => {
    const learnedTermRepository = new InMemoryLearnedTermRepository();

    const query = await buildSearchQuery(
      "Quel effet a la poudremagique sur la concentration ?",
      "fr",
      {
        learnedTermRepository,
        translateTermsWithAi: async () => {
          throw new Error("AI unavailable");
        },
      },
    );

    expect(query).toContain("poudremagique");
  });

  it("degrades safely when the learned-term cache lookup itself fails, still trying the AI fallback", async () => {
    const learnedTermRepository = {
      findMany: vi.fn().mockRejectedValue(new Error("cache unavailable")),
      upsert: vi.fn().mockResolvedValue({
        id: "1",
        locale: "fr" as const,
        term: "poudremagique",
        translation: "magic powder",
        createdAt: new Date().toISOString(),
      }),
    };

    const query = await buildSearchQuery(
      "Quel effet a la poudremagique sur la concentration ?",
      "fr",
      {
        learnedTermRepository,
        translateTermsWithAi: async () => new Map([["poudremagique", "magic powder"]]),
      },
    );

    expect(query).toContain("magic powder");
  });
});
