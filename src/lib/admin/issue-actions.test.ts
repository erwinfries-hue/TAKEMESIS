import { describe, expect, it } from "vitest";
import { InMemoryIssueReportRepository } from "@/lib/feedback/in-memory-issue-report-repository";
import { InMemoryAuditLogRepository } from "./in-memory-audit-log-repository";
import { dismissIssue, resolveIssue, type IssueActionDeps } from "./issue-actions";

async function setUp(): Promise<IssueActionDeps & { issueId: string }> {
  const issueReportRepository = new InMemoryIssueReportRepository();
  const auditLogRepository = new InMemoryAuditLogRepository();
  const issue = await issueReportRepository.create({
    reportId: null,
    category: "other",
    description: "Something looked wrong.",
  });
  return {
    issueReportRepository,
    auditLogRepository,
    adminEmail: "admin@tekmesis.com",
    issueId: issue.id,
  };
}

describe("resolveIssue", () => {
  it("marks the issue resolved and logs the action", async () => {
    const deps = await setUp();
    const issue = await resolveIssue(deps, deps.issueId);
    expect(issue.status).toBe("resolved");

    const log = await deps.auditLogRepository.listRecent();
    expect(log[0]).toMatchObject({
      adminEmail: "admin@tekmesis.com",
      action: "resolve_issue",
      targetId: deps.issueId,
    });
  });
});

describe("dismissIssue", () => {
  it("marks the issue dismissed and logs the action", async () => {
    const deps = await setUp();
    const issue = await dismissIssue(deps, deps.issueId);
    expect(issue.status).toBe("dismissed");

    const log = await deps.auditLogRepository.listRecent();
    expect(log[0]).toMatchObject({ action: "dismiss_issue", targetId: deps.issueId });
  });
});
