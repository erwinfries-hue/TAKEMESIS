import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { SUPPORT_EMAIL: "support@tekmesis.com", TOPIC_DIGEST_SECRET: "test-digest-secret" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { runTopicDigest } from "./run-digest";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";
import { InMemoryStudyCacheRepository } from "@/lib/studies/in-memory-study-cache-repository";
import { makeRecord } from "@/lib/search/test-fixtures";
import type { ExtractedStudyFields } from "@/lib/ai/study-extraction";

const FIELDS: ExtractedStudyFields = {
  population: "Adults",
  intervention: "Creatine",
  outcome: "Muscle mass",
  result: "Modest increase",
  uncertainty: "95% CI reported",
  limitations: "Small sample",
  fundingConflicts: null,
};

describe("runTopicDigest", () => {
  it("skips a subscription with no new studies and does not advance lastSentAt", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const studyCacheRepository = new InMemoryStudyCacheRepository();
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await runTopicDigest({ subscriptionRepository, studyCacheRepository, sendEmail });

    expect(result.sent).toEqual([]);
    expect(result.skippedNoNewStudies).toEqual([subscription.id]);
    expect(sendEmail).not.toHaveBeenCalled();
    const updated = await subscriptionRepository.findById(subscription.id);
    expect(updated?.lastSentAt).toBeNull();
  });

  it("sends a digest and advances lastSentAt when a subscribed topic has new studies", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const studyCacheRepository = new InMemoryStudyCacheRepository();
    await new Promise((resolve) => setTimeout(resolve, 2));
    await studyCacheRepository.upsert({
      record: makeRecord({ doi: "10.1/new", title: "New Sleep Study" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await runTopicDigest({ subscriptionRepository, studyCacheRepository, sendEmail });

    expect(result.sent).toEqual([subscription.id]);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@example.com",
        content: expect.objectContaining({ html: expect.stringContaining("New Sleep Study") }),
      }),
    );
    const updated = await subscriptionRepository.findById(subscription.id);
    expect(updated?.lastSentAt).not.toBeNull();
  });

  it("records a failure and does not advance lastSentAt when the send fails", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const studyCacheRepository = new InMemoryStudyCacheRepository();
    await new Promise((resolve) => setTimeout(resolve, 2));
    await studyCacheRepository.upsert({
      record: makeRecord({ doi: "10.1/new" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });
    const sendEmail = vi.fn().mockRejectedValue(new Error("provider down"));

    const result = await runTopicDigest({ subscriptionRepository, studyCacheRepository, sendEmail });

    expect(result.sent).toEqual([]);
    expect(result.failed).toEqual([{ subscriptionId: subscription.id, reason: "send_failed" }]);
    const updated = await subscriptionRepository.findById(subscription.id);
    expect(updated?.lastSentAt).toBeNull();
  });

  it("keeps processing remaining subscriptions after one fails", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const first = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const second = await subscriptionRepository.create({
      email: "b@example.com",
      locale: "de",
      topicSlugs: ["lernen-bildung"],
    });
    const studyCacheRepository = new InMemoryStudyCacheRepository();
    await new Promise((resolve) => setTimeout(resolve, 2));
    await studyCacheRepository.upsert({
      record: makeRecord({ doi: "10.1/a" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });
    await studyCacheRepository.upsert({
      record: makeRecord({ doi: "10.1/b" }),
      aiFields: FIELDS,
      topicSlug: "lernen-bildung",
    });
    const sendEmail = vi
      .fn()
      .mockRejectedValueOnce(new Error("provider down"))
      .mockResolvedValueOnce(undefined);

    const result = await runTopicDigest({ subscriptionRepository, studyCacheRepository, sendEmail });

    expect(result.checked).toBe(2);
    expect(result.failed.map((f) => f.subscriptionId)).toContain(first.id);
    expect(result.sent).toContain(second.id);
  });
});
