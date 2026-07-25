import type { CreatePaymentInput, Payment } from "./types";

export interface PaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>;
  findByCheckoutSessionId(sessionId: string): Promise<Payment | null>;
  update(id: string, patch: Partial<Omit<Payment, "id" | "createdAt">>): Promise<Payment>;
}
