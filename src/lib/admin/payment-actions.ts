import "server-only";
import { refundPayment, type RefundCapableStripeClient } from "@/lib/payments/refund";
import { getStripeClient } from "@/lib/stripe/client";
import type { PaymentRepository } from "@/lib/payments/payment-repository";
import type { Payment } from "@/lib/payments/types";
import type { AuditLogRepository } from "./audit-log-repository";

export interface PaymentActionDeps {
  paymentRepository: PaymentRepository;
  auditLogRepository: AuditLogRepository;
  adminEmail: string;
}

/**
 * The one-click replacement for the old two-system flow: previously an
 * admin had to refund manually in the Stripe Dashboard, then come back
 * here just to click `recordRefundedAction` for bookkeeping. This actually
 * calls Stripe. Still admin-authenticated only — never exposed to
 * customers as self-service, since it moves real money.
 */
export async function refundPaymentAdmin(
  deps: PaymentActionDeps,
  paymentId: string,
  stripeClient: RefundCapableStripeClient = getStripeClient(),
): Promise<Payment> {
  const payment = await refundPayment(paymentId, deps.paymentRepository, stripeClient);
  await deps.auditLogRepository.record({
    adminEmail: deps.adminEmail,
    action: "refund_payment",
    targetType: "payment",
    targetId: paymentId,
  });
  return payment;
}
