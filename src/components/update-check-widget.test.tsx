import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { UpdateCheckWidget } from "./update-check-widget";

const dict = getDictionary("de").updateCheck;

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("UpdateCheckWidget", () => {
  it("shows the button and description with the email interpolated", () => {
    render(
      <UpdateCheckWidget
        dict={dict}
        token="tok"
        email="buyer@example.com"
        initiallyRateLimited={false}
      />,
    );
    expect(screen.getByText(/buyer@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.buttonLabel })).toBeInTheDocument();
  });

  it("shows the rate-limited message up front instead of a button, when the server says so", () => {
    render(
      <UpdateCheckWidget dict={dict} token="tok" email="a@b.com" initiallyRateLimited={true} />,
    );
    expect(screen.getByText(dict.rateLimitedBody)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dict.buttonLabel })).not.toBeInTheDocument();
  });

  it("posts to the report's check-updates route and shows the 'found' outcome", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, newStudyCount: 2 }));
    vi.stubGlobal("fetch", fetchImpl);

    render(
      <UpdateCheckWidget
        dict={dict}
        token="my-token"
        email="a@b.com"
        initiallyRateLimited={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dict.buttonLabel }));

    expect(fetchImpl).toHaveBeenCalledWith("/api/report/my-token/check-updates", {
      method: "POST",
    });
    await waitFor(() => expect(screen.getByText(dict.successHeadingFound)).toBeInTheDocument());
    expect(screen.getByText(dict.successBodyFound.replace("{count}", "2"))).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows the 'none found' outcome distinctly from the 'found' outcome", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: true, newStudyCount: 0 })));

    render(
      <UpdateCheckWidget dict={dict} token="tok" email="a@b.com" initiallyRateLimited={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: dict.buttonLabel }));

    await waitFor(() => expect(screen.getByText(dict.successHeadingNone)).toBeInTheDocument());
    expect(screen.getByText(dict.successBodyNone)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows the rate-limited message when the route answers 409 after a click", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 409)));

    render(
      <UpdateCheckWidget dict={dict} token="tok" email="a@b.com" initiallyRateLimited={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: dict.buttonLabel }));

    await waitFor(() => expect(screen.getByText(dict.rateLimitedBody)).toBeInTheDocument());

    vi.unstubAllGlobals();
  });

  it("shows a generic error message on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(
      <UpdateCheckWidget dict={dict} token="tok" email="a@b.com" initiallyRateLimited={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: dict.buttonLabel }));

    await waitFor(() => expect(screen.getByText(dict.errorBody)).toBeInTheDocument());

    vi.unstubAllGlobals();
  });
});
