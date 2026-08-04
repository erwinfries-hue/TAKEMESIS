import { describe, expect, it } from "vitest";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";

describe("InMemorySubscriptionRepository", () => {
  it("returns null for an email never subscribed", async () => {
    const repo = new InMemorySubscriptionRepository();
    expect(await repo.findByEmail("nobody@example.com")).toBeNull();
  });

  it("creates and retrieves a subscription by email", async () => {
    const repo = new InMemorySubscriptionRepository();
    const created = await repo.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });

    expect(created.id).toBeTruthy();
    expect(created.lastSentAt).toBeNull();
    expect(await repo.findByEmail("a@example.com")).toEqual(created);
    expect(await repo.findById(created.id)).toEqual(created);
  });

  it("updates topicSlugs and lastSentAt", async () => {
    const repo = new InMemorySubscriptionRepository();
    const created = await repo.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });

    const updated = await repo.update(created.id, {
      topicSlugs: ["schlaf-regeneration", "ernaehrung-supplements"],
      lastSentAt: "2026-08-04T00:00:00.000Z",
    });

    expect(updated.topicSlugs).toEqual(["schlaf-regeneration", "ernaehrung-supplements"]);
    expect(updated.lastSentAt).toBe("2026-08-04T00:00:00.000Z");
    expect(updated.createdAt).toBe(created.createdAt);
  });

  it("throws when updating a subscription that does not exist", async () => {
    const repo = new InMemorySubscriptionRepository();
    await expect(repo.update("missing-id", { lastSentAt: null })).rejects.toThrow();
  });

  it("deletes a subscription", async () => {
    const repo = new InMemorySubscriptionRepository();
    const created = await repo.create({ email: "a@example.com", locale: "de", topicSlugs: ["x"] });

    await repo.delete(created.id);

    expect(await repo.findById(created.id)).toBeNull();
    expect(await repo.findByEmail("a@example.com")).toBeNull();
  });

  it("lists all subscriptions", async () => {
    const repo = new InMemorySubscriptionRepository();
    const first = await repo.create({ email: "a@example.com", locale: "de", topicSlugs: ["x"] });
    const second = await repo.create({ email: "b@example.com", locale: "en", topicSlugs: ["y"] });

    const all = await repo.listAll();

    expect(all.map((s) => s.id).sort()).toEqual([first.id, second.id].sort());
  });
});
