import { describe, expect, it, vi } from "vitest";
import { forwardToPostHog } from "./posthog";

describe("forwardToPostHog", () => {
  it("calls capture on the injected client", () => {
    const capture = vi.fn();
    forwardToPostHog("eligible", { topicSlug: "lernen-bildung" }, "session-1", { capture });
    expect(capture).toHaveBeenCalledWith({
      distinctId: "session-1",
      event: "eligible",
      properties: { topicSlug: "lernen-bildung" },
    });
  });

  it("is a safe no-op when the client is null (analytics disabled/unconfigured)", () => {
    expect(() => forwardToPostHog("eligible", {}, "session-1", null)).not.toThrow();
  });

  it("defaults distinctId to 'anonymous' when no session id is given", () => {
    const capture = vi.fn();
    forwardToPostHog("landing_viewed", {}, undefined, { capture });
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: "anonymous" }),
    );
  });
});
