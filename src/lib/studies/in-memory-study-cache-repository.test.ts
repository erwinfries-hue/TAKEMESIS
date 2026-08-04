import { describe, expect, it } from "vitest";
import { makeRecord } from "@/lib/search/test-fixtures";
import type { ExtractedStudyFields } from "@/lib/ai/study-extraction";
import { InMemoryStudyCacheRepository } from "./in-memory-study-cache-repository";
import { studyKeyFor } from "./types";

const FIELDS: ExtractedStudyFields = {
  population: "Adults",
  intervention: "Creatine",
  outcome: "Muscle mass",
  result: "Modest increase",
  uncertainty: "95% CI reported",
  limitations: "Small sample",
  fundingConflicts: null,
};

describe("InMemoryStudyCacheRepository", () => {
  it("returns null for a study never seen before", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const record = makeRecord({ doi: "10.1/abc" });
    expect(await repo.findByKey(studyKeyFor(record))).toBeNull();
  });

  it("caches and retrieves a study keyed by DOI", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const record = makeRecord({ doi: "10.1/abc", title: "A Trial" });

    await repo.upsert({ record, aiFields: FIELDS });
    const cached = await repo.findByKey(studyKeyFor(record));

    expect(cached).not.toBeNull();
    expect(cached?.aiFields).toEqual(FIELDS);
    expect(cached?.doi).toBe("10.1/abc");
    expect(cached?.seenCount).toBe(1);
  });

  it("falls back to (source, sourceId) when doi is null", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const record = makeRecord({ doi: null, source: "openalex", sourceId: "W123" });

    await repo.upsert({ record, aiFields: FIELDS });
    const cached = await repo.findByKey({ source: "openalex", sourceId: "W123" });

    expect(cached?.aiFields).toEqual(FIELDS);
  });

  it("does not confuse two different studies that lack a DOI", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const a = makeRecord({ doi: null, source: "openalex", sourceId: "W1" });
    const b = makeRecord({ doi: null, source: "openalex", sourceId: "W2" });

    await repo.upsert({ record: a, aiFields: FIELDS });

    expect(await repo.findByKey(studyKeyFor(b))).toBeNull();
  });

  it("bumps seenCount and merges topicSlugs on repeated upserts for the same study", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const record = makeRecord({ doi: "10.1/abc" });

    const first = await repo.upsert({ record, aiFields: FIELDS, topicSlug: "sport-fitness" });
    const second = await repo.upsert({ record, aiFields: FIELDS, topicSlug: "ernaehrung" });

    expect(first.id).toBe(second.id);
    expect(second.seenCount).toBe(2);
    expect(second.topicSlugs.sort()).toEqual(["ernaehrung", "sport-fitness"]);
    expect(second.firstSeenAt).toBe(first.firstSeenAt);
  });

  it("findRecentByTopic returns only studies first seen after the cutoff, tagged with the topic", async () => {
    const repo = new InMemoryStudyCacheRepository();
    await repo.upsert({
      record: makeRecord({ doi: "10.1/old" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });

    const cutoff = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 2));

    await repo.upsert({
      record: makeRecord({ doi: "10.1/new-same-topic" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });
    await repo.upsert({
      record: makeRecord({ doi: "10.1/new-other-topic" }),
      aiFields: FIELDS,
      topicSlug: "ernaehrung-supplements",
    });

    const recent = await repo.findRecentByTopic("schlaf-regeneration", cutoff, 10);

    expect(recent).toHaveLength(1);
    expect(recent[0].doi).toBe("10.1/new-same-topic");
  });

  it("findRecentByTopic caps results at limit, newest first", async () => {
    const repo = new InMemoryStudyCacheRepository();
    const cutoff = new Date(0).toISOString();
    for (const doi of ["10.1/a", "10.1/b", "10.1/c"]) {
      await repo.upsert({ record: makeRecord({ doi }), aiFields: FIELDS, topicSlug: "lernen-bildung" });
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    const recent = await repo.findRecentByTopic("lernen-bildung", cutoff, 2);

    expect(recent).toHaveLength(2);
    expect(recent[0].doi).toBe("10.1/c");
    expect(recent[1].doi).toBe("10.1/b");
  });
});
