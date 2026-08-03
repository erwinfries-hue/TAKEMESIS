import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hashReportToken } from "@/lib/reports/token";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { PremiumReportView } from "@/components/premium-report/premium-report-view";
import { ReportStatusNotice } from "@/components/report-status-notice";
import { ReportFeedbackWidget } from "@/components/report-feedback-widget";
import { ReportProcessingPoller } from "@/components/report-processing-poller";
import { UpdateCheckWidget } from "@/components/update-check-widget";
import { canRunUpdateCheck } from "@/lib/reports/update-check";
import { serverEnv } from "@/lib/env/server";

// Search + AI enrichment already run once at fulfillment time (the webhook),
// so this route is a pure read — no long-running work, unlike
// /admin/report-preview or /admin/example-questions.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: `${dict.premiumReportPage.coverHeading} — ${dict.brand.name}`,
    // A purchased report's secret-token link must never be indexed —
    // "noindex" holds even if the URL leaks via a referrer or gets shared
    // somewhere Google can see it (robots.txt alone wouldn't cover that).
    robots: { index: false, follow: false },
  };
}

export default async function ReportViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const visitorLocale = await getLocale();
  const visitorDict = getDictionary(visitorLocale);
  const v = visitorDict.reportViewerPage;

  let report;
  try {
    report = await new SupabaseReportRepository().findByTokenHash(hashReportToken(token));
  } catch (error) {
    console.error("Report viewer: failed to look up report", error);
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <ReportStatusNotice
          heading={v.unavailableHeading}
          body={v.unavailableBody}
          supportEmail={serverEnv.SUPPORT_EMAIL}
          supportNote={v.supportNote}
        />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <ReportStatusNotice heading={v.notFoundHeading} body={v.notFoundBody} />
      </main>
    );
  }

  // Self-revoke (decision #6) is a flag independent of lifecycle status —
  // checked first regardless of what state the report is otherwise in.
  if (report.revokedAt) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <ReportStatusNotice heading={v.revokedHeading} body={v.revokedBody} />
      </main>
    );
  }

  const dict = getDictionary(report.locale);
  const rv = dict.reportViewerPage;

  switch (report.status) {
    case "ready": {
      if (!report.finalPayload) {
        // Should never happen (ready always sets finalPayload — see
        // generate-report-content.ts), but never render a broken page over
        // a data inconsistency.
        return (
          <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
            <ReportStatusNotice
              heading={rv.unavailableHeading}
              body={rv.unavailableBody}
              supportEmail={serverEnv.SUPPORT_EMAIL}
              supportNote={rv.supportNote}
            />
          </main>
        );
      }
      return (
        <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16 sm:px-10">
          <PremiumReportView dict={dict} report={report.finalPayload} />
          {report.email && (
            <UpdateCheckWidget
              dict={dict.updateCheck}
              token={token}
              email={report.email}
              initiallyRateLimited={!canRunUpdateCheck(report)}
            />
          )}
          <ReportFeedbackWidget dict={dict.reportFeedback} reportId={report.id} />
        </main>
      );
    }
    case "paid":
    case "processing":
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 text-center sm:px-10">
          <ReportProcessingPoller />
          <ReportStatusNotice heading={rv.processingHeading} body={rv.processingBody} pending />
        </main>
      );
    case "failed":
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <ReportStatusNotice
            heading={rv.failedHeading}
            body={rv.failedBody}
            supportEmail={serverEnv.SUPPORT_EMAIL}
            supportNote={rv.supportNote}
          />
        </main>
      );
    case "expired":
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <ReportStatusNotice
            heading={rv.expiredHeading}
            body={rv.expiredBody}
            supportEmail={serverEnv.SUPPORT_EMAIL}
            supportNote={rv.supportNote}
          />
        </main>
      );
    case "refund_pending":
    case "refunded":
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <ReportStatusNotice heading={rv.refundedHeading} body={rv.refundedBody} />
        </main>
      );
    default:
      // draft / preview_ready / checkout_started / blocked — none of these
      // are ever meant to be viewable via a report link (no payment
      // confirmed yet, or an admin has intervened).
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <ReportStatusNotice heading={rv.unavailableHeading} body={rv.unavailableBody} />
        </main>
      );
  }
}
