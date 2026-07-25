import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { STRIPE_WEBHOOK_SECRET: "whsec_test" },
}));

import { handleStripeWebhookRequest } from "./webhook-route-handler";
import * as webhookModule from "./webhook";
import { InMemoryReportRepository } from "@/lib/reports/in-memory-report-repository";
import { InMemoryPaymentRepository } from "@/lib/payments/in-memory-payment-repository";
import { InMemoryWebhookEventRepository } from "@/lib/payments/in-memory-webhook-event-repository";

function fakeDeps() {
  return {
    reportRepository: new InMemoryReportRepository(),
    paymentRepository: new InMemoryPaymentRepository(),
    webhookEventRepository: new InMemoryWebhookEventRepository(),
  };
}

describe("handleStripeWebhookRequest", () => {
  it("returns 400 when the stripe-signature header is missing", async () => {
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const response = await handleStripeWebhookRequest(request, fakeDeps());
    expect(response.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    vi.spyOn(webhookModule, "verifyWebhookSignature").mockImplementation(() => {
      throw new Error("bad signature");
    });

    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=bad" },
      body: "{}",
    });
    const response = await handleStripeWebhookRequest(request, fakeDeps());
    expect(response.status).toBe(400);

    vi.restoreAllMocks();
  });

  it("returns 200 and processes a valid event", async () => {
    vi.spyOn(webhookModule, "verifyWebhookSignature").mockReturnValue({
      id: "evt_1",
      type: "customer.created",
      data: { object: {} },
    } as never);

    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=good" },
      body: "{}",
    });
    const response = await handleStripeWebhookRequest(request, fakeDeps());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true, processed: true });

    vi.restoreAllMocks();
  });

  it("returns 500 when event processing throws", async () => {
    vi.spyOn(webhookModule, "verifyWebhookSignature").mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", metadata: {} } },
    } as never);

    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=good" },
      body: "{}",
    });
    const response = await handleStripeWebhookRequest(request, fakeDeps());
    expect(response.status).toBe(500);

    vi.restoreAllMocks();
  });
});
