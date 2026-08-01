import "server-only";
import { runSearch as defaultRunSearch } from "@/lib/search/run-search";
import { assessEligibility as defaultAssessEligibility } from "@/lib/eligibility/eligibility";
import { buildPremiumReportData, PREMIUM_REPORT_VERSION } from "./premium-report";
import { enrichPremiumReportWithAi as defaultEnrichPremiumReportWithAi } from "@/lib/ai/report-enrichment";
import { sendEmail as defaultSendEmail } from "@/lib/email/send";
import { buildReportFailedEmail, buildReportReadyEmail } from "@/lib/email/templates";
import { transitionReportStatus } from "./report-service";
import type { ReportRepository } from "./report-repository";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";

export interface GenerateReportContentDeps {
  reportRepository: ReportRepository;
  runSearch?: typeof defaultRunSearch;
  assessEligibility?: typeof defaultAssessEligibility;
  enrichPremiumReportWithAi?: typeof defaultEnrichPremiumReportWithAi;
  sendEmail?: typeof defaultSendEmail;
  /** Base URL used to build the report link in the "ready" email — injectable so tests never depend on env. */
  reportUrlFor?: (token: string) => string;
}

/**
 * The step that was missing entirely before this pass: turns a report that
 * is "paid" (from Stripe fulfillment) or "failed" (an admin retry) into a
 * real, rendered "ready" report. Deliberately re-runs the live search
 * rather than trying to serialize/replay the exact preview-time result set
 * (docs/OPEN_RISKS.md: `report_sources`/`search_runs` are intentionally not
 * used) — this also means a paid report reflects the freshest evidence
 * available at generation time, not a stale snapshot from when the teaser
 * was first shown.
 *
 * Always resolves (never throws): on any failure, the report is
 * transitioned to "failed" with a short failure code rather than left
 * stuck in "processing" — visible in `/admin` for a manual retry.
 */
export async function generateReportContent(
  deps: GenerateReportContentDeps,
  reportId: string,
  reportToken: string | null,
): Promise<void> {
  const runSearch = deps.runSearch ?? defaultRunSearch;
  const assessEligibility = deps.assessEligibility ?? defaultAssessEligibility;
  const enrichPremiumReportWithAi = deps.enrichPremiumReportWithAi ?? defaultEnrichPremiumReportWithAi;
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const reportUrlFor =
    deps.reportUrlFor ?? ((token: string) => `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/report/${token}`);

  const report = await transitionReportStatus(deps.reportRepository, reportId, "processing");

  try {
    if (!report.domainSlug) {
      throw new Error(`Report ${reportId} has no domainSlug — cannot re-run its search`);
    }

    const searchResult = await runSearch(report.originalQuestion, report.domainSlug, report.locale);
    const eligibility = assessEligibility(searchResult);
    const baseReport = buildPremiumReportData({ searchResult, eligibility, locale: report.locale });
    const detailedRecords = searchResult.detailed.map((scored) => scored.deduped.record);
    const finalPayload = await enrichPremiumReportWithAi({
      report: baseReport,
      detailedRecords,
      topicSlug: searchResult.topicSlug,
    });

    await transitionReportStatus(deps.reportRepository, reportId, "ready", {
      finalPayload,
      reportVersion: PREMIUM_REPORT_VERSION,
    });

    if (report.email && reportToken) {
      try {
        await sendEmail({
          to: report.email,
          content: buildReportReadyEmail({
            locale: report.locale,
            reportUrl: reportUrlFor(reportToken),
            supportEmail: serverEnv.SUPPORT_EMAIL,
          }),
        });
        // Marks the send as confirmed so the daily resend sweep
        // (resend-confirmation-emails.ts, docs/OPEN_RISKS.md #30) never
        // double-sends to a report whose email actually went out — only
        // reports where this never got recorded (e.g. the function was
        // killed by the route's maxDuration right after this point) are
        // picked up by that sweep.
        await deps.reportRepository.update(reportId, {
          confirmationEmailSentAt: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error(`Report ${reportId}: ready but failed to send the notification email`, emailError);
      }
    }
  } catch (error) {
    console.error(`Report ${reportId}: content generation failed`, error);
    await transitionReportStatus(deps.reportRepository, reportId, "failed", {
      failureCode: "generation_failed",
    });

    if (report.email) {
      try {
        await sendEmail({
          to: report.email,
          content: buildReportFailedEmail({
            locale: report.locale,
            reportUrl: reportToken ? reportUrlFor(reportToken) : "",
            supportEmail: serverEnv.SUPPORT_EMAIL,
          }),
        });
      } catch (emailError) {
        console.error(`Report ${reportId}: failed, and the failure-notification email also failed`, emailError);
      }
    }
  }
}
