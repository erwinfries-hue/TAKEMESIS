import "server-only";
import { runTopicDigest, type RunTopicDigestResult, type RunTopicDigestDeps } from "./run-digest";
import { serverEnv } from "@/lib/env/server";

/**
 * Core logic behind GET /api/cron/topic-digest, factored out for
 * testability — same Bearer-CRON_SECRET pattern as the other two cron
 * routes (resend-confirmation-emails-route-handler.ts,
 * expire-reports-route-handler.ts). CRON_SECRET unset means the route
 * always 401s, safe to deploy before the secret is provisioned.
 */
export async function handleTopicDigestRequest(
  request: Request,
  deps: RunTopicDigestDeps = {},
): Promise<Response> {
  if (!serverEnv.CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let result: RunTopicDigestResult;
  try {
    result = await runTopicDigest(deps);
  } catch (error) {
    console.error("Topic digest job failed", error);
    return Response.json({ error: "digest job failed" }, { status: 500 });
  }

  return Response.json({
    checked: result.checked,
    sentCount: result.sent.length,
    skippedNoNewStudiesCount: result.skippedNoNewStudies.length,
    failed: result.failed,
  });
}
