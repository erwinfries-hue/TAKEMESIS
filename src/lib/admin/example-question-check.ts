import "server-only";
import type { SourceAdapter } from "@/lib/source-adapters/types";
import { adaptersForTopic } from "@/lib/source-adapters/registry";
import { runSearchWithAdapters } from "@/lib/search/run-search";
import { assessEligibility, type EligibilityStatus } from "@/lib/eligibility/eligibility";
import { topics, topicCopy, type Locale } from "@/content/topics";

export interface ExampleQuestionCheckResult {
  question: string;
  eligibility: EligibilityStatus;
  includedCount: number;
  resultBearingCount: number;
  sourceErrors: string[];
}

/**
 * Runs every example question of one topic through the real search +
 * eligibility pipeline. This is the live-network check the Broad-domain
 * rule (docs/CLAUDE.md: "tested for researchability... tested for evidence
 * sufficiency") requires before a question is shown as an example — never
 * possible before this session's first live-network deployment (see
 * OPEN_RISKS.md #2). Sequential rather than parallel, both to stay within
 * NCBI's unauthenticated rate limit (OPEN_RISKS.md #7) and to keep this
 * bounded for the admin page's function-duration budget. Parameterized over
 * an explicit adapter list so the wiring is unit-testable without live
 * network access, same split as `runSearch`/`runSearchWithAdapters`.
 */
export async function checkExampleQuestionsForTopicWithAdapters(
  topicSlug: string,
  locale: Locale,
  adapters: SourceAdapter[],
): Promise<ExampleQuestionCheckResult[]> {
  const topic = topics.find((t) => t.slug === topicSlug);
  if (!topic) {
    return [];
  }
  const copy = topicCopy(topic, locale);

  const results: ExampleQuestionCheckResult[] = [];
  for (const question of copy.examples) {
    const searchResult = await runSearchWithAdapters(question, topicSlug, adapters);
    const eligibility = assessEligibility(searchResult);
    results.push({
      question,
      eligibility: eligibility.status,
      includedCount: eligibility.includedCount,
      resultBearingCount: eligibility.resultBearingCount,
      sourceErrors: searchResult.perSource
        .filter((s) => !s.ok)
        .map((s) => `${s.source}: ${s.error ?? "unknown error"}`),
    });
  }
  return results;
}

export async function checkExampleQuestionsForTopic(
  topicSlug: string,
  locale: Locale,
): Promise<ExampleQuestionCheckResult[]> {
  return checkExampleQuestionsForTopicWithAdapters(topicSlug, locale, adaptersForTopic(topicSlug));
}
