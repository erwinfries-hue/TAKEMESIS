import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { TOPIC_DIGEST_SECRET: "test-digest-secret" },
}));

import {
  buildUnsubscribeUrl,
  signSubscriptionId,
  verifySubscriptionSignature,
} from "./unsubscribe-token";

describe("unsubscribe-token", () => {
  it("signs an id deterministically", () => {
    const a = signSubscriptionId("sub-1");
    const b = signSubscriptionId("sub-1");
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it("produces a different signature for a different id", () => {
    expect(signSubscriptionId("sub-1")).not.toBe(signSubscriptionId("sub-2"));
  });

  it("verifies a signature produced by signSubscriptionId", () => {
    const signature = signSubscriptionId("sub-1")!;
    expect(verifySubscriptionSignature("sub-1", signature)).toBe(true);
  });

  it("rejects a signature for the wrong id", () => {
    const signature = signSubscriptionId("sub-1")!;
    expect(verifySubscriptionSignature("sub-2", signature)).toBe(false);
  });

  it("rejects a garbage signature", () => {
    expect(verifySubscriptionSignature("sub-1", "not-a-real-signature")).toBe(false);
  });

  it("builds a working unsubscribe URL", () => {
    const url = buildUnsubscribeUrl("https://tekmesis.com", "sub-1");
    expect(url).toMatch(/^https:\/\/tekmesis\.com\/api\/topics\/unsubscribe\?id=sub-1&sig=[0-9a-f]+$/);
  });
});
