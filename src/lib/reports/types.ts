import type { Locale } from "@/lib/i18n/config";
import type { ReportStatus } from "./lifecycle";
import type { TeaserData } from "@/lib/eligibility/teaser";
import type { PremiumReportData } from "./premium-report";
import type { SearchStatsSummary } from "./search-stats";

export type ReportEligibility =
  | "eligible"
  | "eligible_with_limitations"
  | "not_eligible"
  | "restricted_high_risk";

export interface Report {
  id: string;
  tokenHash: string;
  status: ReportStatus;
  eligibility: ReportEligibility | null;
  domainSlug: string | null;
  originalQuestion: string;
  interpretedQuestion: string | null;
  locale: Locale;
  sourceRoute: string | null;
  /** Lightweight run stats, captured at preview time — for admin visibility only, not a full record archive (see docs/OPEN_RISKS.md on report_sources/search_runs being deliberately unused). */
  searchStats: SearchStatsSummary | null;
  /** The free-teaser data shown before payment, persisted so it's reproducible later even if a re-search would return slightly different results. */
  previewPayload: TeaserData | null;
  /** The full premium report, populated once generation succeeds (paid → processing → ready). */
  finalPayload: PremiumReportData | null;
  reportVersion: string | null;
  priceVersion: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  failureCode: string | null;
  /** Set once the "report ready" confirmation email is confirmed sent — lets the resend sweep (docs/OPEN_RISKS.md #30) find reports whose email was dropped without ever double-sending to one that already succeeded. */
  confirmationEmailSentAt: string | null;
}

export interface CreateReportInput {
  tokenHash: string;
  originalQuestion: string;
  locale: Locale;
  domainSlug: string;
  sourceRoute: string | null;
  eligibility: ReportEligibility;
  priceVersion: string;
  searchStats: SearchStatsSummary;
  previewPayload: TeaserData;
}
