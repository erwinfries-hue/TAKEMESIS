import type { Locale } from "@/lib/i18n/config";
import type { ReportStatus } from "./lifecycle";

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
}

export interface CreateReportInput {
  tokenHash: string;
  originalQuestion: string;
  locale: Locale;
  domainSlug: string;
  eligibility: ReportEligibility;
  priceVersion: string;
}
