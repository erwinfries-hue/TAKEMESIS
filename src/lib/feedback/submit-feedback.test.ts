import { describe, expect, it } from "vitest";
import { submitFeedback, InvalidFeedbackError } from "./submit-feedback";
import { InMemoryReportRepository } from "@/lib/reports/in-memory-report-repository";
import { InMemoryFeedbackRepository } from "./in-memory-feedback-repository";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "@/lib/reports/report-test-fixtures";
import { MAX_FEEDBACK_COMMENT_LENGTH } from "@/lib/security/limits";

async function setUp() {
  const reportRepository = new InMemoryReportRepository();
  const feedbackRepository = new InMemoryFeedbackRepository();
  const report = await reportRepository.create({
    tokenHash: "hash",
    originalQuestion: "q",
    locale: "de",
    domainSlug: "lernen-bildung",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS_FIXTURE,
    previewPayload: FAKE_TEASER_FIXTURE,
  });
  return { reportRepository, feedbackRepository, report };
}

describe("submitFeedback", () => {
  it("creates a feedback entry for a real report", async () => {
    const { reportRepository, feedbackRepository, report } = await setUp();

    const entry = await submitFeedback(
      { reportRepository, feedbackRepository },
      { reportId: report.id, rating: 4, comment: "Sehr hilfreich" },
    );

    expect(entry.reportId).toBe(report.id);
    expect(entry.rating).toBe(4);
    expect(entry.comment).toBe("Sehr hilfreich");
    expect(await feedbackRepository.listAll()).toHaveLength(1);
  });

  it("allows a rating-only or comment-only submission", async () => {
    const { reportRepository, feedbackRepository, report } = await setUp();

    await submitFeedback(
      { reportRepository, feedbackRepository },
      { reportId: report.id, rating: 5, comment: null },
    );
    await submitFeedback(
      { reportRepository, feedbackRepository },
      { reportId: report.id, rating: null, comment: "Nur ein Kommentar" },
    );

    expect(await feedbackRepository.listAll()).toHaveLength(2);
  });

  it("rejects a submission with neither rating nor comment", async () => {
    const { reportRepository, feedbackRepository, report } = await setUp();

    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: report.id, rating: null, comment: "   " },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
  });

  it("rejects an out-of-range or non-integer rating", async () => {
    const { reportRepository, feedbackRepository, report } = await setUp();

    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: report.id, rating: 0, comment: null },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: report.id, rating: 6, comment: null },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: report.id, rating: 3.5, comment: null },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
  });

  it("rejects a comment over the max length", async () => {
    const { reportRepository, feedbackRepository, report } = await setUp();

    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: report.id, rating: null, comment: "x".repeat(MAX_FEEDBACK_COMMENT_LENGTH + 1) },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
  });

  it("rejects feedback for a report that doesn't exist", async () => {
    const { reportRepository, feedbackRepository } = await setUp();

    await expect(
      submitFeedback(
        { reportRepository, feedbackRepository },
        { reportId: "missing-id", rating: 5, comment: null },
      ),
    ).rejects.toThrow(InvalidFeedbackError);
  });
});
