import { describe, expect, it, vi } from "vitest";
import { InMemoryPaymentRepository } from "@/lib/payments/in-memory-payment-repository";
import { InMemoryAuditLogRepository } from "./in-memory-audit-log-repository";
import type { RefundCapableStripeClient } from "@/lib/payments/refund";
import { refundPaymentAdmin, type PaymentActionDeps } from "./payment-actions";

async function setUp(): Promise<PaymentActionDeps & { paymentId: string }> {
  const paymentRepository = new InMemoryPaymentRepository();
  const auditLogRepository = new InMemoryAuditLogRepository();
  const payment = await paymentRepository.create({
    reportId: "report-1",
    stripeCheckoutSessionId: "cs_test_1",
    amountMinor: 990,
    currency: "CHF",
    priceVersion: "MVP-01",
    mode: "test",
  });
  await paymentRepository.update(payment.id, {
    stripePaymentIntentId: "pi_test_1",
    status: "paid",
  });
  return {
    paymentRepository,
    auditLogRepository,
    adminEmail: "admin@tekmesis.com",
    paymentId: payment.id,
  };
}

function fakeStripe() {
  const create = vi.fn().mockResolvedValue({ id: "re_test_1" });
  const client: RefundCapableStripeClient = { refunds: { create } };
  return { client, create };
}

describe("refundPaymentAdmin", () => {
  it("refunds via Stripe, updates the payment, and logs the admin action", async () => {
    const deps = await setUp();
    const { client, create } = fakeStripe();

    const payment = await refundPaymentAdmin(deps, deps.paymentId, client);

    expect(create).toHaveBeenCalledWith({ payment_intent: "pi_test_1" });
    expect(payment.status).toBe("refunded");

    const log = await deps.auditLogRepository.listRecent();
    expect(log[0]).toMatchObject({
      adminEmail: "admin@tekmesis.com",
      action: "refund_payment",
      targetType: "payment",
      targetId: deps.paymentId,
    });
  });
});
