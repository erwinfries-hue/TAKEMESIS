import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { TOPIC_DIGEST_SECRET: undefined },
}));

import {
  buildUnsubscribeUrl,
  signSubscriptionId,
  verifySubscriptionSignature,
} from "./unsubscribe-token";

describe("unsubscribe-token with TOPIC_DIGEST_SECRET unset", () => {
  it("refuses to sign or verify rather than produce a broken link", () => {
    expect(signSubscriptionId("sub-1")).toBeNull();
    expect(buildUnsubscribeUrl("https://tekmesis.com", "sub-1")).toBeNull();
    expect(verifySubscriptionSignature("sub-1", "abcd")).toBe(false);
  });
});
