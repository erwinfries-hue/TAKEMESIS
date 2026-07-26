import { describe, expect, it } from "vitest";
import { InMemoryReportRepository } from "@/lib/reports/in-memory-report-repository";
import { transitionReportStatus } from "@/lib/reports/report-service";
import { InMemoryAuditLogRepository } from "./in-memory-audit-log-repository";
import {
  blockReport,
  markRefundPending,
  recordRefunded,
  retryReport,
  revokeReport,
  type AdminActionDeps,
} from "./report-actions";

async function setUp(): Promise<AdminActionDeps & { reportId: string }> {
  const reportRepository = new InMemoryReportRepository();
  const auditLogRepository = new InMemoryAuditLogRepository();
  const report = await reportRepository.create({
    tokenHash: "hash",
    originalQuestion: "q",
    locale: "de",
    domainSlug: "lernen-bildung",
    eligibility: "eligible",
    priceVersion: "MVP-01",
  });
  return {
    reportRepository,
    auditLogRepository,
    adminEmail: "admin@tekmesis.com",
    reportId: report.id,
  };
}

describe("revokeReport", () => {
  it("sets revokedAt without requiring a lifecycle transition", async () => {
    const deps = await setUp();
    const report = await revokeReport(deps, deps.reportId);
    expect(report.revokedAt).not.toBeNull();

    const log = await deps.auditLogRepository.listRecent();
    expect(log[0]).toMatchObject({
      adminEmail: "admin@tekmesis.com",
      action: "revoke_report",
      targetId: deps.reportId,
    });
  });
});

describe("blockReport / markRefundPending / recordRefunded", () => {
  it("blocks a report and logs the action", async () => {
    const deps = await setUp();
    const report = await blockReport(deps, deps.reportId);
    expect(report.status).toBe("blocked");
  });

  it("moves a blocked report to refund_pending, then refunded", async () => {
    const deps = await setUp();
    await blockReport(deps, deps.reportId);
    const pending = await markRefundPending(deps, deps.reportId);
    expect(pending.status).toBe("refund_pending");
    const refunded = await recordRefunded(deps, deps.reportId);
    expect(refunded.status).toBe("refunded");
  });

  it("logs every admin action taken", async () => {
    const deps = await setUp();
    await blockReport(deps, deps.reportId);
    await markRefundPending(deps, deps.reportId);
    await recordRefunded(deps, deps.reportId);
    const log = await deps.auditLogRepository.listRecent();
    expect(log.map((entry) => entry.action)).toEqual([
      "record_refunded",
      "mark_refund_pending",
      "block_report",
    ]);
  });
});

describe("retryReport", () => {
  it("moves a failed report back to processing", async () => {
    const deps = await setUp();
    await transitionReportStatus(deps.reportRepository, deps.reportId, "preview_ready");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "checkout_started");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "paid");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "processing");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "failed");

    const retried = await retryReport(deps, deps.reportId);
    expect(retried.status).toBe("processing");
  });
});
