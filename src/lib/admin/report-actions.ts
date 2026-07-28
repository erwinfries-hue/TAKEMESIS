import "server-only";
import { transitionReportStatus } from "@/lib/reports/report-service";
import type { ReportRepository } from "@/lib/reports/report-repository";
import type { Report } from "@/lib/reports/types";
import { generateReportToken } from "@/lib/reports/token";
import {
  generateReportContent as defaultGenerateReportContent,
  type GenerateReportContentDeps,
} from "@/lib/reports/generate-report-content";
import type { AuditLogRepository } from "./audit-log-repository";

export interface AdminActionDeps {
  reportRepository: ReportRepository;
  auditLogRepository: AuditLogRepository;
  adminEmail: string;
}

/** Link revocation is a flag independent of lifecycle status — a report can be revoked regardless of what state it's in, same self-revoke mechanic decision #6 gives the buyer, exposed here for admin use (e.g. abuse reports). */
export async function revokeReport(deps: AdminActionDeps, reportId: string): Promise<Report> {
  const report = await deps.reportRepository.update(reportId, {
    revokedAt: new Date().toISOString(),
  });
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "revoke_report",
    targetType: "report",
    targetId: reportId,
  });
  return report;
}

export async function blockReport(deps: AdminActionDeps, reportId: string): Promise<Report> {
  const report = await transitionReportStatus(deps.reportRepository, reportId, "blocked");
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "block_report",
    targetType: "report",
    targetId: reportId,
  });
  return report;
}

export async function markRefundPending(deps: AdminActionDeps, reportId: string): Promise<Report> {
  const report = await transitionReportStatus(deps.reportRepository, reportId, "refund_pending");
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "mark_refund_pending",
    targetType: "report",
    targetId: reportId,
  });
  return report;
}

export async function recordRefunded(deps: AdminActionDeps, reportId: string): Promise<Report> {
  const report = await transitionReportStatus(deps.reportRepository, reportId, "refunded");
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "record_refunded",
    targetType: "report",
    targetId: reportId,
  });
  return report;
}

/**
 * A "failed" report was never successfully emailed a working link (that
 * only happens once generation reaches "ready"), so it's safe — and
 * necessary, since the original raw token was never persisted anywhere —
 * to mint a fresh token here rather than trying to recover the old one.
 */
export async function retryReport(
  deps: AdminActionDeps,
  reportId: string,
  generateContent: (
    contentDeps: GenerateReportContentDeps,
    id: string,
    token: string | null,
  ) => Promise<void> = defaultGenerateReportContent,
): Promise<Report> {
  const { token, tokenHash } = generateReportToken();
  await deps.reportRepository.update(reportId, { tokenHash });
  await generateContent({ reportRepository: deps.reportRepository }, reportId, token);
  const report = await deps.reportRepository.findById(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found after retry`);
  }
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "retry_report",
    targetType: "report",
    targetId: reportId,
  });
  return report;
}
