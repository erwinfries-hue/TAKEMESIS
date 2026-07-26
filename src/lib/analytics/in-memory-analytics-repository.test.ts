import { describe, expect, it } from "vitest";
import { InMemoryAnalyticsRepository } from "./in-memory-analytics-repository";

describe("InMemoryAnalyticsRepository.countByEventAndDomain", () => {
  it("counts only events matching both the event name and the domain", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await repository.record({
      eventName: "domain_classified",
      reportId: null,
      anonymizedSessionId: null,
      metadata: { domainSlug: "lernen-bildung" },
    });
    await repository.record({
      eventName: "domain_classified",
      reportId: null,
      anonymizedSessionId: null,
      metadata: { domainSlug: "lernen-bildung" },
    });
    await repository.record({
      eventName: "domain_classified",
      reportId: null,
      anonymizedSessionId: null,
      metadata: { domainSlug: "arbeit-produktivitaet" },
    });
    await repository.record({
      eventName: "question_submitted",
      reportId: null,
      anonymizedSessionId: null,
      metadata: { domainSlug: "lernen-bildung" },
    });

    expect(await repository.countByEventAndDomain("domain_classified", "lernen-bildung")).toBe(2);
    expect(
      await repository.countByEventAndDomain("domain_classified", "arbeit-produktivitaet"),
    ).toBe(1);
    expect(await repository.countByEventAndDomain("domain_classified", "unknown-slug")).toBe(0);
  });
});
