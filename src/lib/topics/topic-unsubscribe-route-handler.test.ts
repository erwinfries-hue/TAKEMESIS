import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { TOPIC_DIGEST_SECRET: "test-digest-secret" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { handleTopicUnsubscribeRequest } from "./topic-unsubscribe-route-handler";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";
import { buildUnsubscribeUrl } from "./unsubscribe-token";

function request(url: string) {
  return new Request(url);
}

describe("handleTopicUnsubscribeRequest", () => {
  it("deletes the subscription and redirects to /topics on a valid signed link", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const url = buildUnsubscribeUrl("https://tekmesis.com", subscription.id)!;

    const response = await handleTopicUnsubscribeRequest(request(url), { subscriptionRepository });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://tekmesis.com/topics?digest=unsubscribed");
    expect(await subscriptionRepository.findById(subscription.id)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });

    const response = await handleTopicUnsubscribeRequest(
      request(`https://tekmesis.com/api/topics/unsubscribe?id=${subscription.id}&sig=deadbeef`),
      { subscriptionRepository },
    );

    expect(response.status).toBe(400);
    expect(await subscriptionRepository.findById(subscription.id)).not.toBeNull();
  });

  it("is idempotent — re-visiting a link for an already-unsubscribed id still redirects", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscription = await subscriptionRepository.create({
      email: "a@example.com",
      locale: "de",
      topicSlugs: ["schlaf-regeneration"],
    });
    const url = buildUnsubscribeUrl("https://tekmesis.com", subscription.id)!;
    await handleTopicUnsubscribeRequest(request(url), { subscriptionRepository });

    const response = await handleTopicUnsubscribeRequest(request(url), { subscriptionRepository });

    expect(response.status).toBe(302);
  });

  it("rejects a request missing id or sig", async () => {
    const response = await handleTopicUnsubscribeRequest(
      request("https://tekmesis.com/api/topics/unsubscribe"),
      { subscriptionRepository: new InMemorySubscriptionRepository() },
    );
    expect(response.status).toBe(400);
  });
});
