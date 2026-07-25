import type { NormalizedRecord } from "@/lib/source-adapters/types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2);
}

/**
 * Fraction of the query's meaningful terms that appear in the record's
 * title+abstract, 0..1. Deliberately simple term overlap, not semantic
 * similarity — consistent with the rest of Phase 3-5 being rule-based until
 * AI query interpretation exists.
 */
export function computeRelevanceScore(query: string, record: NormalizedRecord): number {
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) {
    return 0;
  }
  const recordText = [record.title, record.abstract].filter(Boolean).join(" ");
  const recordTerms = new Set(tokenize(recordText));

  let matches = 0;
  for (const term of queryTerms) {
    if (recordTerms.has(term)) {
      matches += 1;
    }
  }
  return matches / queryTerms.size;
}
