import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_ANALYTICS_ENABLED: false, NEXT_PUBLIC_ANALYTICS_SITE_ID: undefined },
}));

import { track } from "./track";
import { InMemoryAnalyticsRepository } from "./in-memory-analytics-repository";

describe("track", () => {
  it("records a sanitized event to the repository", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await track(
      {
        eventName: "eligible",
        reportId: "report-1",
        metadata: { topicSlug: "lernen-bildung", question: "should never appear" },
      },
      repository,
    );

    expect(repository.events).toHaveLength(1);
    expect(repository.events[0]).toEqual({
      eventName: "eligible",
      reportId: "report-1",
      anonymizedSessionId: null,
      metadata: { topicSlug: "lernen-bildung" },
    });
  });

  it("does not throw when PostHog is disabled (safe no-op forwarding)", async () => {
    const repository = new InMemoryAnalyticsRepository();
    await expect(track({ eventName: "landing_viewed" }, repository)).resolves.toBeUndefined();
  });

  it("does not throw when the repository fails (e.g. Supabase unconfigured) — a page must never break because analytics failed", async () => {
    const failingRepository = {
      record: vi.fn().mockRejectedValue(new Error("Supabase is not configured")),
      countByEventAndDomain: vi.fn(),
      countByEventAndDomainSince: vi.fn(),
    };
    await expect(
      track({ eventName: "domain_classified" }, failingRepository),
    ).resolves.toBeUndefined();
    expect(failingRepository.record).toHaveBeenCalledOnce();
  });
});
