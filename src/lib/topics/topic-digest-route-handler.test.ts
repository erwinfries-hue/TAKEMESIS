import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { CRON_SECRET: "test-cron-secret" },
}));

import { handleTopicDigestRequest } from "./topic-digest-route-handler";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository";
import { InMemoryStudyCacheRepository } from "@/lib/studies/in-memory-study-cache-repository";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/topic-digest", { headers });
}

describe("handleTopicDigestRequest", () => {
  it("returns 401 when the Authorization header is missing", async () => {
    const response = await handleTopicDigestRequest(request(), {
      subscriptionRepository: new InMemorySubscriptionRepository(),
      studyCacheRepository: new InMemoryStudyCacheRepository(),
    });
    expect(response.status).toBe(401);
  });

  it("returns 401 when the bearer token does not match CRON_SECRET", async () => {
    const response = await handleTopicDigestRequest(
      request({ authorization: "Bearer wrong-secret" }),
      {
        subscriptionRepository: new InMemorySubscriptionRepository(),
        studyCacheRepository: new InMemoryStudyCacheRepository(),
      },
    );
    expect(response.status).toBe(401);
  });

  it("runs the sweep and returns a summary when authorized", async () => {
    const response = await handleTopicDigestRequest(
      request({ authorization: "Bearer test-cron-secret" }),
      {
        subscriptionRepository: new InMemorySubscriptionRepository(),
        studyCacheRepository: new InMemoryStudyCacheRepository(),
        sendEmail: vi.fn().mockResolvedValue(undefined),
      },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ checked: 0, sentCount: 0, skippedNoNewStudiesCount: 0, failed: [] });
  });
});
