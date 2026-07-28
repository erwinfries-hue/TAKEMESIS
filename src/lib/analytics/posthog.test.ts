import { describe, expect, it, vi } from "vitest";
import { forwardToPostHog } from "./posthog";

describe("forwardToPostHog", () => {
  it("calls capture on the injected client", async () => {
    const capture = vi.fn();
    await forwardToPostHog("eligible", { topicSlug: "lernen-bildung" }, "session-1", { capture });
    expect(capture).toHaveBeenCalledWith({
      distinctId: "session-1",
      event: "eligible",
      properties: { topicSlug: "lernen-bildung" },
    });
  });

  it("is a safe no-op when the client is null (analytics disabled/unconfigured)", async () => {
    await expect(
      forwardToPostHog("eligible", {}, "session-1", null),
    ).resolves.toBeUndefined();
  });

  it("defaults distinctId to 'anonymous' when no session id is given", async () => {
    const capture = vi.fn();
    await forwardToPostHog("landing_viewed", {}, undefined, { capture });
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: "anonymous" }),
    );
  });

  it("awaits flush() when the client provides one — a serverless function can freeze right after the response is sent, before posthog-node's own batch timer would otherwise fire", async () => {
    const capture = vi.fn();
    const flush = vi.fn().mockResolvedValue(undefined);
    await forwardToPostHog("eligible", {}, "session-1", { capture, flush });
    expect(flush).toHaveBeenCalledOnce();
  });

  it("does not throw when the client has no flush method", async () => {
    const capture = vi.fn();
    await expect(
      forwardToPostHog("eligible", {}, "session-1", { capture }),
    ).resolves.toBeUndefined();
  });
});
