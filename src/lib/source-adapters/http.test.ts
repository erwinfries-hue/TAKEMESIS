import { describe, expect, it, vi } from "vitest";
import { fetchJson } from "./http";
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
});
