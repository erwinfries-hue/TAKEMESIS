import "server-only";
import { verifySubscriptionSignature } from "./unsubscribe-token";
import { SupabaseSubscriptionRepository } from "./supabase-subscription-repository";
import type { SubscriptionRepository } from "./subscription-repository";
import { clientEnv } from "@/lib/env/client";

export interface TopicUnsubscribeRouteDeps {
  subscriptionRepository?: SubscriptionRepository;
}

/**
 * Core logic behind GET /api/topics/unsubscribe?id=...&sig=... — a direct
 * link click from an email client, so this is a GET that mutates state
 * (one-click unsubscribe, RFC 8058) rather than a JSON API: it deletes the
 * subscription outright (no "unsubscribed" tombstone — nothing here is an
 * opt-back-in list, so there's no reason to keep the row per CLAUDE.md "no
 * unnecessary personal data") and redirects to /topics with a confirmation
 * flag, idempotent so re-clicking an already-used link is a no-op, not an
 * error.
 */
export async function handleTopicUnsubscribeRequest(
  request: Request,
  deps: TopicUnsubscribeRouteDeps = {},
): Promise<Response> {
  const subscriptionRepository = deps.subscriptionRepository ?? new SupabaseSubscriptionRepository();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const signature = url.searchParams.get("sig");

  if (!id || !signature || !verifySubscriptionSignature(id, signature)) {
    return Response.json({ error: "invalid or expired unsubscribe link" }, { status: 400 });
  }

  try {
    const existing = await subscriptionRepository.findById(id);
    if (existing) {
      await subscriptionRepository.delete(id);
    }
  } catch (error) {
    console.error("Topic digest: unsubscribe failed", error);
    return Response.json({ error: "unsubscribe failed" }, { status: 502 });
  }

  return Response.redirect(`${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/topics?digest=unsubscribed`, 302);
}
