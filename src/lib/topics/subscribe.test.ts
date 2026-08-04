import { describe, expect, it } from "vitest";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";
import { normalizeSubscriptionEmail, subscribeToTopicDigest } from "./subscribe";

describe("subscribeToTopicDigest", () => {
  it("creates a new subscription for a first-time email", async () => {
    const repository = new InMemorySubscriptionRepository();

    const subscription = await subscribeToTopicDigest(
      { email: "A@Example.com", locale: "de", topicSlug: "schlaf-regeneration" },
      repository,
    );

    expect(subscription.email).toBe("a@example.com");
    expect(subscription.topicSlugs).toEqual(["schlaf-regeneration"]);
  });

  it("merges a second topic into the existing subscription for the same email", async () => {
    const repository = new InMemorySubscriptionRepository();
    const first = await subscribeToTopicDigest(
      { email: "a@example.com", locale: "de", topicSlug: "schlaf-regeneration" },
      repository,
    );

    const merged = await subscribeToTopicDigest(
      { email: "a@example.com", locale: "de", topicSlug: "ernaehrung-supplements" },
      repository,
    );

    expect(merged.id).toBe(first.id);
    expect(merged.topicSlugs).toEqual(["schlaf-regeneration", "ernaehrung-supplements"]);
    expect(await repository.listAll()).toHaveLength(1);
  });

  it("is idempotent when re-subscribing to the same topic", async () => {
    const repository = new InMemorySubscriptionRepository();
    await subscribeToTopicDigest(
      { email: "a@example.com", locale: "de", topicSlug: "schlaf-regeneration" },
      repository,
    );

    const again = await subscribeToTopicDigest(
      { email: "a@example.com", locale: "de", topicSlug: "schlaf-regeneration" },
      repository,
    );

    expect(again.topicSlugs).toEqual(["schlaf-regeneration"]);
  });

  it("treats different-case and whitespace-padded emails as the same subscriber", async () => {
    const repository = new InMemorySubscriptionRepository();
    await subscribeToTopicDigest(
      { email: " a@example.com ", locale: "de", topicSlug: "schlaf-regeneration" },
      repository,
    );

    const merged = await subscribeToTopicDigest(
      { email: "A@EXAMPLE.COM", locale: "de", topicSlug: "ernaehrung-supplements" },
      repository,
    );

    expect(merged.topicSlugs).toEqual(["schlaf-regeneration", "ernaehrung-supplements"]);
    expect(await repository.listAll()).toHaveLength(1);
  });
});

describe("normalizeSubscriptionEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeSubscriptionEmail(" A@Example.COM ")).toBe("a@example.com");
  });
});
