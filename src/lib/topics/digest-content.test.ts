import { describe, expect, it } from "vitest";
import { InMemoryStudyCacheRepository } from "@/lib/studies/in-memory-study-cache-repository";
import { makeRecord } from "@/lib/search/test-fixtures";
import type { ExtractedStudyFields } from "@/lib/ai/study-extraction";
import { buildDigestSections } from "./digest-content";

const FIELDS: ExtractedStudyFields = {
  population: "Adults",
  intervention: "Creatine",
  outcome: "Muscle mass",
  result: "Modest increase",
  uncertainty: "95% CI reported",
  limitations: "Small sample",
  fundingConflicts: null,
};

describe("buildDigestSections", () => {
  it("omits topics with no new studies rather than padding with an empty section", async () => {
    const studyCache = new InMemoryStudyCacheRepository();
    const sinceIso = new Date().toISOString();

    const sections = await buildDigestSections(
      ["schlaf-regeneration", "ernaehrung-supplements"],
      sinceIso,
      studyCache,
    );

    expect(sections).toEqual([]);
  });

  it("includes only topics with studies newer than sinceIso", async () => {
    const studyCache = new InMemoryStudyCacheRepository();
    const sinceIso = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, 2));
    await studyCache.upsert({
      record: makeRecord({ doi: "10.1/new" }),
      aiFields: FIELDS,
      topicSlug: "schlaf-regeneration",
    });

    const sections = await buildDigestSections(
      ["schlaf-regeneration", "ernaehrung-supplements"],
      sinceIso,
      studyCache,
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].topicSlug).toBe("schlaf-regeneration");
    expect(sections[0].studies).toHaveLength(1);
  });
});
