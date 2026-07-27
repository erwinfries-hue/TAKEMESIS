import "server-only";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";
import { askReportChat, REPORT_CHAT_MAX_QUESTION_CHARS, type ReportChatResult } from "./report-chat";

const STUDY_FIELDS_SCHEMA = z
  .object({
    population: z.string().nullable(),
    intervention: z.string().nullable(),
    outcome: z.string().nullable(),
    result: z.string().nullable(),
    uncertainty: z.string().nullable(),
    limitations: z.string().nullable(),
    fundingConflicts: z.string().nullable(),
  })
  .nullable();

const REQUEST_SCHEMA = z.object({
  originalQuestion: z.string().min(1),
  followUpQuestion: z.string().min(1).max(REPORT_CHAT_MAX_QUESTION_CHARS),
  studies: z
    .array(
      z.object({
        citation: z.string(),
        design: z.string(),
        fields: STUDY_FIELDS_SCHEMA,
      }),
    )
    .min(1),
});

/**
 * Core logic behind POST /api/report-chat, factored out for testability —
 * same pattern as expire-reports-route-handler.ts. The grounding data
 * (studies) is only whatever the report page already renders to the
 * client, so there's nothing new exposed; it's validated here purely to
 * reject malformed requests early, not as a trust boundary.
 */
export async function handleReportChatRequest(
  request: Request,
  askReportChatFn: typeof askReportChat = askReportChat,
): Promise<Response> {
  if (!serverEnv.AI_EXTRACTION_ENABLED || !serverEnv.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI report chat is not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = REQUEST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  let result: ReportChatResult | null;
  try {
    result = await askReportChatFn(parsed.data);
  } catch (error) {
    console.error("AI report chat failed:", error);
    return Response.json({ error: "chat request failed" }, { status: 502 });
  }

  if (!result) {
    return Response.json({ error: "no answer available" }, { status: 502 });
  }

  return Response.json(result);
}
