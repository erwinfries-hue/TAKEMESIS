import { randomUUID } from "node:crypto";
import type { SubscriptionRepository } from "./subscription-repository";
import type { CreateSubscriptionInput, TopicSubscription } from "./types";

/** In-process implementation for tests and local development without a database. */
export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly subscriptions = new Map<string, TopicSubscription>();

  async findByEmail(email: string): Promise<TopicSubscription | null> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.email === email) {
        return subscription;
      }
    }
    return null;
  }

  async findById(id: string): Promise<TopicSubscription | null> {
    return this.subscriptions.get(id) ?? null;
  }

  async create(input: CreateSubscriptionInput): Promise<TopicSubscription> {
    const now = new Date().toISOString();
    const subscription: TopicSubscription = {
      id: randomUUID(),
      email: input.email,
      locale: input.locale,
      topicSlugs: input.topicSlugs,
      createdAt: now,
      lastSentAt: null,
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async update(
    id: string,
    patch: Partial<Omit<TopicSubscription, "id" | "createdAt">>,
  ): Promise<TopicSubscription> {
    const existing = this.subscriptions.get(id);
    if (!existing) {
      throw new Error(`Topic subscription ${id} not found`);
    }
    const updated: TopicSubscription = { ...existing, ...patch };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.subscriptions.delete(id);
  }

  async listAll(): Promise<TopicSubscription[]> {
    return Array.from(this.subscriptions.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}
