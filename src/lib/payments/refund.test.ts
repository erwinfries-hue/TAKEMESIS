import { describe, expect, it, vi } from "vitest";
import type { PaymentRepository } from "./payment-repository";
import type { Payment } from "./types";
import { refundPayment, RefundError, type RefundCapableStripeClient } from "./refund";

function fakePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    reportId: "report-1",
    stripeCheckoutSessionId: "cs_test_1",
    stripePaymentIntentId: "pi_test_1",
    amountMinor: 990,
    currency: "CHF",
    priceVersion: "MVP-01",
    status: "paid",
    mode: "test",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeRepository(payments: Payment[]): PaymentRepository {
  return {
    create: vi.fn(),
    findByCheckoutSessionId: vi.fn(),
    listAll: vi.fn().mockResolvedValue(payments),
    update: vi.fn(async (id, patch) => ({ ...payments.find((p) => p.id === id)!, ...patch })),
  };
}

function fakeStripe() {
  const create = vi.fn().mockResolvedValue({ id: "re_test_1" });
  const client: RefundCapableStripeClient = { refunds: { create } };
  return { client, create };
}

describe("refundPayment", () => {
  it("calls Stripe with the payment's payment intent and marks the payment refunded", async () => {
    const payment = fakePayment();
    const repository = fakeRepository([payment]);
    const { client, create } = fakeStripe();

    const result = await refundPayment("payment-1", repository, client);

    expect(create).toHaveBeenCalledWith({ payment_intent: "pi_test_1" });
    expect(repository.update).toHaveBeenCalledWith("payment-1", { status: "refunded" });
    expect(result.status).toBe("refunded");
  });

  it("throws without calling Stripe when the payment doesn't exist", async () => {
    const repository = fakeRepository([]);
    const { client, create } = fakeStripe();

    await expect(refundPayment("missing", repository, client)).rejects.toThrow(RefundError);
    expect(create).not.toHaveBeenCalled();
  });

  it("throws without calling Stripe when there's no payment intent yet", async () => {
    const payment = fakePayment({ stripePaymentIntentId: null });
    const repository = fakeRepository([payment]);
    const { client, create } = fakeStripe();

    await expect(refundPayment("payment-1", repository, client)).rejects.toThrow(RefundError);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses to double-refund an already-refunded payment", async () => {
    const payment = fakePayment({ status: "refunded" });
    const repository = fakeRepository([payment]);
    const { client, create } = fakeStripe();

    await expect(refundPayment("payment-1", repository, client)).rejects.toThrow(RefundError);
    expect(create).not.toHaveBeenCalled();
  });
});
