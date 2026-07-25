import { describe, expect, it } from "vitest";
import { InMemoryWebhookEventRepository } from "./in-memory-webhook-event-repository";

describe("InMemoryWebhookEventRepository", () => {
  it("returns true the first time an event ID is recorded", async () => {
    const repo = new InMemoryWebhookEventRepository();
    const isNew = await repo.recordIfNew({
      id: "evt_1",
      type: "checkout.session.completed",
      reportId: null,
      payload: {},
    });
    expect(isNew).toBe(true);
  });

  it("returns false for every subsequent attempt with the same event ID (duplicate Stripe delivery)", async () => {
    const repo = new InMemoryWebhookEventRepository();
    await repo.recordIfNew({ id: "evt_1", type: "x", reportId: null, payload: {} });

    expect(await repo.recordIfNew({ id: "evt_1", type: "x", reportId: null, payload: {} })).toBe(
      false,
    );
    expect(await repo.recordIfNew({ id: "evt_1", type: "x", reportId: null, payload: {} })).toBe(
      false,
    );
  });

  it("treats different event IDs independently", async () => {
    const repo = new InMemoryWebhookEventRepository();
    expect(await repo.recordIfNew({ id: "evt_1", type: "x", reportId: null, payload: {} })).toBe(
      true,
    );
    expect(await repo.recordIfNew({ id: "evt_2", type: "x", reportId: null, payload: {} })).toBe(
      true,
    );
  });
});
