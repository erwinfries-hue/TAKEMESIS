import "server-only";
import { SupabaseSubscriptionRepository } from "./supabase-subscription-repository";
import type { SubscriptionRepository } from "./subscription-repository";
import { SupabaseStudyCacheRepository } from "@/lib/studies/supabase-study-cache-repository";
import type { StudyCacheRepository } from "@/lib/studies/study-cache-repository";
import { buildDigestSections } from "./digest-content";
import { buildUnsubscribeUrl } from "./unsubscribe-token";
import { sendEmail as defaultSendEmail } from "@/lib/email/send";
import { buildTopicDigestEmail } from "@/lib/email/templates";
import { getTopic, topicCopy } from "@/content/topics";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";

export interface RunTopicDigestDeps {
  subscriptionRepository?: SubscriptionRepository;
  studyCacheRepository?: StudyCacheRepository;
  sendEmail?: typeof defaultSendEmail;
  now?: () => Date;
}

export interface RunTopicDigestResult {
  checked: number;
  sent: string[];
  skippedNoNewStudies: string[];
  failed: { subscriptionId: string; reason: string }[];
}

/**
 * Weekly Themen-Digest sweep (docs/OPEN_RISKS.md item #25's 2026-08-04
 * decision), driven by the cron route. For each subscription, only studies
 * first cached after its `lastSentAt` (or `createdAt` if never sent) count
 * as "new" — that window only advances when a send actually succeeds, so a
 * quiet stretch never loses studies, it just accumulates them into the next
 * send that has something to report.
 */
export async function runTopicDigest(deps: RunTopicDigestDeps = {}): Promise<RunTopicDigestResult> {
  const subscriptionRepository = deps.subscriptionRepository ?? new SupabaseSubscriptionRepository();
  const studyCacheRepository = deps.studyCacheRepository ?? new SupabaseStudyCacheRepository();
  const sendEmail = deps.sendEmail ?? defaultSendEmail;
  const now = deps.now ?? (() => new Date());

  const subscriptions = await subscriptionRepository.listAll();
  const sent: string[] = [];
  const skippedNoNewStudies: string[] = [];
  const failed: { subscriptionId: string; reason: string }[] = [];

  for (const subscription of subscriptions) {
    const sinceIso = subscription.lastSentAt ?? subscription.createdAt;

    let sections;
    try {
      sections = await buildDigestSections(subscription.topicSlugs, sinceIso, studyCacheRepository);
    } catch (error) {
      console.error(`Topic digest: content build failed for subscription ${subscription.id}`, error);
      failed.push({ subscriptionId: subscription.id, reason: "content_build_failed" });
      continue;
    }

    if (sections.length === 0) {
      skippedNoNewStudies.push(subscription.id);
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(clientEnv.NEXT_PUBLIC_APP_BASE_URL, subscription.id);
    if (!unsubscribeUrl) {
      // TOPIC_DIGEST_SECRET not configured — refuse to send rather than ship a mail with a broken/no unsubscribe link.
      failed.push({ subscriptionId: subscription.id, reason: "unsubscribe_link_unavailable" });
      continue;
    }

    try {
      await sendEmail({
        to: subscription.email,
        content: buildTopicDigestEmail({
          locale: subscription.locale,
          sections: sections.map((section) => {
            const topic = getTopic(section.topicSlug);
            return {
              topicName: topic ? topicCopy(topic, subscription.locale).name : section.topicSlug,
              studies: section.studies.map((study) => ({
                title: study.title,
                venue: study.venue,
                year: study.year,
                sourceUrl: study.sourceUrl,
                doi: study.doi,
              })),
            };
          }),
          browseUrl: `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/topics`,
          unsubscribeUrl,
          supportEmail: serverEnv.SUPPORT_EMAIL,
        }),
      });
      await subscriptionRepository.update(subscription.id, { lastSentAt: now().toISOString() });
      sent.push(subscription.id);
    } catch (error) {
      console.error(`Topic digest: send failed for subscription ${subscription.id}`, error);
      failed.push({ subscriptionId: subscription.id, reason: "send_failed" });
    }
  }

  return { checked: subscriptions.length, sent, skippedNoNewStudies, failed };
}
