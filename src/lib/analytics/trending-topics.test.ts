import { describe, expect, it } from "vitest";
import { getTrendingTopics, TRENDING_MIN_COUNT } from "./trending-topics";
import { InMemoryAnalyticsRepository } from "./in-memory-analytics-repository";

async function recordDomainClassified(
  repository: InMemoryAnalyticsRepository,
  domainSlug: string,
  times: number,
) {
  for (let i = 0; i < times; i++) {
    await repository.record({
      eventName: "domain_classified",
      reportId: null,
      anonymizedSessionId: null,
      metadata: { domainSlug },
    });
  }
}

describe("getTrendingTopics", () => {
  it("excludes domains below the minimum count", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await recordDomainClassified(repository, "lernen-bildung", TRENDING_MIN_COUNT - 1);

    const result = await getTrendingTopics(["lernen-bildung"], repository);
    expect(result).toEqual([]);
  });

  it("ranks qualifying domains by count, descending", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await recordDomainClassified(repository, "lernen-bildung", 5);
    await recordDomainClassified(repository, "arbeit-produktivitaet", 8);
    await recordDomainClassified(repository, "schlaf-regeneration", 3);

    const result = await getTrendingTopics(
      ["lernen-bildung", "arbeit-produktivitaet", "schlaf-regeneration"],
      repository,
    );

    expect(result).toEqual([
      { domainSlug: "arbeit-produktivitaet", count: 8 },
      { domainSlug: "lernen-bildung", count: 5 },
      { domainSlug: "schlaf-regeneration", count: 3 },
    ]);
  });

  it("caps results at TRENDING_TOP_N", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const slugs = ["a", "b", "c", "d", "e"];
    for (const slug of slugs) {
      await recordDomainClassified(repository, slug, TRENDING_MIN_COUNT + 1);
    }

    const result = await getTrendingTopics(slugs, repository);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("never throws when the repository fails, e.g. Supabase unconfigured", async () => {
    const failingRepository = {
      record: async () => {},
      countByEventAndDomain: async () => 0,
      countByEventAndDomainSince: async () => {
        throw new Error("Supabase is not configured");
      },
    };
    await expect(getTrendingTopics(["lernen-bildung"], failingRepository)).resolves.toEqual([]);
  });
});
