import type { CreateSubscriptionInput, TopicSubscription } from "./types";

export interface SubscriptionRepository {
  findByEmail(email: string): Promise<TopicSubscription | null>;
  findById(id: string): Promise<TopicSubscription | null>;
  create(input: CreateSubscriptionInput): Promise<TopicSubscription>;
  update(
    id: string,
    patch: Partial<Omit<TopicSubscription, "id" | "createdAt">>,
  ): Promise<TopicSubscription>;
  delete(id: string): Promise<void>;
  /** Cron sweep use only — fine at beta scale, same caveat as ReportRepository.listAll. */
  listAll(): Promise<TopicSubscription[]>;
}
