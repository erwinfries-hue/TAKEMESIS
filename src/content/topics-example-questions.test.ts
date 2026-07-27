import { describe, expect, it } from "vitest";
import { topics, topicCopy } from "./topics";
import { detectHighRisk } from "@/lib/classification/high-risk";
import { topDomainCandidates } from "@/lib/classification/domain";

/**
 * Live-verifying that every example question actually yields an eligible
 * report (`checkExampleQuestionsForTopic`) needs real network access to
 * the 4 source adapters, which this environment does not have. What *is*
 * verifiable offline, and just as real a way for an example question to be
 * "broken" in the live UI, is the classification step every question goes
 * through before a search even runs:
 *
 * 1. It must not trip the independent high-risk detector — an example
 *    question that does would send a visitor straight to the "we can't
 *    process this" notice instead of demonstrating the product.
 * 2. Its top-scored domain match must be the topic it's actually listed
 *    under — otherwise clicking the example chip on e.g. /topics would
 *    land on a *different* domain's clarification screen, or on "we
 *    couldn't classify this," not a silent confirm of the expected topic.
 */
describe("every example question passes the independent high-risk gate", () => {
  for (const topic of topics) {
    for (const locale of ["de", "en"] as const) {
      const copy = topicCopy(topic, locale);
      for (const question of copy.examples) {
        it(`[${locale}] ${topic.slug}: "${question}"`, () => {
          const matches = detectHighRisk(question, locale);
          expect(matches, `unexpectedly flagged as high-risk: ${JSON.stringify(matches)}`).toEqual(
            [],
          );
        });
      }
    }
  }
});

describe("every example question's top domain match is its own topic", () => {
  for (const topic of topics) {
    for (const locale of ["de", "en"] as const) {
      const copy = topicCopy(topic, locale);
      for (const question of copy.examples) {
        it(`[${locale}] ${topic.slug}: "${question}"`, () => {
          const [topCandidate, ...rest] = topDomainCandidates(question, locale);
          expect(
            topCandidate,
            `no domain matched at all (candidates: ${JSON.stringify(rest)})`,
          ).toBeDefined();
          expect(
            topCandidate?.slug,
            `top match was "${topCandidate?.slug}", not its own topic — full candidates: ${JSON.stringify(
              [topCandidate, ...rest],
            )}`,
          ).toBe(topic.slug);
        });
      }
    }
  }
});
