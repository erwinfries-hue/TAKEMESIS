import "server-only";
import type Stripe from "stripe";
import type { ReportRepository } from "./report-repository";
import { sendEmail as defaultSendEmail } from "@/lib/email/send";
import { buildReportReadyEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import { getStripeClient } from "@/lib/stripe/client";

/** Minimal slice of the Stripe SDK this module needs — lets tests pass a fake client instead of a real one (which requires STRIPE_SECRET_KEY). */
export interface StripeSessionRetrievingClient {
  checkout: {
    sessions: {
      retrieve: (id: string) => Promise<Pick<Stripe.Checkout.Session, "metadata">>;
    };
  };
}

export interface ResendConfirmationEmailsDeps {
  sendEmail?: typeof defaultSendEmail;
  stripeClient?: StripeSessionRetrievingClient;
  /** Base URL used to build the report link — injectable so tests never depend on env. */
  reportUrlFor?: (token: string) => string;
}

export interface ResendConfirmationEmailsResult {
  checked: number;
  sent: string[];
  skipped: { reportId: string; reason: string }[];
}

/**
 * Daily safety-net sweep (docs/OPEN_RISKS.md #30): finds "ready" reports
 * whose "report ready" confirmation email was never confirmed sent —
 * normally because the webhook route's maxDuration killed the function
 * right after persisting the report but before (or during) the email send —
 * and resends it.
 *
 * The raw report token is deliberately never stored in our own database
 * (docs/10: "secure hashed report tokens"); it only ever flowed through
 * Stripe's own Checkout Session metadata during the original webhook
 * request. Stripe retains completed sessions indefinitely, so this reads
 * the token back from there via the report's already-persisted
 * `stripeCheckoutSessionId` — no new token is generated, so an already
 * shown link (e.g. from `/checkout/success?token=...`) keeps working.
 */
export async function resendMissingConfirmationEmails(
  repository: ReportRepository,
  deps: ResendConfirmationEmailsDeps = {},
): Promise<ResendConfirmationEmailsResult> {
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const stripeClient = deps.stripeClient ?? getStripeClient();
  const reportUrlFor =
    deps.reportUrlFor ?? ((token: string) => `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/report/${token}`);

  const allReports = await repository.listAll();
  const due = allReports.filter(
    (report) => report.status === "ready" && report.email && !report.confirmationEmailSentAt,
  );

  const sent: string[] = [];
  const skipped: { reportId: string; reason: string }[] = [];

  for (const report of due) {
    if (!report.stripeCheckoutSessionId) {
      skipped.push({ reportId: report.id, reason: "no_checkout_session_id" });
      continue;
    }
    try {
      const session = await stripeClient.checkout.sessions.retrieve(report.stripeCheckoutSessionId);
      const token = session.metadata?.reportToken;
      if (!token) {
        skipped.push({ reportId: report.id, reason: "no_report_token_in_session_metadata" });
        continue;
      }
      await sendEmail({
        // report.email is guaranteed non-null by the `due` filter above.
        to: report.email as string,
        content: buildReportReadyEmail({
          locale: report.locale,
          reportUrl: reportUrlFor(token),
          supportEmail: serverEnv.SUPPORT_EMAIL,
        }),
      });
      await repository.update(report.id, { confirmationEmailSentAt: new Date().toISOString() });
      sent.push(report.id);
    } catch (error) {
      console.error(`Resend confirmation email failed for report ${report.id}`, error);
      skipped.push({ reportId: report.id, reason: "send_failed" });
    }
  }

  return { checked: allReports.length, sent, skipped };
}
