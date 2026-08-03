import { describe, expect, it } from "vitest";
import {
  computeFeedbackResponseRate,
  countPurchasedReports,
  summarizeFeedbackByMonth,
  summarizeFeedbackByTopic,
  type FeedbackWithReport,
} from "./feedback-analytics";
import type { FeedbackEntry } from "./types";
import type { Report } from "@/lib/reports/types";

function makeFeedback(overrides: Partial<FeedbackEntry> = {}): FeedbackEntry {
  return {
    id: "fb-1",
    reportId: "report-1",
    rating: 4,
    comment: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    tokenHash: "hash",
    status: "ready",
    eligibility: "eligible",
    domainSlug: "fitness-leistungsfaehigkeit",
    originalQuestion: "Frage",
    interpretedQuestion: null,
    locale: "de",
    sourceRoute: null,
    searchStats: null,
    previewPayload: null,
    finalPayload: null,
    reportVersion: null,
    priceVersion: "MVP-01",
    stripeCheckoutSessionId: "cs_1",
    stripePaymentIntentId: null,
    email: "erwin@example.com",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:05:00.000Z",
    expiresAt: null,
    revokedAt: null,
    failureCode: null,
    confirmationEmailSentAt: null,
    lastUpdateCheckAt: null,
    ...overrides,
  };
}

describe("summarizeFeedbackByTopic", () => {
  it("groups by domainSlug and averages only the rated entries", () => {
    const entries: FeedbackWithReport[] = [
      {
        feedback: makeFeedback({ id: "fb-1", rating: 4 }),
        report: makeReport({ domainSlug: "fitness-leistungsfaehigkeit" }),
      },
      {
        feedback: makeFeedback({ id: "fb-2", rating: 2 }),
        report: makeReport({ domainSlug: "fitness-leistungsfaehigkeit" }),
      },
      {
        feedback: makeFeedback({ id: "fb-3", rating: null, comment: "Nur ein Kommentar" }),
        report: makeReport({ domainSlug: "fitness-leistungsfaehigkeit" }),
      },
      {
        feedback: makeFeedback({ id: "fb-4", rating: 5 }),
        report: makeReport({ domainSlug: "lernen-bildung" }),
      },
    ];

    const summary = summarizeFeedbackByTopic(entries);

    const fitness = summary.find((s) => s.domainSlug === "fitness-leistungsfaehigkeit");
    expect(fitness).toEqual({
      domainSlug: "fitness-leistungsfaehigkeit",
      count: 3,
      ratedCount: 2,
      averageRating: 3,
    });

    const lernen = summary.find((s) => s.domainSlug === "lernen-bildung");
    expect(lernen).toEqual({
      domainSlug: "lernen-bildung",
      count: 1,
      ratedCount: 1,
      averageRating: 5,
    });
  });

  it("buckets feedback with no resolvable report under 'unbekannt'", () => {
    const entries: FeedbackWithReport[] = [{ feedback: makeFeedback(), report: null }];
    const summary = summarizeFeedbackByTopic(entries);
    expect(summary).toEqual([
      { domainSlug: "unbekannt", count: 1, ratedCount: 1, averageRating: 4 },
    ]);
  });

  it("sorts by count descending", () => {
    const entries: FeedbackWithReport[] = [
      { feedback: makeFeedback({ id: "fb-1" }), report: makeReport({ domainSlug: "a" }) },
      { feedback: makeFeedback({ id: "fb-2" }), report: makeReport({ domainSlug: "b" }) },
      { feedback: makeFeedback({ id: "fb-3" }), report: makeReport({ domainSlug: "b" }) },
    ];
    const summary = summarizeFeedbackByTopic(entries);
    expect(summary.map((s) => s.domainSlug)).toEqual(["b", "a"]);
  });
});

describe("summarizeFeedbackByMonth", () => {
  it("groups by calendar month and sorts chronologically", () => {
    const entries: FeedbackWithReport[] = [
      { feedback: makeFeedback({ id: "fb-1", createdAt: "2026-08-01T10:00:00.000Z", rating: 4 }), report: null },
      { feedback: makeFeedback({ id: "fb-2", createdAt: "2026-07-15T10:00:00.000Z", rating: 2 }), report: null },
      { feedback: makeFeedback({ id: "fb-3", createdAt: "2026-07-20T10:00:00.000Z", rating: null }), report: null },
    ];

    const summary = summarizeFeedbackByMonth(entries);

    expect(summary).toEqual([
      { month: "2026-07", count: 2, ratedCount: 1, averageRating: 2 },
      { month: "2026-08", count: 1, ratedCount: 1, averageRating: 4 },
    ]);
  });
});

describe("computeFeedbackResponseRate", () => {
  it("counts each report once even with multiple feedback entries for it", () => {
    const feedback: FeedbackEntry[] = [
      makeFeedback({ id: "fb-1", reportId: "report-1" }),
      makeFeedback({ id: "fb-2", reportId: "report-1" }),
      makeFeedback({ id: "fb-3", reportId: "report-2" }),
      makeFeedback({ id: "fb-4", reportId: null }),
    ];
    const result = computeFeedbackResponseRate(feedback, 10);
    expect(result.respondedCount).toBe(2);
    expect(result.rate).toBeCloseTo(20);
  });

  it("returns a null rate rather than dividing by zero when nothing was purchased", () => {
    const result = computeFeedbackResponseRate([], 0);
    expect(result.rate).toBeNull();
  });
});

describe("countPurchasedReports", () => {
  it("counts only reports with a customer email (set at Stripe fulfillment)", () => {
    const reports = [makeReport({ email: "a@example.com" }), makeReport({ email: null })];
    expect(countPurchasedReports(reports)).toBe(1);
  });
});
