import { describe, expect, it, vi } from "vitest";
import { topics } from "@/content/topics";
import { adaptersForTopic, adaptersForTopics, allAdapters, checkAllSourceStatuses } from "./registry";

describe("adaptersForTopic", () => {
  it("maps every one of the 12 taxonomy topics to a non-empty adapter route", () => {
    for (const topic of topics) {
      const route = adaptersForTopic(topic.slug);
      expect(route.length).toBeGreaterThan(0);
    }
  });

  it("routes health/biomedical topics through Europe PMC and NCBI first, per SOURCE_COVERAGE_MATRIX.md", () => {
    const route = adaptersForTopic("gesundheit-praevention");
    expect(route[0].capabilities.id).toBe("europe_pmc");
    expect(route[1].capabilities.id).toBe("ncbi_pubmed");
  });

  it("routes non-biomedical topics through OpenAlex first", () => {
    const route = adaptersForTopic("lernen-bildung");
    expect(route[0].capabilities.id).toBe("openalex");
  });

  it("falls back to the broad route for an unknown slug instead of throwing", () => {
    expect(() => adaptersForTopic("does-not-exist")).not.toThrow();
    expect(adaptersForTopic("does-not-exist").length).toBeGreaterThan(0);
  });
});

describe("adaptersForTopics", () => {
  it("matches adaptersForTopic for a single slug", () => {
    expect(adaptersForTopics(["gesundheit-praevention"])).toEqual(
      adaptersForTopic("gesundheit-praevention"),
    );
  });

  it("unions routes across two topics without duplicating a shared source", () => {
    const combined = adaptersForTopics(["gesundheit-praevention", "lernen-bildung"]);
    const ids = combined.map((a) => a.capabilities.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["europe_pmc", "ncbi_pubmed", "openalex", "crossref"]));
  });

  it("returns an empty list for an empty slug list", () => {
    expect(adaptersForTopics([])).toEqual([]);
  });
});

describe("checkAllSourceStatuses", () => {
  it("returns one status per adapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response),
    );

    const statuses = await checkAllSourceStatuses();
    expect(statuses).toHaveLength(allAdapters.length);
    expect(statuses.every((s) => s.ok)).toBe(true);

    vi.unstubAllGlobals();
  });
});
