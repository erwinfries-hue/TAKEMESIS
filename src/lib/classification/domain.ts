import type { Locale } from "@/lib/i18n/config";
import { topics } from "@/content/topics";

/**
 * Rule-based domain classifier. Not AI (ANTHROPIC_API_KEY isn't provisioned
 * yet — see docs/.env.example, AI_EXTRACTION_ENABLED=false): scores a
 * question against a term index built from each topic's own name,
 * description, and example questions, so the classifier stays in sync with
 * the taxonomy content by construction rather than a hand-maintained,
 * drifting keyword list.
 */

const STOPWORDS_DE = new Set([
  "welche", "welcher", "welches", "wie", "was", "ist", "sind", "für", "und",
  "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen",
  "einem", "im", "in", "auf", "zu", "bei", "von", "mit", "nicht", "sich",
  "werden", "wird", "kann", "können", "am", "an", "als", "um", "durch",
]);

const STOPWORDS_EN = new Set([
  "which", "what", "how", "is", "are", "for", "and", "or", "the", "a", "an",
  "of", "in", "on", "to", "at", "by", "with", "not", "do", "does", "can",
  "that", "this", "your", "you",
]);

function tokenize(text: string, locale: Locale): string[] {
  const stopwords = locale === "de" ? STOPWORDS_DE : STOPWORDS_EN;
  return text
    .toLowerCase()
    .replace(/[?.,;:!()„""]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}

interface TopicIndexEntry {
  slug: string;
  weights: Map<string, number>;
}

function buildIndex(locale: Locale): TopicIndexEntry[] {
  return topics.map((topic) => {
    const copy = topic[locale];
    const words = [
      ...tokenize(copy.name, locale),
      ...tokenize(copy.description, locale),
      ...copy.examples.flatMap((example) => tokenize(example, locale)),
    ];
    const weights = new Map<string, number>();
    for (const word of words) {
      weights.set(word, (weights.get(word) ?? 0) + 1);
    }
    return { slug: topic.slug, weights };
  });
}

export interface DomainScore {
  slug: string;
  score: number;
  matchedTerms: string[];
}

/**
 * Returns candidate domains sorted by score, highest first. An empty array
 * means the question didn't match any domain strongly enough to propose
 * one — the caller should fall back to a manual category picker rather than
 * guessing (per 05_UX_USER_FLOWS_AND_PAGES.md: category is inspiration, not
 * a rigid restriction).
 */
export function classifyDomain(question: string, locale: Locale): DomainScore[] {
  const questionTerms = new Set(tokenize(question, locale));
  if (questionTerms.size === 0) {
    return [];
  }

  const index = buildIndex(locale);
  const scores: DomainScore[] = index.map((entry) => {
    const matchedTerms: string[] = [];
    let score = 0;
    for (const term of questionTerms) {
      const weight = entry.weights.get(term);
      if (weight) {
        score += weight;
        matchedTerms.push(term);
      }
    }
    return { slug: entry.slug, score, matchedTerms };
  });

  return scores.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
}

/** Up to 3 candidates: the proposed domain plus up to 2 alternatives. */
export function topDomainCandidates(question: string, locale: Locale): DomainScore[] {
  return classifyDomain(question, locale).slice(0, 3);
}
