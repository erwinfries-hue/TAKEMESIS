export interface WebhookEventInput {
  id: string;
  type: string;
  reportId: string | null;
  payload: unknown;
}

export interface WebhookEventRepository {
  /**
   * Idempotency guard: records the event and returns true the first time an
   * event ID is seen, false on every subsequent attempt (duplicate Stripe
   * delivery) — docs/09_MONETIZATION..md, "verified webhook / idempotent
   * processing". Callers must skip fulfillment entirely when this returns
   * false, not just skip re-sending a response.
   */
  recordIfNew(event: WebhookEventInput): Promise<boolean>;
  markProcessed(id: string): Promise<void>;
}
