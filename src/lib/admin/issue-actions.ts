import "server-only";
import type { IssueReportRepository } from "@/lib/feedback/issue-report-repository";
import type { IssueReport } from "@/lib/feedback/types";
import type { AuditLogRepository } from "./audit-log-repository";

export interface IssueActionDeps {
  issueReportRepository: IssueReportRepository;
  auditLogRepository: AuditLogRepository;
  adminEmail: string;
}

export async function resolveIssue(deps: IssueActionDeps, issueId: string): Promise<IssueReport> {
  const issue = await deps.issueReportRepository.updateStatus(issueId, "resolved");
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "resolve_issue",
    targetType: "issue_report",
    targetId: issueId,
  });
  return issue;
}

export async function dismissIssue(deps: IssueActionDeps, issueId: string): Promise<IssueReport> {
  const issue = await deps.issueReportRepository.updateStatus(issueId, "dismissed");
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "dismiss_issue",
    targetType: "issue_report",
    targetId: issueId,
  });
  return issue;
}
