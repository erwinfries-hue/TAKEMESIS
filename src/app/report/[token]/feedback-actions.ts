"use server";

import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { SupabaseFeedbackRepository } from "@/lib/feedback/supabase-feedback-repository";
import { submitFeedback, InvalidFeedbackError } from "@/lib/feedback/submit-feedback";

export interface SubmitReportFeedbackResult {
  ok: boolean;
  error?: string;
}

export async function submitReportFeedbackAction(
  formData: FormData,
): Promise<SubmitReportFeedbackResult> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || reportId.length === 0) {
    return { ok: false, error: "Missing reportId" };
  }

  const ratingRaw = formData.get("rating");
  const rating =
    typeof ratingRaw === "string" && ratingRaw.length > 0 ? Number(ratingRaw) : null;

  const commentRaw = formData.get("comment");
  const comment = typeof commentRaw === "string" ? commentRaw : null;

  try {
    await submitFeedback(
      {
        reportRepository: new SupabaseReportRepository(),
        feedbackRepository: new SupabaseFeedbackRepository(),
      },
      { reportId, rating, comment },
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidFeedbackError) {
      return { ok: false, error: error.message };
    }
    console.error("Report feedback: failed to submit", error);
    return { ok: false, error: "unexpected" };
  }
}
