/**
 * Funnel events — docs/11_ADMIN_ANALYTICS_EMAIL_AND_SUPPORT.md, "Funnel events".
 * "Do not put raw personal questions into analytics" is enforced structurally
 * here: metadata is filtered through an explicit allowlist (sanitizeMetadata)
 * before it ever reaches a repository or PostHog, so a caller accidentally
 * passing the raw question through under some key can never leak it — only
 * allowlisted, non-identifying keys survive.
 */
export const ANALYTICS_EVENTS = [
  "landing_viewed",
  "topic_selected",
  "example_question_selected",
  "question_submitted",
  "question_clarified",
  "domain_classified",
  "not_researchable",
  "search_started",
  "search_completed",
  "search_failed",
  "eligible",
  "eligible_limited",
  "not_eligible",
  "restricted",
  "preview_viewed",
  "paywall_viewed",
  "unlock_clicked",
  "checkout_created",
  "checkout_completed",
  "checkout_cancelled",
  "generation_started",
  "report_ready",
  "report_failed",
  "report_opened",
  "report_printed",
  "feedback_submitted",
  "issue_reported",
  "refund_pending",
  "refunded",
  "update_check_triggered",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsMetadataValue = string | number | boolean | null;
export type AnalyticsMetadata = Record<string, AnalyticsMetadataValue>;

/** Non-identifying, non-content keys only — never a question, title, or free-text field. */
const ALLOWED_METADATA_KEYS = new Set([
  "topicSlug",
  "domainSlug",
  "eligibilityStatus",
  "confidenceLabel",
  "source",
  "sourceCount",
  "candidateCount",
  "includedCount",
  "errorCode",
  "locale",
  "reportId",
  "priceVersion",
  "amountMinor",
  "currency",
  "rating",
  "issueCategory",
  "newStudyCount",
]);

export function sanitizeMetadata(metadata: AnalyticsMetadata | undefined): AnalyticsMetadata {
  if (!metadata) {
    return {};
  }
  const safe: AnalyticsMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (ALLOWED_METADATA_KEYS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}
