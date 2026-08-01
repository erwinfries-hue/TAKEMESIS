import type { FeedbackEntry } from "./types";
import type { Report } from "@/lib/reports/types";

export interface FeedbackWithReport {
  feedback: FeedbackEntry;
  report: Report | null;
}

export interface TopicFeedbackSummary {
  domainSlug: string;
  count: number;
  ratedCount: number;
  averageRating: number | null;
}

export interface MonthlyFeedbackSummary {
  /** "YYYY-MM" */
  month: string;
  count: number;
  ratedCount: number;
  averageRating: number | null;
}

function average(ratings: number[]): number | null {
  return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
}

/** Groups feedback by the topic of its report — "unbekannt" covers entries whose report couldn't be resolved (deleted/expired report, or reportId was null). */
export function summarizeFeedbackByTopic(entries: FeedbackWithReport[]): TopicFeedbackSummary[] {
  const groups = new Map<string, { count: number; ratings: number[] }>();
  for (const { feedback, report } of entries) {
    const key = report?.domainSlug ?? "unbekannt";
    const group = groups.get(key) ?? { count: 0, ratings: [] };
    group.count += 1;
    if (feedback.rating !== null) {
      group.ratings.push(feedback.rating);
    }
    groups.set(key, group);
  }
  return Array.from(groups.entries())
    .map(([domainSlug, { count, ratings }]) => ({
      domainSlug,
      count,
      ratedCount: ratings.length,
      averageRating: average(ratings),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Groups feedback by calendar month of submission (feedback.createdAt), sorted chronologically. */
export function summarizeFeedbackByMonth(entries: FeedbackWithReport[]): MonthlyFeedbackSummary[] {
  const groups = new Map<string, { count: number; ratings: number[] }>();
  for (const { feedback } of entries) {
    const key = feedback.createdAt.slice(0, 7);
    const group = groups.get(key) ?? { count: 0, ratings: [] };
    group.count += 1;
    if (feedback.rating !== null) {
      group.ratings.push(feedback.rating);
    }
    groups.set(key, group);
  }
  return Array.from(groups.entries())
    .map(([month, { count, ratings }]) => ({
      month,
      count,
      ratedCount: ratings.length,
      averageRating: average(ratings),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * How many purchased reports (reports that went through checkout — see
 * `purchasedReportCount`) ever got feedback, counted once per report even
 * if somehow more than one entry references the same reportId.
 */
export function computeFeedbackResponseRate(
  feedback: FeedbackEntry[],
  purchasedReportCount: number,
): { respondedCount: number; rate: number | null } {
  const respondedCount = new Set(
    feedback.map((entry) => entry.reportId).filter((id): id is string => id !== null),
  ).size;
  return {
    respondedCount,
    rate: purchasedReportCount > 0 ? (respondedCount / purchasedReportCount) * 100 : null,
  };
}

/** A report only exists past checkout once Stripe has supplied a customer email (see webhook.ts's fulfillCheckoutSession) — draft/preview-only reports never have one. */
export function countPurchasedReports(reports: Report[]): number {
  return reports.filter((report) => report.email !== null).length;
}
