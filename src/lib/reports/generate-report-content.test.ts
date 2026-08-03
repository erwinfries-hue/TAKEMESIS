import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { SUPPORT_EMAIL: "support@tekmesis.com" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { generateReportContent } from "./generate-report-content";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import type { SearchRunResult } from "@/lib/search/run-search";
import type { EligibilityAssessment } from "@/lib/eligibility/eligibility";

const FAKE_SEARCH_STATS = {
  query: "q",
  searchDate: new Date().toISOString(),
  screeningVersion: "screening-v2",
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
  perSource: [],
};

const FAKE_TEASER = {
  query: "q",
  searchDate: new Date().toISOString(),
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  studyTypeDistribution: [],
  topStudies: [],
  confidenceLabel: "moderate" as const,
  sourcesUnavailable: [],
  filtersApplied: { maxAgeYears: null, studyTypes: null, studyRegions: null },
  excludedByFilterCount: 0,
};

async function setUpPaidReport() {
  const reportRepository = new InMemoryReportRepository();
  const report = await reportRepository.create({
    tokenHash: "hash",
    originalQuestion: "Hilft Kreatin beim Muskelaufbau?",
    locale: "de",
    domainSlug: "fitness-leistungsfaehigkeit",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS,
    previewPayload: FAKE_TEASER,
  });
  await transitionReportStatus(reportRepository, report.id, "preview_ready");
  await transitionReportStatus(reportRepository, report.id, "checkout_started");
  await transitionReportStatus(reportRepository, report.id, "paid", { email: "buyer@example.com" });
  return { reportRepository, report };
}

const FAKE_SEARCH_RESULT: SearchRunResult = {
  query: "kreatin muskelaufbau",
  topicSlug: "fitness-leistungsfaehigkeit",
  searchDate: new Date().toISOString(),
  screeningVersion: "screening-v2",
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
  filtersApplied: { maxAgeYears: null, studyTypes: null, studyRegions: null },
  excludedByFilterCount: 0,
  perSource: [{ source: "openalex", ok: true, recordCount: 1 }],
  rankedIncluded: [],
  detailed: [],
};

const FAKE_ELIGIBILITY: EligibilityAssessment = {
  status: "eligible",
  includedCount: 5,
  resultBearingCount: 5,
  reviewOrMetaCount: 0,
  estimatedReportDepthSections: 9,
};

describe("generateReportContent", () => {
  it("builds the report and transitions paid → processing → ready", async () => {
    const { reportRepository, report } = await setUpPaidReport();
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    await generateReportContent(
      {
        reportRepository,
        runSearch: vi.fn().mockResolvedValue(FAKE_SEARCH_RESULT),
        assessEligibility: vi.fn().mockReturnValue(FAKE_ELIGIBILITY),
        enrichPremiumReportWithAi: vi.fn().mockImplementation(async ({ report: baseReport }) => baseReport),
        sendEmail,
        reportUrlFor: (token) => `https://tekmesis.com/report/${token}`,
      },
      report.id,
      "raw-token-123",
    );

    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("ready");
    expect(updated?.finalPayload).not.toBeNull();
    expect(updated?.reportVersion).toBe("premium-v1");
  });

  it("emails the buyer the report link once ready", async () => {
    const { reportRepository, report } = await setUpPaidReport();
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    await generateReportContent(
      {
        reportRepository,
        runSearch: vi.fn().mockResolvedValue(FAKE_SEARCH_RESULT),
        assessEligibility: vi.fn().mockReturnValue(FAKE_ELIGIBILITY),
        enrichPremiumReportWithAi: vi.fn().mockImplementation(async ({ report: baseReport }) => baseReport),
        sendEmail,
        reportUrlFor: (token) => `https://tekmesis.com/report/${token}`,
      },
      report.id,
      "raw-token-123",
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.com",
        content: expect.objectContaining({ subject: expect.any(String) }),
      }),
    );
  });

  it("records confirmationEmailSentAt once the email is sent, so the resend sweep never double-sends", async () => {
    const { reportRepository, report } = await setUpPaidReport();

    await generateReportContent(
      {
        reportRepository,
        runSearch: vi.fn().mockResolvedValue(FAKE_SEARCH_RESULT),
        assessEligibility: vi.fn().mockReturnValue(FAKE_ELIGIBILITY),
        enrichPremiumReportWithAi: vi.fn().mockImplementation(async ({ report: baseReport }) => baseReport),
        sendEmail: vi.fn().mockResolvedValue(undefined),
        reportUrlFor: (token) => `https://tekmesis.com/report/${token}`,
      },
      report.id,
      "raw-token-123",
    );

    const updated = await reportRepository.findById(report.id);
    expect(updated?.confirmationEmailSentAt).not.toBeNull();
  });

  it("leaves confirmationEmailSentAt unset when the email send itself fails", async () => {
    const { reportRepository, report } = await setUpPaidReport();

    await generateReportContent(
      {
        reportRepository,
        runSearch: vi.fn().mockResolvedValue(FAKE_SEARCH_RESULT),
        assessEligibility: vi.fn().mockReturnValue(FAKE_ELIGIBILITY),
        enrichPremiumReportWithAi: vi.fn().mockImplementation(async ({ report: baseReport }) => baseReport),
        sendEmail: vi.fn().mockRejectedValue(new Error("resend API down")),
        reportUrlFor: (token) => `https://tekmesis.com/report/${token}`,
      },
      report.id,
      "raw-token-123",
    );

    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("ready");
    expect(updated?.confirmationEmailSentAt).toBeNull();
  });

  it("transitions to failed (not stuck in processing) when the search throws, and never fabricates a report", async () => {
    const { reportRepository, report } = await setUpPaidReport();

    await generateReportContent(
      {
        reportRepository,
        runSearch: vi.fn().mockRejectedValue(new Error("all sources unreachable")),
        sendEmail: vi.fn().mockResolvedValue(undefined),
      },
      report.id,
      "raw-token-123",
    );

    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.finalPayload).toBeNull();
    expect(updated?.failureCode).toBe("generation_failed");
  });

  it("does not throw even if the report has no domainSlug — fails the report instead", async () => {
    const reportRepository = new InMemoryReportRepository();
    const report = await reportRepository.create({
      tokenHash: "hash",
      originalQuestion: "q",
      locale: "de",
      // @ts-expect-error — domainSlug is required by the type but the DB column is nullable; this exercises the defensive runtime check.
      domainSlug: null,
      sourceRoute: null,
      eligibility: "eligible",
      priceVersion: "MVP-01",
      searchStats: FAKE_SEARCH_STATS,
      previewPayload: FAKE_TEASER,
    });
    await transitionReportStatus(reportRepository, report.id, "preview_ready");
    await transitionReportStatus(reportRepository, report.id, "checkout_started");
    await transitionReportStatus(reportRepository, report.id, "paid");

    await expect(
      generateReportContent({ reportRepository, sendEmail: vi.fn() }, report.id, null),
    ).resolves.toBeUndefined();

    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("failed");
  });
});
