import "server-only";
import { hashReportToken } from "./token";
import { SupabaseReportRepository } from "./supabase-report-repository";
import type { ReportRepository } from "./report-repository";
import { canRunUpdateCheck, runUpdateCheck, type RunUpdateCheckDeps } from "./update-check";
import { sendEmail as defaultSendEmail } from "@/lib/email/send";
import { buildUpdateCheckResultEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import { track } from "@/lib/analytics/track";

export interface CheckUpdatesRouteDeps {
  reportRepository?: ReportRepository;
  runUpdateCheckFn?: (
    ...args: Parameters<typeof runUpdateCheck>
  ) => ReturnType<typeof runUpdateCheck>;
  runSearch?: RunUpdateCheckDeps["runSearch"];
  sendEmail?: typeof defaultSendEmail;
  reportUrlFor?: (token: string) => string;
}

/**
 * Core logic behind POST /api/report/[token]/check-updates, factored out
 * for testability — same pattern as report-chat-route-handler.ts. A
 * one-time, user-triggered action (decision #7): no request body, the
 * token in the URL is both the auth and the identity, same trust model as
 * the report viewer page itself.
 */
export async function handleCheckUpdatesRequest(
  token: string,
  deps: CheckUpdatesRouteDeps = {},
): Promise<Response> {
  const reportRepository = deps.reportRepository ?? new SupabaseReportRepository();
  const runUpdateCheckFn = deps.runUpdateCheckFn ?? runUpdateCheck;
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const reportUrlFor =
    deps.reportUrlFor ?? ((t: string) => `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/report/${t}`);

  let report;
  try {
    report = await reportRepository.findByTokenHash(hashReportToken(token));
  } catch (error) {
    console.error("Update check: failed to look up report", error);
    return Response.json({ error: "lookup failed" }, { status: 502 });
  }

  if (!report || report.revokedAt) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  if (!canRunUpdateCheck(report)) {
    return Response.json(
      { error: "not eligible for an update check right now" },
      { status: 409 },
    );
  }

  let result;
  try {
    result = await runUpdateCheckFn(report, { runSearch: deps.runSearch });
  } catch (error) {
    console.error(`Update check: search failed for report ${report.id}`, error);
    return Response.json({ error: "update check failed" }, { status: 502 });
  }

  // Record the attempt regardless of email outcome — the rate limit
  // (canRunUpdateCheck) must hold even if the send below fails, otherwise a
  // stuck email provider would let this be retried without bound.
  await reportRepository.update(report.id, { lastUpdateCheckAt: result.checkedAt });

  try {
    // report.email is guaranteed by canRunUpdateCheck's guard above.
    await sendEmail({
      to: report.email as string,
      content: buildUpdateCheckResultEmail({
        locale: report.locale,
        reportUrl: reportUrlFor(token),
        supportEmail: serverEnv.SUPPORT_EMAIL,
        newStudies: result.newStudies,
      }),
    });
  } catch (error) {
    console.error(`Update check: email send failed for report ${report.id}`, error);
    return Response.json({ error: "check ran but the email failed to send" }, { status: 502 });
  }

  await track({
    eventName: "update_check_triggered",
    reportId: report.id,
    metadata: { newStudyCount: result.newStudies.length },
  });

  return Response.json({ ok: true, newStudyCount: result.newStudies.length });
}
