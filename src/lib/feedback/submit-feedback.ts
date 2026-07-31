import "server-only";
import type { ReportRepository } from "@/lib/reports/report-repository";
import type { FeedbackRepository } from "./feedback-repository";
import type { FeedbackEntry } from "./types";
import { MAX_FEEDBACK_COMMENT_LENGTH } from "@/lib/security/limits";

export class InvalidFeedbackError extends Error {}

export interface SubmitFeedbackDeps {
  reportRepository: ReportRepository;
  feedbackRepository: FeedbackRepository;
}

export interface SubmitFeedbackInput {
  reportId: string;
  rating: number | null;
  comment: string | null;
}

/**
 * The report-viewer feedback widget's backend. No admin/customer auth here
 * — reachable by anyone with a valid report link, same trust boundary as
 * the report itself (decision #6: link-based access). `reportId` is still
 * verified against a real report so this can't be used to write arbitrary
 * feedback rows unrelated to any report.
 */
export async function submitFeedback(
  deps: SubmitFeedbackDeps,
  input: SubmitFeedbackInput,
): Promise<FeedbackEntry> {
  if (!input.reportId) {
    throw new InvalidFeedbackError("Missing reportId");
  }
  if (input.rating !== null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    throw new InvalidFeedbackError("Rating must be an integer between 1 and 5");
  }
  const comment = input.comment?.trim() || null;
  if (comment && comment.length > MAX_FEEDBACK_COMMENT_LENGTH) {
    throw new InvalidFeedbackError(
      `Comment exceeds ${MAX_FEEDBACK_COMMENT_LENGTH} characters`,
    );
  }
  if (input.rating === null && comment === null) {
    throw new InvalidFeedbackError("Feedback must include a rating or a comment");
  }

  const report = await deps.reportRepository.findById(input.reportId);
  if (!report) {
    throw new InvalidFeedbackError(`Report ${input.reportId} not found`);
  }

  return deps.feedbackRepository.create({
    reportId: input.reportId,
    rating: input.rating,
    comment,
  });
}
