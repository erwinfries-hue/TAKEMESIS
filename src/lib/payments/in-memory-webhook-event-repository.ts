import type { WebhookEventInput, WebhookEventRepository } from "./webhook-event-repository";

export class InMemoryWebhookEventRepository implements WebhookEventRepository {
  private readonly events = new Map<string, { processedAt: string | null }>();

  async recordIfNew(event: WebhookEventInput): Promise<boolean> {
    if (this.events.has(event.id)) {
      return false;
    }
    this.events.set(event.id, { processedAt: null });
    return true;
  }

  async markProcessed(id: string): Promise<void> {
    const existing = this.events.get(id);
    if (existing) {
      existing.processedAt = new Date().toISOString();
    }
  }
}
