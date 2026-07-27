import "server-only";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import type { PaymentRepository } from "./payment-repository";
import type { Payment } from "./types";

/** Minimal slice of the Stripe SDK this module needs — same testable-client pattern as CheckoutCapableStripeClient. */
export interface RefundCapableStripeClient {
  refunds: {
    create(params: Stripe.RefundCreateParams): Promise<Stripe.Refund>;
  };
}

export class RefundError extends Error {}

/**
 * Actually calls Stripe to issue the refund — this is the piece the
 * pre-existing admin `recordRefunded` action never did (it only ever
 * flipped the Report's internal status, on the assumption an admin had
 * already refunded manually in the Stripe Dashboard). This collapses that
 * two-step, two-system process into one admin-authenticated action;
 * customers never get a self-service refund endpoint.
 */
export async function refundPayment(
  paymentId: string,
  paymentRepository: PaymentRepository,
  stripeClient: RefundCapableStripeClient = getStripeClient(),
): Promise<Payment> {
  const payments = await paymentRepository.listAll();
  const payment = payments.find((p) => p.id === paymentId);
  if (!payment) {
    throw new RefundError(`No payment found with id ${paymentId}`);
  }
  if (!payment.stripePaymentIntentId) {
    throw new RefundError(
      `Payment ${paymentId} has no Stripe payment intent yet — it may not be fully captured.`,
    );
  }
  if (payment.status === "refunded") {
    throw new RefundError(`Payment ${paymentId} was already refunded.`);
  }

  await stripeClient.refunds.create({ payment_intent: payment.stripePaymentIntentId });

  return paymentRepository.update(paymentId, { status: "refunded" });
}
