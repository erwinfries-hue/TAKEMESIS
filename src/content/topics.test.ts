import { describe, expect, it } from "vitest";
import { getTopic, topics } from "./topics";

describe("topic taxonomy", () => {
  it("has exactly 12 categories (decision #1: all active at beta start)", () => {
    expect(topics).toHaveLength(12);
  });

  it("has unique slugs", () => {
    const slugs = topics.map((topic) => topic.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every category 4-8 example questions in both locales", () => {
    for (const topic of topics) {
      expect(topic.de.examples.length).toBeGreaterThanOrEqual(4);
      expect(topic.de.examples.length).toBeLessThanOrEqual(8);
      expect(topic.en.examples.length).toBeGreaterThanOrEqual(4);
      expect(topic.en.examples.length).toBeLessThanOrEqual(8);
    }
  });

  it("gives every category a description, limitations, and source route in both locales", () => {
    for (const topic of topics) {
      expect(topic.de.description.length).toBeGreaterThan(0);
      expect(topic.en.description.length).toBeGreaterThan(0);
      expect(topic.de.limitations.length).toBeGreaterThan(0);
      expect(topic.en.limitations.length).toBeGreaterThan(0);
      expect(topic.sourceRoute.length).toBeGreaterThan(0);
    }
  });

  it("marks Gesundheit & Prävention and Kinder, Erziehung & Entwicklung as elevated risk (decision #2)", () => {
    expect(getTopic("gesundheit-praevention")?.riskProfile).toBe("elevated");
    expect(getTopic("kinder-erziehung")?.riskProfile).toBe("elevated");
  });

  it("includes the curated example-report topic (decision #3)", () => {
    const learning = getTopic("lernen-bildung");
    expect(learning?.de.examples).toContain(
      "Welche Lernmethode verbessert den Lernerfolg?",
    );
  });

  it("getTopic returns undefined for an unknown slug", () => {
    expect(getTopic("does-not-exist")).toBeUndefined();
  });
});
