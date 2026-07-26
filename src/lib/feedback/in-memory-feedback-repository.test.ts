import { describe, expect, it } from "vitest";
import { InMemoryFeedbackRepository } from "./in-memory-feedback-repository";

describe("InMemoryFeedbackRepository", () => {
  it("creates and lists feedback entries, newest first", async () => {
    const repo = new InMemoryFeedbackRepository();
    await repo.create({ reportId: "r1", rating: 4, comment: "Helpful" });
    await repo.create({ reportId: null, rating: 2, comment: null });

    const all = await repo.listAll();
    expect(all).toHaveLength(2);
    expect(all[0].comment).toBeNull();
    expect(all[1].comment).toBe("Helpful");
  });
});
