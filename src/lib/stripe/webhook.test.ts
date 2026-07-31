import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { STRIPE_WEBHOOK_SECRET: "whsec_test", REPORT_RETENTION_MONTHS: 12 },
}));

import { verifyWebhookSignature, processStripeEvent } from "./webhook";
import { InMemoryReportRepository } from "@/lib/reports/in-memory-report-repository";
import { InMemoryPaymentRepository } from "@/lib/payments/in-memory-payment-repository";
import { InMemoryWebhookEventRepository } from "@/lib/payments/in-memory-webhook-event-repository";
import { transitionReportStatus } from "@/lib/reports/report-service";

function checkoutCompletedEvent(overrides: {
  eventId?: string;
  sessionId?: string;
  reportId?: string;
  reportToken?: string;
  paymentIntentId?: string | null;
  email?: string;
  amountTotal?: number | null;
  currency?: string | null;
}): Stripe.Event {
  return {
    id: overrides.eventId ?? "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: overrides.sessionId ?? "cs_test_123",
        metadata: overrides.reportId
          ? { reportId: overrides.reportId, reportToken: overrides.reportToken ?? "raw-token" }
          : {},
        payment_intent: overrides.paymentIntentId ?? "pi_test_123",
        customer_details: overrides.email ? { email: overrides.email } : null,
        amount_total: overrides.amountTotal,
        currency: overrides.currency,
      },
    },
  } as unknown as Stripe.Event;
}

const FAKE_TEASER = {
  query: "q",
  searchDate: new Date().toISOString(),
  candidateCount: 10,
  duplicatesRemoved: 1,
  includedCount: 5,
  studyTypeDistribution: [],
  topStudies: [],
  confidenceLabel: "moderate" as const,
  sourcesUnavailable: [],
  filtersApplied: { maxAgeYears: null, studyTypes: null },
  excludedByFilterCount: 0,
};

const FAKE_SEARCH_STATS = {
  query: "q",
  searchDate: new Date().toISOString(),
  screeningVersion: "screening-v2",
  candidateCount: 10,
  duplicatesRemoved: 1,
  includedCount: 5,
  excludedByReason: { retracted: 0, protocol_only: 0, insufficient_detail: 0, not_relevant: 0 },
  perSource: [],
};

/** Never actually invoked by the tests below (status guards prevent a
 * second fulfillment) but always passed so a test can never accidentally
 * fall through to the real implementation, which would try a live search. */
function fakeGenerateReportContent() {
  return vi.fn().mockResolvedValue(undefined);
}

async function setUpPaidCheckoutScenario() {
  const reportRepository = new InMemoryReportRepository();
  const paymentRepository = new InMemoryPaymentRepository();
  const webhookEventRepository = new InMemoryWebhookEventRepository();

  const report = await reportRepository.create({
    tokenHash: "hash",
    originalQuestion: "q",
    locale: "de",
    domainSlug: "lernen-bildung",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS,
    previewPayload: FAKE_TEASER,
  });
  await transitionReportStatus(reportRepository, report.id, "preview_ready");
  await transitionReportStatus(reportRepository, report.id, "checkout_started", {
    stripeCheckoutSessionId: "cs_test_123",
  });
  await paymentRepository.create({
    reportId: report.id,
    stripeCheckoutSessionId: "cs_test_123",
    amountMinor: 990,
    currency: "CHF",
    priceVersion: "MVP-01",
    mode: "test",
  });

  return { reportRepository, paymentRepository, webhookEventRepository, report };
}

describe("verifyWebhookSignature", () => {
  it("delegates to the Stripe client's constructEvent with the configured webhook secret", () => {
    const constructEvent = vi.fn().mockReturnValue({ id: "evt_1" });
    const fakeClient = { webhooks: { constructEvent } };
    verifyWebhookSignature("raw-body", "sig-header", fakeClient);
    expect(constructEvent).toHaveBeenCalledWith("raw-body", "sig-header", expect.any(String));
  });
});

describe("processStripeEvent", () => {
  it("marks the report paid and the payment paid on checkout.session.completed", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();

    const result = await processStripeEvent(
      checkoutCompletedEvent({ reportId: report.id, sessionId: "cs_test_123" }),
      {
        reportRepository,
        paymentRepository,
        webhookEventRepository,
        generateReportContent: fakeGenerateReportContent(),
      },
    );

    expect(result.processed).toBe(true);
    const updatedReport = await reportRepository.findById(report.id);
    expect(updatedReport?.status).toBe("paid");
    expect(updatedReport?.stripePaymentIntentId).toBe("pi_test_123");
    // Decision #5: retention clock starts at fulfillment (12 months out).
    expect(updatedReport?.expiresAt).not.toBeNull();
    expect(new Date(updatedReport!.expiresAt!).getTime()).toBeGreaterThan(Date.now());

    const payment = await paymentRepository.findByCheckoutSessionId("cs_test_123");
    expect(payment?.status).toBe("paid");
  });

  it("records the actually-charged amount/currency from the completed session, not the list price recorded at checkout start (live bug, OPEN_RISKS.md #31)", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();

    await processStripeEvent(
      checkoutCompletedEvent({
        reportId: report.id,
        sessionId: "cs_test_123",
        amountTotal: 0,
        currency: "chf",
      }),
      {
        reportRepository,
        paymentRepository,
        webhookEventRepository,
        generateReportContent: fakeGenerateReportContent(),
      },
    );

    const payment = await paymentRepository.findByCheckoutSessionId("cs_test_123");
    expect(payment?.amountMinor).toBe(0);
    expect(payment?.currency).toBe("CHF");
  });

  it("captures the buyer's email from Stripe's customer_details and triggers report content generation with the raw token from metadata", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();
    const generateReportContent = vi.fn().mockResolvedValue(undefined);

    await processStripeEvent(
      checkoutCompletedEvent({
        reportId: report.id,
        sessionId: "cs_test_123",
        reportToken: "raw-token-xyz",
        email: "buyer@example.com",
      }),
      { reportRepository, paymentRepository, webhookEventRepository, generateReportContent },
    );

    const updatedReport = await reportRepository.findById(report.id);
    expect(updatedReport?.email).toBe("buyer@example.com");
    expect(generateReportContent).toHaveBeenCalledWith(
      { reportRepository },
      report.id,
      "raw-token-xyz",
    );
  });

  it("is idempotent: a duplicate delivery of the same event ID does not re-fulfill", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();
    const event = checkoutCompletedEvent({ reportId: report.id, sessionId: "cs_test_123" });

    const first = await processStripeEvent(event, {
      reportRepository,
      paymentRepository,
      webhookEventRepository,
      generateReportContent: fakeGenerateReportContent(),
    });
    const second = await processStripeEvent(event, {
      reportRepository,
      paymentRepository,
      webhookEventRepository,
      generateReportContent: fakeGenerateReportContent(),
    });

    expect(first.processed).toBe(true);
    expect(second.processed).toBe(false);
  });

  it("does not re-fulfill a report that is already paid, even under a different event ID (defense in depth)", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();

    await processStripeEvent(
      checkoutCompletedEvent({ eventId: "evt_1", reportId: report.id, sessionId: "cs_test_123" }),
      {
        reportRepository,
        paymentRepository,
        webhookEventRepository,
        generateReportContent: fakeGenerateReportContent(),
      },
    );

    // A different event ID (e.g. Stripe retried with a new delivery ID) but the same session/report.
    await expect(
      processStripeEvent(
        checkoutCompletedEvent({
          eventId: "evt_2",
          reportId: report.id,
          sessionId: "cs_test_123",
        }),
        {
          reportRepository,
          paymentRepository,
          webhookEventRepository,
          generateReportContent: fakeGenerateReportContent(),
        },
      ),
    ).resolves.toEqual({ processed: true });

    // Still just paid, not thrown into an invalid transition or double-counted.
    const updatedReport = await reportRepository.findById(report.id);
    expect(updatedReport?.status).toBe("paid");
  });

  it("throws if the event is missing reportId metadata rather than silently ignoring it", async () => {
    const reportRepository = new InMemoryReportRepository();
    const paymentRepository = new InMemoryPaymentRepository();
    const webhookEventRepository = new InMemoryWebhookEventRepository();

    await expect(
      processStripeEvent(checkoutCompletedEvent({}), {
        reportRepository,
        paymentRepository,
        webhookEventRepository,
      }),
    ).rejects.toThrow(/missing reportId metadata/);
  });

  it("ignores event types it doesn't handle yet, without erroring", async () => {
    const reportRepository = new InMemoryReportRepository();
    const paymentRepository = new InMemoryPaymentRepository();
    const webhookEventRepository = new InMemoryWebhookEventRepository();

    const event = { id: "evt_x", type: "customer.created", data: { object: {} } } as Stripe.Event;
    const result = await processStripeEvent(event, {
      reportRepository,
      paymentRepository,
      webhookEventRepository,
    });
    expect(result.processed).toBe(true);
  });
});
