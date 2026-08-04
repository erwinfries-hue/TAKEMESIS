import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { TopicDigestSignup } from "./topic-digest-signup";

const dict = getDictionary("de").topicDigestSignup;

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("TopicDigestSignup", () => {
  it("shows the heading, email input, and submit button", () => {
    render(<TopicDigestSignup dict={dict} locale="de" topicSlug="schlaf-regeneration" />);
    expect(screen.getByText(dict.heading)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.submitLabel })).toBeInTheDocument();
  });

  it("submits the email, topic slug, and locale to the subscribe route", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchImpl);

    render(<TopicDigestSignup dict={dict} locale="de" topicSlug="schlaf-regeneration" />);
    fireEvent.change(screen.getByPlaceholderText(dict.emailPlaceholder), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: dict.submitLabel }));

    await waitFor(() => expect(screen.getByText(dict.successBody)).toBeInTheDocument());
    expect(fetchImpl).toHaveBeenCalledWith("/api/topics/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@example.com", topicSlug: "schlaf-regeneration", locale: "de" }),
    });

    vi.unstubAllGlobals();
  });

  it("shows the rate-limited message on a 429 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 429)));

    render(<TopicDigestSignup dict={dict} locale="de" topicSlug="schlaf-regeneration" />);
    fireEvent.change(screen.getByPlaceholderText(dict.emailPlaceholder), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: dict.submitLabel }));

    await waitFor(() => expect(screen.getByText(dict.rateLimitedBody)).toBeInTheDocument());

    vi.unstubAllGlobals();
  });

  it("shows a generic error message on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<TopicDigestSignup dict={dict} locale="de" topicSlug="schlaf-regeneration" />);
    fireEvent.change(screen.getByPlaceholderText(dict.emailPlaceholder), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: dict.submitLabel }));

    await waitFor(() => expect(screen.getByText(dict.errorBody)).toBeInTheDocument());

    vi.unstubAllGlobals();
  });
});
