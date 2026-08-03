import { describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/europe-pmc-search.json";
import { europePmcAdapter } from "./europe-pmc";

function mockFetchReturning(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe("europePmcAdapter.search", () => {
  it("normalizes Europe PMC results into NormalizedRecord shape", async () => {
    vi.stubGlobal("fetch", mockFetchReturning(fixture));

    const records = await europePmcAdapter.search({ query: "melatonin sleep" });
    expect(records).toHaveLength(2);

    const [first, second] = records;
    expect(first.source).toBe("europe_pmc");
    expect(first.authors).toEqual(["Fixture A", "Fixture B", "Fixture C."]);
    expect(first.year).toBe(2019);
    expect(first.publicationType).toBe("rct");
    expect(first.isOpenAccess).toBe(true);
    expect(first.dataCompleteness).toBe("abstract");
    expect(first.sourceUrl).toBe("https://europepmc.org/article/MED/31234567");

    expect(second.abstract).toBeNull();
    expect(second.dataCompleteness).toBe("metadata_only");
    expect(second.isOpenAccess).toBe(false);
    expect(second.doi).toBeNull();

    vi.unstubAllGlobals();
  });

  it("extracts MeSH descriptor names when present (resultType=core), for the study-region filter", async () => {
    vi.stubGlobal("fetch", mockFetchReturning(fixture));

    const records = await europePmcAdapter.search({ query: "melatonin sleep" });
    expect(records[0].meshHeadings).toEqual(["Humans", "Germany", "Sleep"]);
    // Fixture's second record has no meshHeadingList at all.
    expect(records[1].meshHeadings).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("requests resultType=core so Europe PMC includes meshHeadingList", async () => {
    const fetchImpl = mockFetchReturning(fixture);
    vi.stubGlobal("fetch", fetchImpl);

    await europePmcAdapter.search({ query: "melatonin sleep" });
    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.searchParams.get("resultType")).toBe("core");

    vi.unstubAllGlobals();
  });

  it("degrades safely when the source is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(europePmcAdapter.search({ query: "x" })).rejects.toMatchObject({
      source: "europe_pmc",
    });
    vi.unstubAllGlobals();
  });
});
