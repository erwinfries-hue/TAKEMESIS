import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import esearchFixture from "./fixtures/ncbi-esearch.json";
import esummaryFixture from "./fixtures/ncbi-esummary.json";
import { ncbiAdapter } from "./ncbi";

const efetchFixture = readFileSync(join(__dirname, "fixtures/ncbi-efetch.xml"), "utf-8");
const EMPTY_EFETCH = "<PubmedArticleSet></PubmedArticleSet>";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

function textResponse(body: string, ok = true, status = 200): Response {
  return { ok, status, text: async () => body } as Response;
}

describe("ncbiAdapter.search", () => {
  it("joins multi-word queries with explicit AND (live bug 2026-07-28: bare terms returned unrelated results)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(esearchFixture))
      .mockResolvedValueOnce(jsonResponse(esummaryFixture))
      .mockResolvedValueOnce(textResponse(EMPTY_EFETCH));
    vi.stubGlobal("fetch", fetchImpl);

    await ncbiAdapter.search({ query: "creatine muscle growth" });
    const esearchUrl = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(esearchUrl.searchParams.get("term")).toBe("creatine AND muscle AND growth");

    vi.unstubAllGlobals();
  });

  it("chains esearch -> esummary -> efetch and normalizes into NormalizedRecord shape, including abstracts", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(esearchFixture))
      .mockResolvedValueOnce(jsonResponse(esummaryFixture))
      .mockResolvedValueOnce(textResponse(efetchFixture));
    vi.stubGlobal("fetch", fetchImpl);

    const records = await ncbiAdapter.search({ query: "interval training VO2max" });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0][0]).toContain("esearch.fcgi");
    expect(fetchImpl.mock.calls[1][0]).toContain("esummary.fcgi");
    expect(fetchImpl.mock.calls[2][0]).toContain("efetch.fcgi");

    expect(records).toHaveLength(2);
    const [first, second] = records;

    expect(first.source).toBe("ncbi_pubmed");
    expect(first.sourceId).toBe("30000001");
    expect(first.authors).toEqual(["Fixture E", "Fixture F"]);
    expect(first.year).toBe(2018);
    expect(first.doi).toBe("10.1000/fixture.ncbi.001");
    expect(first.publicationType).toBe("rct");
    expect(first.sourceUrl).toBe("https://pubmed.ncbi.nlm.nih.gov/30000001/");
    // efetch's structured abstract (Label-prefixed paragraphs) is joined into one string.
    expect(first.abstract).toContain("BACKGROUND: Interval training is widely used");
    expect(first.abstract).toContain("METHODS: Fixture participants");
    expect(first.abstract).toContain("RESULTS: VO2max increased significantly");
    expect(first.dataCompleteness).toBe("abstract");

    expect(second.doi).toBeNull();
    expect(second.publicationType).toBe("review");
    expect(second.year).toBe(2020);
    // efetch's plain, unstructured abstract (no Label attribute).
    expect(second.abstract).toBe(
      "This narrative review summarizes fixture evidence on cold exposure and recovery.",
    );
    expect(second.dataCompleteness).toBe("abstract");

    vi.unstubAllGlobals();
  });

  it("degrades to metadata-only records when efetch fails, without failing the whole search", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(esearchFixture))
      .mockResolvedValueOnce(jsonResponse(esummaryFixture))
      // No "Once": every retry attempt inside fetchText's own retry loop
      // rejects consistently too, instead of falling through to an
      // undefined return once the mock queue is exhausted.
      .mockRejectedValue(new Error("efetch down"));
    vi.stubGlobal("fetch", fetchImpl);

    const records = await ncbiAdapter.search({ query: "interval training VO2max" });
    expect(records).toHaveLength(2);
    expect(records.every((record) => record.abstract === null)).toBe(true);
    expect(records.every((record) => record.dataCompleteness === "metadata_only")).toBe(true);

    vi.unstubAllGlobals();
  });

  it("short-circuits to an empty array when esearch finds no ids (no wasted esummary/efetch calls)", async () => {
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
