import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    SUPPORT_EMAIL: "support@tekmesis.com",
    RATE_LIMIT_SECRET: "test-rate-secret",
    TOPIC_DIGEST_SECRET: "test-digest-secret",
  },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { handleTopicSubscribeRequest } from "./topic-subscribe-route-handler";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";
import { InMemoryRateLimiter } from "@/lib/security/in-memory-rate-limiter";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/topics/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("handleTopicSubscribeRequest", () => {
  it("creates a new subscription and sends a confirmation email", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const response = await handleTopicSubscribeRequest(
      request({ email: "a@example.com", topicSlug: "schlaf-regeneration", locale: "de" }),
      { subscriptionRepository, sendEmail, rateLimiter: new InMemoryRateLimiter() },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, topicSlugs: ["schlaf-regeneration"] });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }));
    expect(await subscriptionRepository.findByEmail("a@example.com")).not.toBeNull();
  });

  it("rejects an unknown topic slug", async () => {
    const response = await handleTopicSubscribeRequest(
      request({ email: "a@example.com", topicSlug: "not-a-real-topic", locale: "de" }),
      { subscriptionRepository: new InMemorySubscriptionRepository(), rateLimiter: new InMemoryRateLimiter() },
    );
    expect(response.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const response = await handleTopicSubscribeRequest(
      request({ email: "not-an-email", topicSlug: "schlaf-regeneration", locale: "de" }),
      { subscriptionRepository: new InMemorySubscriptionRepository(), rateLimiter: new InMemoryRateLimiter() },
    );
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const malformed = new Request("http://localhost/api/topics/subscribe", {
      method: "POST",
      body: "not json",
    });
    const response = await handleTopicSubscribeRequest(malformed, {
      subscriptionRepository: new InMemorySubscriptionRepository(),
      rateLimiter: new InMemoryRateLimiter(),
    });
    expect(response.status).toBe(400);
  });

  it("returns 429 once the per-IP daily limit is exceeded", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const rateLimiter = new InMemoryRateLimiter();

    let lastResponse: Response | null = null;
    for (let i = 0; i < 11; i++) {
      lastResponse = await handleTopicSubscribeRequest(
        request(
          { email: `user${i}@example.com`, topicSlug: "schlaf-regeneration", locale: "de" },
          { "x-forwarded-for": "1.2.3.4" },
        ),
        { subscriptionRepository, sendEmail, rateLimiter },
      );
    }

    expect(lastResponse?.status).toBe(429);
  });

  it("still succeeds when the confirmation email send fails", async () => {
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const sendEmail = vi.fn().mockRejectedValue(new Error("provider down"));

    const response = await handleTopicSubscribeRequest(
      request({ email: "a@example.com", topicSlug: "schlaf-regeneration", locale: "de" }),
      { subscriptionRepository, sendEmail, rateLimiter: new InMemoryRateLimiter() },
    );

    expect(response.status).toBe(200);
    expect(await subscriptionRepository.findByEmail("a@example.com")).not.toBeNull();
  });
});
