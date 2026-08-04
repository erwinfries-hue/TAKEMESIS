import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { SubscriptionRepository } from "./subscription-repository";
import type { CreateSubscriptionInput, TopicSubscription } from "./types";

/** Untested against a live database — same caveat as every other Supabase repository in this app (see docs/OPEN_RISKS.md). */
interface SubscriptionRow {
  id: string;
  email: string;
  locale: TopicSubscription["locale"];
  topic_slugs: string[];
  created_at: string;
  last_sent_at: string | null;
}

function toDomain(row: SubscriptionRow): TopicSubscription {
  return {
    id: row.id,
    email: row.email,
    locale: row.locale,
    topicSlugs: row.topic_slugs,
    createdAt: row.created_at,
    lastSentAt: row.last_sent_at,
  };
}

function toRowPatch(patch: Partial<Omit<TopicSubscription, "id" | "createdAt">>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.locale !== undefined) row.locale = patch.locale;
  if (patch.topicSlugs !== undefined) row.topic_slugs = patch.topicSlugs;
  if (patch.lastSentAt !== undefined) row.last_sent_at = patch.lastSentAt;
  return row;
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async findByEmail(email: string): Promise<TopicSubscription | null> {
    const { data, error } = await getSupabaseClient()
      .from("topic_subscriptions")
      .select()
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as SubscriptionRow) : null;
  }

  async findById(id: string): Promise<TopicSubscription | null> {
    const { data, error } = await getSupabaseClient()
      .from("topic_subscriptions")
      .select()
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as SubscriptionRow) : null;
  }

  async create(input: CreateSubscriptionInput): Promise<TopicSubscription> {
    const { data, error } = await getSupabaseClient()
      .from("topic_subscriptions")
      .insert({ email: input.email, locale: input.locale, topic_slugs: input.topicSlugs })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as SubscriptionRow);
  }

  async update(
    id: string,
    patch: Partial<Omit<TopicSubscription, "id" | "createdAt">>,
  ): Promise<TopicSubscription> {
    const { data, error } = await getSupabaseClient()
      .from("topic_subscriptions")
      .update(toRowPatch(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as SubscriptionRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from("topic_subscriptions").delete().eq("id", id);
    if (error) throw error;
  }

  async listAll(): Promise<TopicSubscription[]> {
    const { data, error } = await getSupabaseClient()
      .from("topic_subscriptions")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as SubscriptionRow[]).map(toDomain);
  }
}
