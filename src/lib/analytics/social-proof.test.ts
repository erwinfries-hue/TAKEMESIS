import { describe, expect, it } from "vitest";
import { getAskedCountForDomain, SOCIAL_PROOF_MIN_COUNT } from "./social-proof";
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

describe("getAskedCountForDomain", () => {
  it("returns null below the display threshold", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await recordDomainClassified(repository, "lernen-bildung", SOCIAL_PROOF_MIN_COUNT - 1);
    expect(await getAskedCountForDomain("lernen-bildung", repository)).toBeNull();
  });

  it("returns the count once it reaches the threshold", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await recordDomainClassified(repository, "lernen-bildung", SOCIAL_PROOF_MIN_COUNT);
    expect(await getAskedCountForDomain("lernen-bildung", repository)).toBe(SOCIAL_PROOF_MIN_COUNT);
  });

  it("returns null (never throws) when the repository fails, e.g. Supabase unconfigured", async () => {
    const failingRepository = {
      record: async () => {},
      countByEventAndDomain: async () => {
        throw new Error("Supabase is not configured");
      },
    };
    await expect(getAskedCountForDomain("lernen-bildung", failingRepository)).resolves.toBeNull();
  });
});
