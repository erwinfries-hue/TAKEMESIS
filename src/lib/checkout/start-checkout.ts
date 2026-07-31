import "server-only";
import { createCheckoutSession as defaultCreateCheckoutSession } from "@/lib/stripe/checkout";
import { transitionReportStatus } from "@/lib/reports/report-service";
import type { ReportRepository } from "@/lib/reports/report-repository";
import type { PaymentRepository } from "@/lib/payments/payment-repository";
import { getPriceConfig } from "@/lib/pricing/price-config";
import { serverEnv } from "@/lib/env/server";

export interface StartCheckoutDeps {
  reportRepository: ReportRepository;
  paymentRepository: PaymentRepository;
  createCheckoutSession?: typeof defaultCreateCheckoutSession;
}

export class ReportNotCheckoutableError extends Error {
  constructor(
    readonly reportId: string,
    readonly status: string,
  ) {
    super(`Report ${reportId} cannot start checkout from status "${status}"`);
    this.name = "ReportNotCheckoutableError";
  }
}

/**
 * The "Kaufen" button's backend. Report must already exist (created when
 * the free teaser rendered — see /search). Re-clicking "buy" after
 * abandoning an earlier Stripe Checkout page is a same-status retry (still
 * "checkout_started"), not a lifecycle transition, so it's handled as a
 * plain field update rather than going through `transitionReportStatus`
 * (which would reject "checkout_started" → "checkout_started" as a no-op
 * transition).
 */
export async function startCheckoutForReport(
  deps: StartCheckoutDeps,
  reportId: string,
  reportToken: string,
): Promise<{ url: string }> {
  const createCheckoutSession = deps.createCheckoutSession ?? defaultCreateCheckoutSession;
  const report = await deps.reportRepository.findById(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }
  if (report.status !== "preview_ready" && report.status !== "checkout_started") {
    throw new ReportNotCheckoutableError(reportId, report.status);
  }

  const priceConfig = getPriceConfig();
  const session = await createCheckoutSession({
    reportId,
    reportToken,
    priceVersion: priceConfig.version,
    amountMinor: priceConfig.amountMinor,
    currency: priceConfig.currency,
    locale: report.locale,
  });

  if (!session.url) {
    throw new Error(`Stripe did not return a Checkout URL for report ${reportId}`);
  }

  if (report.status === "preview_ready") {
    await transitionReportStatus(deps.reportRepository, reportId, "checkout_started", {
      stripeCheckoutSessionId: session.id,
    });
  } else {
    await deps.reportRepository.update(reportId, { stripeCheckoutSessionId: session.id });
  }

  // Without this, the webhook's findByCheckoutSessionId lookup always comes
  // back empty (nothing to mark "paid"), and /admin/payments — including
  // the one-click refund action — has nothing to show, since no Payment row
  // ever existed to begin with (bug found live, 2026-07-31: two real Stripe
  // charges completed successfully but never appeared in /admin/payments).
  await deps.paymentRepository.create({
    reportId,
    stripeCheckoutSessionId: session.id,
    amountMinor: priceConfig.amountMinor,
    currency: priceConfig.currency,
    priceVersion: priceConfig.version,
    mode: serverEnv.STRIPE_MODE,
  });

  return { url: session.url };
}
