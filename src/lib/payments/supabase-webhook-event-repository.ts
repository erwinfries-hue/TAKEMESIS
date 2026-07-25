import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { WebhookEventInput, WebhookEventRepository } from "./webhook-event-repository";

/** Postgres unique_violation — see https://www.postgresql.org/docs/current/errcodes-appendix.html */
const UNIQUE_VIOLATION = "23505";

/** Untested against a live database — see the same note in supabase-report-repository.ts. */
export class SupabaseWebhookEventRepository implements WebhookEventRepository {
  async recordIfNew(event: WebhookEventInput): Promise<boolean> {
    const { error } = await getSupabaseClient().from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      report_id: event.reportId,
      payload: event.payload,
    });
    if (!error) {
      return true;
    }
    if (error.code === UNIQUE_VIOLATION) {
      return false;
    }
    throw error;
  }

  async markProcessed(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("stripe_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
}
