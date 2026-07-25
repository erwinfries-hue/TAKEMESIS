import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { ReportRepository } from "./report-repository";
import type { CreateReportInput, Report } from "./types";

/**
 * Untested against a live database (no Supabase project provisioned in this
 * session — see docs/OPEN_RISKS.md). Structurally correct against the
 * migration in supabase/migrations/20260725220000_init_core_schema.sql;
 * needs a real run before being trusted in production, same as the Phase 4
 * source adapters.
 */
interface ReportRow {
  id: string;
  token_hash: string;
  status: Report["status"];
  eligibility: Report["eligibility"];
  domain_slug: string | null;
  original_question: string;
  interpreted_question: string | null;
  locale: Report["locale"];
  source_route: string | null;
  report_version: string | null;
  price_version: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  failure_code: string | null;
}

function toDomain(row: ReportRow): Report {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    status: row.status,
    eligibility: row.eligibility,
    domainSlug: row.domain_slug,
    originalQuestion: row.original_question,
    interpretedQuestion: row.interpreted_question,
    locale: row.locale,
    sourceRoute: row.source_route,
    reportVersion: row.report_version,
    priceVersion: row.price_version,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    failureCode: row.failure_code,
  };
}

function toRowPatch(patch: Partial<Omit<Report, "id" | "createdAt">>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.tokenHash !== undefined) row.token_hash = patch.tokenHash;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.eligibility !== undefined) row.eligibility = patch.eligibility;
  if (patch.domainSlug !== undefined) row.domain_slug = patch.domainSlug;
  if (patch.originalQuestion !== undefined) row.original_question = patch.originalQuestion;
  if (patch.interpretedQuestion !== undefined) row.interpreted_question = patch.interpretedQuestion;
  if (patch.locale !== undefined) row.locale = patch.locale;
  if (patch.sourceRoute !== undefined) row.source_route = patch.sourceRoute;
  if (patch.reportVersion !== undefined) row.report_version = patch.reportVersion;
  if (patch.priceVersion !== undefined) row.price_version = patch.priceVersion;
  if (patch.stripeCheckoutSessionId !== undefined)
    row.stripe_checkout_session_id = patch.stripeCheckoutSessionId;
  if (patch.stripePaymentIntentId !== undefined)
    row.stripe_payment_intent_id = patch.stripePaymentIntentId;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.expiresAt !== undefined) row.expires_at = patch.expiresAt;
  if (patch.revokedAt !== undefined) row.revoked_at = patch.revokedAt;
  if (patch.failureCode !== undefined) row.failure_code = patch.failureCode;
  return row;
}

export class SupabaseReportRepository implements ReportRepository {
  async create(input: CreateReportInput): Promise<Report> {
    const { data, error } = await getSupabaseClient()
      .from("reports")
      .insert({
        token_hash: input.tokenHash,
        original_question: input.originalQuestion,
        locale: input.locale,
        domain_slug: input.domainSlug,
        eligibility: input.eligibility,
        price_version: input.priceVersion,
      })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as ReportRow);
  }

  async findById(id: string): Promise<Report | null> {
    const { data, error } = await getSupabaseClient()
      .from("reports")
      .select()
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as ReportRow) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Report | null> {
    const { data, error } = await getSupabaseClient()
      .from("reports")
      .select()
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as ReportRow) : null;
  }

  async findByCheckoutSessionId(sessionId: string): Promise<Report | null> {
    const { data, error } = await getSupabaseClient()
      .from("reports")
      .select()
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as ReportRow) : null;
  }

  async update(id: string, patch: Partial<Omit<Report, "id" | "createdAt">>): Promise<Report> {
    const { data, error } = await getSupabaseClient()
      .from("reports")
      .update(toRowPatch(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as ReportRow);
  }
}
