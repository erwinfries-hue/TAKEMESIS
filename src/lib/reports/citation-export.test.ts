import { describe, expect, it } from "vitest";
import type { PremiumSourceEntry } from "./premium-report";
import { toBibtex, toRis } from "./citation-export";

function entry(overrides: Partial<PremiumSourceEntry> = {}): PremiumSourceEntry {
  return {
    citation: "Jeffrey D. Karpicke (2011). Retrieval Practice Produces More Learning. Science.",
    doi: "10.1000/fixture.001",
    sourceUrl: "https://example.org/fixture-1",
    source: "openalex",
    authors: ["Jeffrey D. Karpicke", "Janell R. Blunt"],
    year: 2011,
    title: "Retrieval Practice Produces More Learning",
    venue: "Science",
    ...overrides,
  };
}

describe("toBibtex", () => {
  it("includes title, authors, year, venue, doi, and url", () => {
    const output = toBibtex([entry()]);
    expect(output).toContain("@misc{Karpicke2011_1,");
    expect(output).toContain("title = {Retrieval Practice Produces More Learning}");
    expect(output).toContain("author = {Jeffrey D. Karpicke and Janell R. Blunt}");
    expect(output).toContain("year = {2011}");
    expect(output).toContain("howpublished = {Science}");
    expect(output).toContain("doi = {10.1000/fixture.001}");
    expect(output).toContain("url = {https://example.org/fixture-1}");
  });

  it("omits fields that are null rather than inventing placeholder text", () => {
    const output = toBibtex([
      entry({ authors: [], year: null, venue: null, doi: null, sourceUrl: null }),
    ]);
    expect(output).not.toContain("author =");
    expect(output).not.toContain("year =");
    expect(output).not.toContain("howpublished =");
    expect(output).not.toContain("doi =");
    expect(output).not.toContain("url =");
  });

  it("falls back to a generic key when there are no authors or year", () => {
    const output = toBibtex([entry({ authors: [], year: null })]);
    expect(output).toContain("@misc{tekmesisn_d_1,");
  });
});

describe("toRis", () => {
  it("includes one AU line per author and all known fields", () => {
    const output = toRis([entry()]);
    expect(output).toContain("TY  - GEN");
    expect(output).toContain("TI  - Retrieval Practice Produces More Learning");
    expect(output).toContain("AU  - Jeffrey D. Karpicke");
    expect(output).toContain("AU  - Janell R. Blunt");
    expect(output).toContain("PY  - 2011");
    expect(output).toContain("T2  - Science");
    expect(output).toContain("DO  - 10.1000/fixture.001");
    expect(output).toContain("UR  - https://example.org/fixture-1");
    expect(output).toContain("ER  - ");
  });

  it("omits unknown fields rather than inventing them", () => {
    const output = toRis([
      entry({ authors: [], year: null, venue: null, doi: null, sourceUrl: null, title: null }),
    ]);
    expect(output).not.toContain("TI  -");
    expect(output).not.toContain("AU  -");
    expect(output).not.toContain("PY  -");
    expect(output).not.toContain("T2  -");
    expect(output).not.toContain("DO  -");
    expect(output).not.toContain("UR  -");
  });

  it("joins multiple entries with a blank line", () => {
    const output = toRis([entry(), entry({ title: "Second study" })]);
    expect(output.split("\n\n")).toHaveLength(2);
  });
});
