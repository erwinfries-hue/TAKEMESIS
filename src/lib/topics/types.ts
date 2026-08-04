import type { Locale } from "@/lib/i18n/config";

export interface TopicSubscription {
  id: string;
  email: string;
  locale: Locale;
  topicSlugs: string[];
  createdAt: string;
  /** Null until the first successful digest send — also the lower bound of the "new studies since" window for the next send. */
  lastSentAt: string | null;
}

export interface CreateSubscriptionInput {
  email: string;
  locale: Locale;
  topicSlugs: string[];
}
