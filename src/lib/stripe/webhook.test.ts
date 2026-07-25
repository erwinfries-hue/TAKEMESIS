import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
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
  paymentIntentId?: string | null;
}): Stripe.Event {
  return {
    id: overrides.eventId ?? "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: overrides.sessionId ?? "cs_test_123",
        metadata: overrides.reportId ? { reportId: overrides.reportId } : {},
        payment_intent: overrides.paymentIntentId ?? "pi_test_123",
      },
    },
  } as unknown as Stripe.Event;
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
    eligibility: "eligible",
    priceVersion: "MVP-01",
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
      { reportRepository, paymentRepository, webhookEventRepository },
    );

    expect(result.processed).toBe(true);
    const updatedReport = await reportRepository.findById(report.id);
    expect(updatedReport?.status).toBe("paid");
    expect(updatedReport?.stripePaymentIntentId).toBe("pi_test_123");

    const payment = await paymentRepository.findByCheckoutSessionId("cs_test_123");
    expect(payment?.status).toBe("paid");
  });

  it("is idempotent: a duplicate delivery of the same event ID does not re-fulfill", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();
    const event = checkoutCompletedEvent({ reportId: report.id, sessionId: "cs_test_123" });

    const first = await processStripeEvent(event, {
      reportRepository,
      paymentRepository,
      webhookEventRepository,
    });
    const second = await processStripeEvent(event, {
      reportRepository,
      paymentRepository,
      webhookEventRepository,
    });

    expect(first.processed).toBe(true);
    expect(second.processed).toBe(false);
  });

  it("does not re-fulfill a report that is already paid, even under a different event ID (defense in depth)", async () => {
    const { reportRepository, paymentRepository, webhookEventRepository, report } =
      await setUpPaidCheckoutScenario();

    await processStripeEvent(
      checkoutCompletedEvent({ eventId: "evt_1", reportId: report.id, sessionId: "cs_test_123" }),
      { reportRepository, paymentRepository, webhookEventRepository },
    );

    // A different event ID (e.g. Stripe retried with a new delivery ID) but the same session/report.
    await expect(
      processStripeEvent(
        checkoutCompletedEvent({
          eventId: "evt_2",
          reportId: report.id,
          sessionId: "cs_test_123",
        }),
        { reportRepository, paymentRepository, webhookEventRepository },
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
