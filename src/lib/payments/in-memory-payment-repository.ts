import { randomUUID } from "node:crypto";
import type { PaymentRepository } from "./payment-repository";
import type { CreatePaymentInput, Payment } from "./types";

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments = new Map<string, Payment>();

  async create(input: CreatePaymentInput): Promise<Payment> {
    const now = new Date().toISOString();
    const payment: Payment = {
      id: randomUUID(),
      reportId: input.reportId,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      stripePaymentIntentId: null,
      amountMinor: input.amountMinor,
      currency: input.currency,
      priceVersion: input.priceVersion,
      status: "pending",
      mode: input.mode,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findByCheckoutSessionId(sessionId: string): Promise<Payment | null> {
    for (const payment of this.payments.values()) {
      if (payment.stripeCheckoutSessionId === sessionId) {
        return payment;
      }
    }
    return null;
  }

  async update(id: string, patch: Partial<Omit<Payment, "id" | "createdAt">>): Promise<Payment> {
    const existing = this.payments.get(id);
    if (!existing) {
      throw new Error(`Payment ${id} not found`);
    }
    const updated: Payment = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.payments.set(id, updated);
    return updated;
  }
}
