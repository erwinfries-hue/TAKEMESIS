import { describe, expect, it, vi } from "vitest";
import { fetchJson, fetchText } from "./http";
import { SourceAdapterError } from "./types";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ hello: "world" }));
    const result = await fetchJson("https://example.test", {
      source: "openalex",
      fetchImpl,
    });
    expect(result).toEqual({ hello: "world" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await fetchJson("https://example.test", {
      source: "crossref",
      fetchImpl,
      maxRetries: 2,
      timeoutMs: 1000,
    });
    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws a SourceAdapterError after exhausting retries", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("still down"));

    await expect(
      fetchJson("https://example.test", {
        source: "europe_pmc",
        fetchImpl,
        maxRetries: 1,
        timeoutMs: 1000,
      }),
    ).rejects.toBeInstanceOf(SourceAdapterError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws a SourceAdapterError on a non-2xx response without retrying further than configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 503));

    await expect(
      fetchJson("https://example.test", {
        source: "ncbi_pubmed",
        fetchImpl,
        maxRetries: 0,
        timeoutMs: 1000,
      }),
    ).rejects.toThrow(/ncbi_pubmed request failed/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("carries the response status onto the final thrown error, not just the intermediate one", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 404));

    await expect(
      fetchJson("https://example.test", {
        source: "crossref",
        fetchImpl,
        maxRetries: 0,
        timeoutMs: 1000,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  // Live bug found 2026-07-29 (OPEN_RISKS.md #27): a real rate limit (429)
  // used to get the same ~300-600ms backoff as a transient network blip,
  // nowhere near enough to survive an actual rate-limit window.
  it("honors a Retry-After header (delta-seconds) on a 429 instead of the generic short backoff", async () => {
    vi.useFakeTimers();
    try {
      const response429 = {
        ok: false,
        status: 429,
        headers: { get: (name: string) => (name === "retry-after" ? "2" : null) },
        json: async () => ({}),
      } as unknown as Response;
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(response429)
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const promise = fetchJson("https://example.test", {
        source: "openalex",
        fetchImpl,
        maxRetries: 1,
        timeoutMs: 1000,
      });

      // Advancing only 1000ms (the generic-error backoff) must not be
      // enough — the 2-second Retry-After hint has to be respected.
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;
      expect(result).toEqual({ ok: true });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("caps the Retry-After-derived delay so a slow source can't blow the caller's own time budget", async () => {
    vi.useFakeTimers();
    try {
      const response429 = {
        ok: false,
        status: 429,
        headers: { get: (name: string) => (name === "retry-after" ? "60" : null) },
        json: async () => ({}),
      } as unknown as Response;
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(response429)
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const promise = fetchJson("https://example.test", {
        source: "openalex",
        fetchImpl,
        maxRetries: 1,
        timeoutMs: 1000,
      });

      // A 60s Retry-After must be capped, not honored verbatim — 3s (the
      // documented cap) is already enough for the retry to fire.
      await vi.advanceTimersByTimeAsync(3000);
      const result = await promise;
      expect(result).toEqual({ ok: true });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still backs off (longer than a generic error) on a 429 with no Retry-After header", async () => {
    vi.useFakeTimers();
    try {
      const response429 = {
        ok: false,
        status: 429,
        headers: { get: () => null },
        json: async () => ({}),
      } as unknown as Response;
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(response429)
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const promise = fetchJson("https://example.test", {
        source: "crossref",
        fetchImpl,
        maxRetries: 1,
        timeoutMs: 1000,
      });

      // The generic backoff for attempt 0 would be 300ms — a 429 without
      // Retry-After must wait longer than that.
      await vi.advanceTimersByTimeAsync(300);
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;
      expect(result).toEqual({ ok: true });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("fetchText", () => {
  it("returns the raw response body as text (arXiv's Atom XML, not JSON)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<feed><entry/></feed>",
    } as Response);

    const result = await fetchText("https://example.test", { source: "arxiv", fetchImpl });
    expect(result).toBe("<feed><entry/></feed>");
  });

  it("throws a SourceAdapterError on a non-2xx response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "",
    } as Response);

    await expect(
      fetchText("https://example.test", { source: "arxiv", fetchImpl, maxRetries: 0 }),
    ).rejects.toBeInstanceOf(SourceAdapterError);
  });
});
