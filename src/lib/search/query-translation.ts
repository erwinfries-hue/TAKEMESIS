import type { Locale } from "@/lib/i18n/config";
import { DE_EN_DICTIONARY } from "./de-en-dictionary";

/**
 * Question words and connectors that carry no search value and would
 * otherwise dilute the query sent to the 4 external sources. Deliberately
 * a separate, smaller list from classification/domain.ts's — that one
 * scores topic relevance, this one only decides what to drop before
 * building an external search query, so drift between the two is fine.
 */
const STOPWORDS_DE = new Set([
  "welche", "welcher", "welches", "welchen", "wie", "was", "ist", "sind",
  "für", "und", "oder", "der", "die", "das", "den", "dem", "des", "ein",
  "eine", "einen", "einem", "im", "in", "auf", "zu", "bei", "von", "mit",
  "nicht", "sich", "werden", "wird", "kann", "können", "am", "an", "als",
  "um", "durch", "hat", "haben", "aus", "sein", "ihre", "ihr", "dass",
]);

const STOPWORDS_EN = new Set([
  "which", "what", "how", "is", "are", "for", "and", "or", "the", "a", "an",
  "of", "in", "on", "to", "at", "by", "with", "not", "do", "does", "can",
  "that", "this", "your", "you", "have", "has",
]);

function tokenize(text: string, stopwords: Set<string>): string[] {
  return text
    .toLowerCase()
    .replace(/[?.,;:!()„""'’]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopwords.has(word));
}

/**
 * Builds the keyword string actually sent to the 4 external search APIs
 * (docs/CLAUDE.md-adjacent bug fix — see project chat 2026-07-27: OpenAlex,
 * Crossref, Europe PMC, and NCBI index overwhelmingly English content, so a
 * raw German question returns almost nothing there). German tokens are
 * translated via DE_EN_DICTIONARY where a match exists; everything else
 * (proper nouns, already-English terms, dictionary gaps) passes through
 * unchanged rather than being dropped — a coverage gap can only leave a
 * term untranslated, never remove it from the query.
 *
 * Also used by run-search.ts for relevance screening/ranking against the
 * fetched (realistically always English) record text — not just the
 * initial adapter fetch. Only display (the report's "original question")
 * and later AI extraction still use the untranslated question.
 */
export function buildSearchQuery(question: string, locale: Locale): string {
  const stopwords = locale === "de" ? STOPWORDS_DE : STOPWORDS_EN;
  const tokens = tokenize(question, stopwords);

  if (tokens.length === 0) {
    // Every token was a stopword (or the question was empty) — fall back to
    // the original text rather than sending an empty query to the adapters.
    return question;
  }

  if (locale !== "de") {
    return tokens.join(" ");
  }

  return tokens.map((token) => DE_EN_DICTIONARY[token] ?? token).join(" ");
}
