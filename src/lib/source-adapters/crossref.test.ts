import { describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/crossref-works.json";
import { crossrefAdapter, lookupByDoi, stripJatsTags } from "./crossref";

function mockFetchReturning(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe("stripJatsTags", () => {
  it("strips JATS tags and collapses whitespace", () => {
    expect(stripJatsTags("<jats:p>Hello   world.</jats:p>")).toBe("Hello world.");
  });

  it("returns null for empty or missing input", () => {
    expect(stripJatsTags(null)).toBeNull();
    expect(stripJatsTags(undefined)).toBeNull();
    expect(stripJatsTags("<jats:p></jats:p>")).toBeNull();
  });
});

describe("crossrefAdapter.search", () => {
  it("normalizes Crossref items into NormalizedRecord shape", async () => {
    vi.stubGlobal("fetch", mockFetchReturning(fixture));

    const records = await crossrefAdapter.search({ query: "distributed practice" });
    expect(records).toHaveLength(2);

    const [first, second] = records;
    expect(first.source).toBe("crossref");
    expect(first.doi).toBe("10.1000/fixture.crossref.001");
    expect(first.authors).toEqual(["Nicholas J. Cepeda", "Harold Pashler"]);
    expect(first.venue).toBe("Psychological Bulletin");
    expect(first.year).toBe(2006);
    expect(first.abstract).toBe(
      "This meta-analysis examines distributed practice effects on verbal recall.",
    );
    expect(first.dataCompleteness).toBe("abstract");
    expect(first.isOpenAccess).toBeNull();
    expect(first.retractionStatus).toBe("unknown");

    expect(second.authors).toEqual(["Fixture Research Group"]);
    expect(second.year).toBe(2011);
    expect(second.abstract).toBeNull();
    expect(second.dataCompleteness).toBe("metadata_only");
    expect(second.retractionStatus).toBe("corrected");

    vi.unstubAllGlobals();
  });

  it("degrades safely when the source is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(crossrefAdapter.search({ query: "x" })).rejects.toMatchObject({
      source: "crossref",
    });
    vi.unstubAllGlobals();
  });
});

describe("lookupByDoi", () => {
  it("returns the normalized record for a known DOI", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchReturning({ message: fixture.message.items[0] }),
    );

    const record = await lookupByDoi("10.1000/fixture.crossref.001");
    expect(record?.doi).toBe("10.1000/fixture.crossref.001");
    expect(record?.title).toBe(
      "Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis",
    );
    vi.unstubAllGlobals();
  });

  it("returns null for a DOI Crossref doesn't know about (404), without throwing", async () => {
    vi.stubGlobal("fetch", mockFetchReturning({}, false, 404));
    const record = await lookupByDoi("10.9999/does-not-exist");
    expect(record).toBeNull();
    vi.unstubAllGlobals();
  });

  it("still throws for a real failure (not a 404)", async () => {
    vi.stubGlobal("fetch", mockFetchReturning({}, false, 500));
    await expect(lookupByDoi("10.1000/fixture.crossref.001")).rejects.toMatchObject({
      source: "crossref",
    });
    vi.unstubAllGlobals();
  });

  it("propagates a network failure rather than treating it as not-found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(lookupByDoi("10.1000/fixture.crossref.001")).rejects.toMatchObject({
      source: "crossref",
    });
    vi.unstubAllGlobals();
  });
});
