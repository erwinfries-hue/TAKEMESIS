import { describe, expect, it } from "vitest";
import { InMemoryLearnedTermRepository } from "./in-memory-learned-term-repository";

describe("InMemoryLearnedTermRepository", () => {
  it("returns an empty map for terms never learned before", async () => {
    const repo = new InMemoryLearnedTermRepository();
    const found = await repo.findMany("fr", ["poudremagique"]);
    expect(found.size).toBe(0);
  });

  it("caches and retrieves a learned translation", async () => {
    const repo = new InMemoryLearnedTermRepository();
    await repo.upsert("fr", "poudremagique", "magic powder");

    const found = await repo.findMany("fr", ["poudremagique"]);
    expect(found.get("poudremagique")).toBe("magic powder");
  });

  it("looks up multiple terms in one call, returning only the ones actually learned", async () => {
    const repo = new InMemoryLearnedTermRepository();
    await repo.upsert("fr", "poudremagique", "magic powder");

    const found = await repo.findMany("fr", ["poudremagique", "inconnu"]);
    expect(found.size).toBe(1);
    expect(found.get("poudremagique")).toBe("magic powder");
    expect(found.has("inconnu")).toBe(false);
  });

  it("scopes lookups by locale — the same term string in a different locale is a different entry", async () => {
    const repo = new InMemoryLearnedTermRepository();
    await repo.upsert("fr", "vie", "life");

    const found = await repo.findMany("de", ["vie"]);
    expect(found.size).toBe(0);
  });

  it("overwrites the translation on a repeat upsert for the same (locale, term)", async () => {
    const repo = new InMemoryLearnedTermRepository();
    const first = await repo.upsert("fr", "poudremagique", "magic dust");
    const second = await repo.upsert("fr", "poudremagique", "magic powder");

    expect(second.id).toBe(first.id);
    const found = await repo.findMany("fr", ["poudremagique"]);
    expect(found.get("poudremagique")).toBe("magic powder");
  });
});
