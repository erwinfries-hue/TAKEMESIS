import { describe, expect, it } from "vitest";
import { InMemoryIssueReportRepository } from "./in-memory-issue-report-repository";

describe("InMemoryIssueReportRepository", () => {
  it("creates an issue report defaulting to open status", async () => {
    const repo = new InMemoryIssueReportRepository();
    const issue = await repo.create({
      reportId: "r1",
      category: "wrong_source",
      description: "A source link was broken.",
    });
    expect(issue.status).toBe("open");

    const all = await repo.listAll();
    expect(all).toEqual([issue]);
  });

  it("updates status to resolved or dismissed", async () => {
    const repo = new InMemoryIssueReportRepository();
    const issue = await repo.create({ reportId: null, category: null, description: "d" });

    const resolved = await repo.updateStatus(issue.id, "resolved");
    expect(resolved.status).toBe("resolved");

    const dismissed = await repo.updateStatus(issue.id, "dismissed");
    expect(dismissed.status).toBe("dismissed");
  });

  it("throws for an unknown issue id", async () => {
    const repo = new InMemoryIssueReportRepository();
    await expect(repo.updateStatus("missing", "resolved")).rejects.toThrow();
  });

  it("lists newest first", async () => {
    const repo = new InMemoryIssueReportRepository();
    const first = await repo.create({ reportId: null, category: null, description: "first" });
    const second = await repo.create({ reportId: null, category: null, description: "second" });
    const all = await repo.listAll();
    expect(all.map((i) => i.id)).toEqual([second.id, first.id]);
  });
});
