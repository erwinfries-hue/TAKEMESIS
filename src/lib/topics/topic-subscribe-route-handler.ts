import "server-only";
import { z } from "zod";
import { getTopic, topicCopy } from "@/content/topics";
import { locales } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import { dailyWindowKey, hashRateLimitKey } from "@/lib/security/rate-limit-key";
import { getRateLimiter } from "@/lib/security/get-rate-limiter";
import type { RateLimiter } from "@/lib/security/rate-limiter";
import { TOPIC_SUBSCRIBE_DAILY_LIMIT } from "@/lib/security/limits";
import { subscribeToTopicDigest } from "./subscribe";
import { SupabaseSubscriptionRepository } from "./supabase-subscription-repository";
import type { SubscriptionRepository } from "./subscription-repository";
import { buildUnsubscribeUrl } from "./unsubscribe-token";
import { sendEmail as defaultSendEmail } from "@/lib/email/send";
import { buildTopicDigestConfirmationEmail } from "@/lib/email/templates";

const REQUEST_SCHEMA = z.object({
  email: z.string().trim().min(3).max(254).email(),
  topicSlug: z.string().min(1).max(100),
  locale: z.enum(locales),
});

export interface TopicSubscribeRouteDeps {
  subscriptionRepository?: SubscriptionRepository;
  sendEmail?: typeof defaultSendEmail;
  rateLimiter?: RateLimiter;
}

/**
 * Core logic behind POST /api/topics/subscribe, factored out for
 * testability — same pattern as report-chat-route-handler.ts. Public and
 * unauthenticated (no account exists to authenticate against — CLAUDE.md:
 * "no mandatory account"), so it's rate-limited per IP the same way
 * check-free-search-limit.ts protects /search.
 */
export async function handleTopicSubscribeRequest(
  request: Request,
  deps: TopicSubscribeRouteDeps = {},
): Promise<Response> {
  const subscriptionRepository = deps.subscriptionRepository ?? new SupabaseSubscriptionRepository();
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const rateLimiter = deps.rateLimiter ?? getRateLimiter();

  const clientIdentifier =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const hashedKey = hashRateLimitKey(`topic-subscribe:${clientIdentifier}`);
  if (hashedKey) {
    const { allowed } = await rateLimiter.consume(
      dailyWindowKey(hashedKey),
      TOPIC_SUBSCRIBE_DAILY_LIMIT,
    );
    if (!allowed) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = REQUEST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request body" }, { status: 400 });
  }

  const { email, topicSlug, locale } = parsed.data;
  const topic = getTopic(topicSlug);
  if (!topic) {
    return Response.json({ error: "unknown topic" }, { status: 400 });
  }

  let subscription;
  try {
    subscription = await subscribeToTopicDigest({ email, locale, topicSlug }, subscriptionRepository);
  } catch (error) {
    console.error("Topic digest: subscribe failed", error);
    return Response.json({ error: "subscribe failed" }, { status: 502 });
  }

  const unsubscribeUrl = buildUnsubscribeUrl(clientEnv.NEXT_PUBLIC_APP_BASE_URL, subscription.id);
  if (unsubscribeUrl) {
    try {
      await sendEmail({
        to: subscription.email,
        content: buildTopicDigestConfirmationEmail({
          locale: subscription.locale,
          topicNames: subscription.topicSlugs.map((slug) => {
            const t = getTopic(slug);
            return t ? topicCopy(t, subscription.locale).name : slug;
          }),
          browseUrl: `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/topics`,
          unsubscribeUrl,
          supportEmail: serverEnv.SUPPORT_EMAIL,
        }),
      });
    } catch (error) {
      // The subscription itself succeeded — a dropped confirmation email
      // shouldn't be reported as a failed signup. The unsubscribe link will
      // still work correctly whenever it's next needed (it's re-derived on
      // demand, never stored — see unsubscribe-token.ts).
      console.error("Topic digest: confirmation email failed", error);
    }
  } else {
    console.error("Topic digest: TOPIC_DIGEST_SECRET not configured, confirmation email skipped");
  }

  return Response.json({ ok: true, topicSlugs: subscription.topicSlugs });
}
