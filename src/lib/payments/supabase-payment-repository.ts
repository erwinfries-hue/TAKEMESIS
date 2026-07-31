import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { PaymentRepository } from "./payment-repository";
import type { CreatePaymentInput, Payment } from "./types";

/** Untested against a live database — see the same note in supabase-report-repository.ts. */
interface PaymentRow {
  id: string;
  report_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  amount_minor: number;
  currency: string;
  price_version: string;
  status: Payment["status"];
  mode: Payment["mode"];
  created_at: string;
  updated_at: string;
}

function toDomain(row: PaymentRow): Payment {
  return {
    id: row.id,
    reportId: row.report_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    priceVersion: row.price_version,
    status: row.status,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabasePaymentRepository implements PaymentRepository {
  async create(input: CreatePaymentInput): Promise<Payment> {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .insert({
        report_id: input.reportId,
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
        amount_minor: input.amountMinor,
        currency: input.currency,
        price_version: input.priceVersion,
        mode: input.mode,
      })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as PaymentRow);
  }

  async findByCheckoutSessionId(sessionId: string): Promise<Payment | null> {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .select()
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as PaymentRow) : null;
  }

  async update(id: string, patch: Partial<Omit<Payment, "id" | "createdAt">>): Promise<Payment> {
    const row: Record<string, unknown> = {};
    if (patch.stripePaymentIntentId !== undefined)
      row.stripe_payment_intent_id = patch.stripePaymentIntentId;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.amountMinor !== undefined) row.amount_minor = patch.amountMinor;
    if (patch.currency !== undefined) row.currency = patch.currency;

    const { data, error } = await getSupabaseClient()
      .from("payments")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as PaymentRow);
  }

  async listAll(): Promise<Payment[]> {
    const { data, error } = await getSupabaseClient()
      .from("payments")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as PaymentRow[]).map(toDomain);
  }
}
