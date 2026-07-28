import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { arxivAdapter } from "./arxiv";

const fixtureXml = readFileSync(join(__dirname, "fixtures/arxiv-feed.xml"), "utf-8");

function mockTextFetchReturning(body: string, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: async () => body,
  } as Response);
}

describe("arxivAdapter.search", () => {
  it("normalizes Atom entries into NormalizedRecord shape", async () => {
    vi.stubGlobal("fetch", mockTextFetchReturning(fixtureXml));

    const records = await arxivAdapter.search({ query: "distributed systems" });
    expect(records).toHaveLength(2);

    const [first, second] = records;
    expect(first.source).toBe("arxiv");
    expect(first.sourceId).toBe("2301.00001v2");
    expect(first.title).toBe("A Fixture Study on Distributed Systems Reliability");
    expect(first.authors).toEqual(["Ada Fixture", "Grace Testcase"]);
    expect(first.venue).toBe("arXiv");
    expect(first.year).toBe(2023);
    expect(first.doi).toBeNull();
    expect(first.abstract).toContain("reliability patterns in distributed");
    expect(first.isOpenAccess).toBe(true);
    expect(first.dataCompleteness).toBe("abstract");
    expect(first.subjectConcepts).toEqual(["cs.DC", "cs.NI"]);
    expect(first.sourceUrl).toBe("http://arxiv.org/abs/2301.00001v2");

    expect(second.doi).toBe("10.1000/fixture.arxiv.002");
    expect(second.venue).toBe("Phys. Rev. Fixture 12 (2023) 345");
    expect(second.authors).toEqual(["Fixture Research Group"]);

    vi.unstubAllGlobals();
  });

  it("degrades safely when the source is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(arxivAdapter.search({ query: "x" })).rejects.toMatchObject({
      source: "arxiv",
    });
    vi.unstubAllGlobals();
  });

  it("filters out arXiv's own error-entry response instead of misparsing it as a record", async () => {
    const errorFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/api/errors#incorrect_id_format_for_fixture</id>
    <title>Error</title>
    <summary>incorrect id format for fixture</summary>
  </entry>
</feed>`;
    vi.stubGlobal("fetch", mockTextFetchReturning(errorFeed));
    const records = await arxivAdapter.search({ query: "x" });
    expect(records).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe("arxivAdapter.checkStatus", () => {
  it("reports ok on a successful response", async () => {
    vi.stubGlobal("fetch", mockTextFetchReturning(fixtureXml));
    const status = await arxivAdapter.checkStatus();
    expect(status).toMatchObject({ source: "arxiv", ok: true });
    vi.unstubAllGlobals();
  });

  it("reports not-ok when the source is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const status = await arxivAdapter.checkStatus();
    expect(status.ok).toBe(false);
    expect(status.source).toBe("arxiv");
    vi.unstubAllGlobals();
  });
});
