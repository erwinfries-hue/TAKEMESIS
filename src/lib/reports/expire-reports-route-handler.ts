import "server-only";
import { expireDueReports, type ExpireReportsResult } from "./expire-reports";
import { SupabaseReportRepository } from "./supabase-report-repository";
import { serverEnv } from "@/lib/env/server";
import type { ReportRepository } from "./report-repository";

/**
 * Core logic behind GET /api/cron/expire-reports, factored out so it's
 * testable with a fake repository. Requires `Authorization: Bearer
 * <CRON_SECRET>` — Vercel Cron sends this automatically for scheduled
 * invocations (see vercel.json); CRON_SECRET unset means the route always
 * 401s, so this is safe to deploy before the secret is provisioned.
 */
export async function handleExpireReportsRequest(
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

  let result: ExpireReportsResult;
  try {
    result = await expireDueReports(repository);
  } catch (error) {
    console.error("Report expiry job failed", error);
    return Response.json({ error: "expiry job failed" }, { status: 500 });
  }

  return Response.json({ checked: result.checked, expiredCount: result.expired.length });
}
