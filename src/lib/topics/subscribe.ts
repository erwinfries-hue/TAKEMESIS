import "server-only";
import type { Locale } from "@/lib/i18n/config";
import type { SubscriptionRepository } from "./subscription-repository";
import type { TopicSubscription } from "./types";

export interface SubscribeToTopicDigestInput {
  email: string;
  locale: Locale;
  topicSlug: string;
}

/** Normalizes the same way on every read/write path so "A@x.com" and "a@x.com" are always the same subscriber. */
export function normalizeSubscriptionEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates a new subscription, or — if this email already subscribed to a
 * different topic before — merges the topic into the existing row instead
 * of creating a duplicate. One subscriber gets one weekly digest covering
 * every topic they opted into, never one email per topic (decision: see
 * docs/OPEN_RISKS.md item #25's 2026-08-04 update).
 */
export async function subscribeToTopicDigest(
  input: SubscribeToTopicDigestInput,
  repository: SubscriptionRepository,
): Promise<TopicSubscription> {
  const email = normalizeSubscriptionEmail(input.email);
  const existing = await repository.findByEmail(email);

  if (!existing) {
    return repository.create({ email, locale: input.locale, topicSlugs: [input.topicSlug] });
  }

  if (existing.topicSlugs.includes(input.topicSlug)) {
    return existing;
  }

  return repository.update(existing.id, {
    topicSlugs: [...existing.topicSlugs, input.topicSlug],
  });
}
