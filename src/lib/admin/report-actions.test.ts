import { describe, expect, it, vi } from "vitest";
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
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: {
      query: "q",
      searchDate: new Date().toISOString(),
      screeningVersion: "screening-v2",
      candidateCount: 10,
      duplicatesRemoved: 1,
      includedCount: 5,
      excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
      perSource: [],
    },
    previewPayload: {
      query: "q",
      searchDate: new Date().toISOString(),
      candidateCount: 10,
      duplicatesRemoved: 1,
      includedCount: 5,
      studyTypeDistribution: [],
      topStudies: [],
      confidenceLabel: "moderate",
      sourcesUnavailable: [],
      filtersApplied: { maxAgeYears: null, studyTypes: null },
      excludedByFilterCount: 0,
    },
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
  it("rotates the report token, hands off to content generation, and logs the action", async () => {
    const deps = await setUp();
    await transitionReportStatus(deps.reportRepository, deps.reportId, "preview_ready");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "checkout_started");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "paid");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "processing");
    await transitionReportStatus(deps.reportRepository, deps.reportId, "failed");

    const before = await deps.reportRepository.findById(deps.reportId);

    // A fake standing in for generateReportContent — a failed report was
    // never emailed a working link, so retryReport must mint a fresh token
    // before calling this, and this fake performs the failed → processing →
    // ready transitions the real implementation would do.
    const generateContent = vi.fn(async (contentDeps, reportId, token) => {
      expect(token).toEqual(expect.any(String));
      await transitionReportStatus(contentDeps.reportRepository, reportId, "processing");
      await transitionReportStatus(contentDeps.reportRepository, reportId, "ready", {
        reportVersion: "premium-v1",
      });
    });

    const retried = await retryReport(deps, deps.reportId, generateContent);

    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(retried.status).toBe("ready");
    expect(retried.tokenHash).not.toBe(before?.tokenHash);

    const log = await deps.auditLogRepository.listRecent();
    expect(log[0]).toMatchObject({
      adminEmail: "admin@tekmesis.com",
      action: "retry_report",
      targetId: deps.reportId,
    });
  });
});
