import { describe, expect, it, vi } from "vitest";
import esearchFixture from "./fixtures/ncbi-esearch.json";
import esummaryFixture from "./fixtures/ncbi-esummary.json";
import { ncbiAdapter } from "./ncbi";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("ncbiAdapter.search", () => {
  it("chains esearch -> esummary and normalizes into NormalizedRecord shape", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(esearchFixture))
      .mockResolvedValueOnce(jsonResponse(esummaryFixture));
    vi.stubGlobal("fetch", fetchImpl);

    const records = await ncbiAdapter.search({ query: "interval training VO2max" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toContain("esearch.fcgi");
    expect(fetchImpl.mock.calls[1][0]).toContain("esummary.fcgi");

    expect(records).toHaveLength(2);
    const [first, second] = records;

    expect(first.source).toBe("ncbi_pubmed");
    expect(first.sourceId).toBe("30000001");
    expect(first.authors).toEqual(["Fixture E", "Fixture F"]);
    expect(first.year).toBe(2018);
    expect(first.doi).toBe("10.1000/fixture.ncbi.001");
    expect(first.publicationType).toBe("rct");
    expect(first.sourceUrl).toBe("https://pubmed.ncbi.nlm.nih.gov/30000001/");
    // esummary never carries abstract text — must stay honestly metadata-only.
    expect(first.abstract).toBeNull();
    expect(first.dataCompleteness).toBe("metadata_only");

    expect(second.doi).toBeNull();
    expect(second.publicationType).toBe("review");
    expect(second.year).toBe(2020);

    vi.unstubAllGlobals();
  });

  it("short-circuits to an empty array when esearch finds no ids (no wasted esummary call)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ esearchresult: { idlist: [] } }));
    vi.stubGlobal("fetch", fetchImpl);

    const records = await ncbiAdapter.search({ query: "zzzz nothing matches" });
    expect(records).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("degrades safely when esearch itself is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(ncbiAdapter.search({ query: "x" })).rejects.toMatchObject({
      source: "ncbi_pubmed",
    });
    vi.unstubAllGlobals();
  });
});
