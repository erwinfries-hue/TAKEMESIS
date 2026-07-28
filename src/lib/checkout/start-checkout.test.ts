import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pricing/price-config", () => ({
  getPriceConfig: () => ({ amountMinor: 990, currency: "CHF", version: "MVP-01" }),
}));

import { startCheckoutForReport, ReportNotCheckoutableError } from "./start-checkout";
import { InMemoryReportRepository } from "@/lib/reports/in-memory-report-repository";
import { transitionReportStatus } from "@/lib/reports/report-service";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "@/lib/reports/report-test-fixtures";

async function setUpPreviewReadyReport() {
  const reportRepository = new InMemoryReportRepository();
  const report = await reportRepository.create({
    tokenHash: "hash",
    originalQuestion: "q",
    locale: "de",
    domainSlug: "lernen-bildung",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS_FIXTURE,
    previewPayload: FAKE_TEASER_FIXTURE,
  });
  await transitionReportStatus(reportRepository, report.id, "preview_ready");
  return { reportRepository, report };
}

describe("startCheckoutForReport", () => {
  it("creates a Stripe Checkout session, moves the report to checkout_started, and returns the session URL", async () => {
    const { reportRepository, report } = await setUpPreviewReadyReport();
    const createCheckoutSession = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/cs_test_123",
    });

    const result = await startCheckoutForReport(
      { reportRepository, createCheckoutSession },
      report.id,
      "raw-token",
    );

    expect(result.url).toBe("https://checkout.stripe.com/cs_test_123");
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: report.id,
        reportToken: "raw-token",
        priceVersion: "MVP-01",
        amountMinor: 990,
        currency: "CHF",
        locale: "de",
      }),
    );
    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("checkout_started");
    expect(updated?.stripeCheckoutSessionId).toBe("cs_test_123");
  });

  it("allows retrying checkout when already checkout_started (abandoned Stripe page) without an invalid lifecycle transition", async () => {
    const { reportRepository, report } = await setUpPreviewReadyReport();
    const createCheckoutSession = vi.fn().mockResolvedValue({
      id: "cs_test_first",
      url: "https://checkout.stripe.com/cs_test_first",
    });
    await startCheckoutForReport({ reportRepository, createCheckoutSession }, report.id, "raw-token");

    const retryCreateSession = vi.fn().mockResolvedValue({
      id: "cs_test_second",
      url: "https://checkout.stripe.com/cs_test_second",
    });
    const result = await startCheckoutForReport(
      { reportRepository, createCheckoutSession: retryCreateSession },
      report.id,
      "raw-token",
    );

    expect(result.url).toBe("https://checkout.stripe.com/cs_test_second");
    const updated = await reportRepository.findById(report.id);
    expect(updated?.status).toBe("checkout_started");
    expect(updated?.stripeCheckoutSessionId).toBe("cs_test_second");
  });

  it("refuses to start checkout for a report that's already paid", async () => {
    const { reportRepository, report } = await setUpPreviewReadyReport();
    await transitionReportStatus(reportRepository, report.id, "checkout_started");
    await transitionReportStatus(reportRepository, report.id, "paid");

    await expect(
      startCheckoutForReport(
        { reportRepository, createCheckoutSession: vi.fn() },
        report.id,
        "raw-token",
      ),
    ).rejects.toThrow(ReportNotCheckoutableError);
  });

  it("throws if the report does not exist", async () => {
    const reportRepository = new InMemoryReportRepository();
    await expect(
      startCheckoutForReport(
        { reportRepository, createCheckoutSession: vi.fn() },
        "missing-id",
        "raw-token",
      ),
    ).rejects.toThrow(/not found/);
  });
});
