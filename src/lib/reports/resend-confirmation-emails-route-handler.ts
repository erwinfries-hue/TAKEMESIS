import "server-only";
import {
  resendMissingConfirmationEmails,
  type ResendConfirmationEmailsResult,
} from "./resend-confirmation-emails";
import { SupabaseReportRepository } from "./supabase-report-repository";
import { serverEnv } from "@/lib/env/server";
import type { ReportRepository } from "./report-repository";

/**
 * Core logic behind GET /api/cron/resend-confirmation-emails, factored out
 * so it's testable with a fake repository. Requires `Authorization: Bearer
 * <CRON_SECRET>` — Vercel Cron sends this automatically for scheduled
 * invocations (see vercel.json); CRON_SECRET unset means the route always
 * 401s, so this is safe to deploy before the secret is provisioned.
 */
export async function handleResendConfirmationEmailsRequest(
  request: Request,
  repository: ReportRepository = new SupabaseReportRepository(),
): Promise<Response> {
  if (!serverEnv.CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let result: ResendConfirmationEmailsResult;
  try {
    result = await resendMissingConfirmationEmails(repository);
  } catch (error) {
    console.error("Confirmation-email resend job failed", error);
    return Response.json({ error: "resend job failed" }, { status: 500 });
  }

  return Response.json({
    checked: result.checked,
    sentCount: result.sent.length,
    skipped: result.skipped,
  });
}
