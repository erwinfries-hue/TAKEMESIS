import "server-only";
import type Stripe from "stripe";
import { getStripeClient } from "./client";
import { serverEnv } from "@/lib/env/server";
import { transitionReportStatus } from "@/lib/reports/report-service";
import { computeReportExpiry } from "@/lib/reports/retention";
import {
  generateReportContent as defaultGenerateReportContent,
  type GenerateReportContentDeps,
} from "@/lib/reports/generate-report-content";
import type { ReportRepository } from "@/lib/reports/report-repository";
import type { PaymentRepository } from "@/lib/payments/payment-repository";
import type { WebhookEventRepository } from "@/lib/payments/webhook-event-repository";

export interface SignatureVerifyingStripeClient {
  webhooks: Pick<Stripe["webhooks"], "constructEvent">;
}

/**
 * Verifies the raw request body against the Stripe-Signature header
 * (docs/09: "verified webhook"). Callers MUST pass the untouched raw
 * request body — Next.js route handlers get this via `request.text()`
 * before any JSON parsing, since Stripe signs the exact bytes sent.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string,
  stripeClient: SignatureVerifyingStripeClient = getStripeClient(),
): Stripe.Event {
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured: STRIPE_WEBHOOK_SECRET must be set.");
  }
  return stripeClient.webhooks.constructEvent(
    payload,
    signatureHeader,
    serverEnv.STRIPE_WEBHOOK_SECRET,
  );
}

export interface FulfillmentDeps {
  reportRepository: ReportRepository;
  paymentRepository: PaymentRepository;
  webhookEventRepository: WebhookEventRepository;
  generateReportContent?: (
    deps: GenerateReportContentDeps,
    reportId: string,
    reportToken: string | null,
  ) => Promise<void>;
}

export interface ProcessEventResult {
  /** false when this event ID was already recorded — a duplicate Stripe delivery that must not be re-fulfilled. */
  processed: boolean;
}

/**
 * Idempotent event processing (docs/09: "store event ID", "process
 * idempotently", "no duplicate fulfillment"). The event-ID check is the
 * primary guard; checking the report's current status before transitioning
 * it is a second, independent safety net — belt and suspenders, since a
 * report already in "paid" or later must never be re-fulfilled even if the
 * event-ID guard were somehow bypassed.
 */
function extractReportId(event: Stripe.Event): string | null {
  const object = event.data.object as { metadata?: { reportId?: string } };
  return object.metadata?.reportId ?? null;
}

export async function processStripeEvent(
  event: Stripe.Event,
  deps: FulfillmentDeps,
): Promise<ProcessEventResult> {
  const isNewEvent = await deps.webhookEventRepository.recordIfNew({
    id: event.id,
    type: event.type,
    reportId: extractReportId(event),
    payload: event,
  });
  if (!isNewEvent) {
    return { processed: false };
  }

  if (event.type === "checkout.session.completed") {
    await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, deps);
  }

  await deps.webhookEventRepository.markProcessed(event.id);
  return { processed: true };
}

async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  deps: FulfillmentDeps,
): Promise<void> {
  const reportId = session.metadata?.reportId;
  if (!reportId) {
    throw new Error(
      `checkout.session.completed for session ${session.id} is missing reportId metadata`,
    );
  }

  const report = await deps.reportRepository.findById(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found for checkout session ${session.id}`);
  }

  // A report already past "checkout_started" was already fulfilled by an
  // earlier delivery of this (or an equivalent) event — safe no-op.
  if (report.status !== "checkout_started") {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  // Decision #5: the 12-month retention clock starts when the report is paid
  // for (the point at which it becomes a delivered asset), not at draft creation.
  const expiresAt = computeReportExpiry(new Date(), serverEnv.REPORT_RETENTION_MONTHS);

  await transitionReportStatus(deps.reportRepository, reportId, "paid", {
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    expiresAt: expiresAt.toISOString(),
    email: session.customer_details?.email ?? null,
  });

  const payment = await deps.paymentRepository.findByCheckoutSessionId(session.id);
  if (payment && payment.status === "pending") {
    await deps.paymentRepository.update(payment.id, {
      status: "paid",
      stripePaymentIntentId: paymentIntentId,
    });
  }

  // Generates the actual report content (search + AI enrichment) and moves
  // paid → processing → ready/failed. The raw report token only ever exists
  // transiently — created at draft time, carried here via Stripe's own
  // metadata storage (never our database, docs/10: "secure hashed report
  // tokens") — so it's used now to build the "ready" email's link, then gone.
  const generateReportContent = deps.generateReportContent ?? defaultGenerateReportContent;
  await generateReportContent(
    { reportRepository: deps.reportRepository },
    reportId,
    session.metadata?.reportToken ?? null,
  );
}
