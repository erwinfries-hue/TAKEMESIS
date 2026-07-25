import { describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/openalex-works.json";
import { openAlexAdapter, reconstructAbstract } from "./openalex";

function mockFetchReturning(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe("reconstructAbstract", () => {
  it("reconstructs plain text from an inverted index", () => {
    expect(
      reconstructAbstract({ The: [0], cat: [1], sat: [2] }),
    ).toBe("The cat sat");
  });

  it("returns null for a missing or empty index", () => {
    expect(reconstructAbstract(null)).toBeNull();
    expect(reconstructAbstract(undefined)).toBeNull();
    expect(reconstructAbstract({})).toBeNull();
  });
});

describe("openAlexAdapter.search", () => {
  it("normalizes OpenAlex works into NormalizedRecord shape", async () => {
    vi.stubGlobal("fetch", mockFetchReturning(fixture));

    const records = await openAlexAdapter.search({ query: "spaced repetition", limit: 15 });

    expect(records).toHaveLength(2);

    const [first, second] = records;
    expect(first.source).toBe("openalex");
    expect(first.title).toContain("Retrieval Practice");
    expect(first.authors).toEqual(["Jeffrey D. Karpicke", "Janell R. Blunt"]);
    expect(first.venue).toBe("Science");
    expect(first.year).toBe(2011);
    expect(first.abstract).toContain("Practicing retrieval improves");
    expect(first.dataCompleteness).toBe("abstract");
    expect(first.isOpenAccess).toBe(true);
    expect(first.retractionStatus).toBe("none");

    expect(second.publicationType).toBe("systematic_review");
    expect(second.abstract).toBeNull();
    expect(second.dataCompleteness).toBe("metadata_only");
    expect(second.doi).toBeNull();

    vi.unstubAllGlobals();
  });

  it("degrades safely (throws a typed error) when the source is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await expect(
      openAlexAdapter.search({ query: "anything" }),
    ).rejects.toMatchObject({ source: "openalex" });

    vi.unstubAllGlobals();
  });
});

describe("openAlexAdapter.checkStatus", () => {
  it("reports ok:true on a successful response", async () => {
    vi.stubGlobal("fetch", mockFetchReturning({ results: [] }));
    const status = await openAlexAdapter.checkStatus();
    expect(status).toMatchObject({ source: "openalex", ok: true });
    vi.unstubAllGlobals();
  });

  it("reports ok:false with an error message when unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const status = await openAlexAdapter.checkStatus();
    expect(status.ok).toBe(false);
    expect(status.error).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
