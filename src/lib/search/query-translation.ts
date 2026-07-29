import "server-only";
import type { Locale } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env/server";
import { DE_EN_DICTIONARY } from "./de-en-dictionary";
import { FR_EN_DICTIONARY } from "./fr-en-dictionary";
import { STOPWORDS as RELEVANCE_STOPWORDS } from "./relevance";
import type { LearnedTermRepository } from "./learned-terms/learned-term-repository";
import { SupabaseLearnedTermRepository } from "./learned-terms/supabase-learned-term-repository";
import { translateTermsWithAi as defaultTranslateTermsWithAi } from "./learned-terms/term-translation-ai";

/**
 * Question words and connectors that carry no search value and would
 * otherwise dilute the query sent to the 4 external sources.
 *
 * Bug found live (2026-07-28, OPEN_RISKS.md #2): this used to be a
 * separate, smaller list than relevance.ts's own STOPWORDS. The drift let
 * words like "hilft"/"beim" pass through untranslated into the query sent
 * to the external sources — which is also the exact text
 * meetsRelevanceThreshold() re-tokenizes for screening, using its own
 * (different) stopword set. Since "hilft"/"beim" happened to be in that
 * second set too, they got silently dropped there, which shifted the
 * question's *meaningful* term count (e.g. 2 → 3) and picked a stricter
 * matching rule than intended. Merging in RELEVANCE_STOPWORDS keeps both
 * steps looking at the same "what's noise" definition, so translation and
 * screening can't disagree about it again.
 */
const STOPWORDS_DE = new Set([
  "welche", "welcher", "welches", "welchen", "wie", "was", "ist", "sind",
  "für", "und", "oder", "der", "die", "das", "den", "dem", "des", "ein",
  "eine", "einen", "einem", "im", "in", "auf", "zu", "bei", "von", "mit",
  "nicht", "sich", "werden", "wird", "kann", "können", "am", "an", "als",
  "um", "durch", "hat", "haben", "aus", "sein", "ihre", "ihr", "dass",
  ...RELEVANCE_STOPWORDS,
]);

const STOPWORDS_EN = new Set([
  "which", "what", "how", "is", "are", "for", "and", "or", "the", "a", "an",
  "of", "in", "on", "to", "at", "by", "with", "not", "do", "does", "can",
  "that", "this", "your", "you", "have", "has",
  ...RELEVANCE_STOPWORDS,
]);

/**
 * French stopwords. Includes the single-letter fragments left behind by
 * this file's tokenize() splitting elided forms on the apostrophe (e.g.
 * "qu'est-ce" → "qu", "est", "ce"; "l'enfant" → "l", "enfant") — without
 * these, "d"/"l"/"qu"/etc. would otherwise pass straight through as
 * untranslated "content" tokens into the query sent to the 4 sources.
 */
const STOPWORDS_FR = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "à", "au",
  "aux", "et", "ou", "mais", "donc", "or", "ni", "car",
  "que", "qu", "qui", "quoi", "dont", "où",
  "quel", "quelle", "quels", "quelles", "comment", "pourquoi", "combien",
  "est", "sont", "être", "été", "suis", "es", "sommes", "êtes", "soit",
  "a", "ont", "avoir", "eu", "ai", "as", "avons", "avez",
  "ne", "pas", "se", "s", "ce", "c", "cette", "ces", "cet",
  "il", "elle", "ils", "elles", "on", "nous", "vous", "je", "j", "tu", "t",
  "me", "m", "te", "moi", "toi", "lui", "leur", "leurs",
  "son", "sa", "ses", "mon", "ma", "mes", "ton", "ta", "tes", "notre",
  "nos", "votre", "vos",
  "dans", "sur", "sous", "chez", "avec", "sans", "pour", "par", "entre",
  "vers", "depuis", "pendant", "après", "avant", "selon",
  "plus", "moins", "très", "peu", "bien", "aussi", "encore", "déjà",
  "toujours", "jamais", "y", "en",
  "peut", "peuvent", "peux", "pouvez", "pouvons", "pouvoir", "pu",
  "doit", "doivent", "devoir", "dû",
  "fait", "font", "faire", "fais", "faites", "faisons",
  "cela", "ça", "ceci", "celui", "celle", "ceux", "celles",
  ...RELEVANCE_STOPWORDS,
]);

const STOPWORDS: Record<Locale, Set<string>> = {
  de: STOPWORDS_DE,
  en: STOPWORDS_EN,
  fr: STOPWORDS_FR,
};

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = {
  de: DE_EN_DICTIONARY,
  fr: FR_EN_DICTIONARY,
};

/**
 * Locales that also get the learned-term cache + AI fallback tier (see
 * translateUnknownTokens) for tokens the static dictionary misses.
 *
 * Deliberately French-only, not "every locale with a dictionary" — that's
 * what this constant used to be implicitly, until a real production
 * purchase (2026-07-29, German query "Welche Methoden helfen beim Aufbau
 * stabiler Gewohnheiten?") showed why that's dangerous: the AI fallback
 * translates one bare word at a time, with only the source-language name as
 * context (no surrounding sentence — see term-translation-ai.ts), so a
 * polysemous word like "stabiler" ("stable" in the habit-formation sense of
 * "lasting") came back as the bare adjective "stable" — a word so generic
 * in scientific literature (stable isotopes, stable operation, water-stable
 * aggregates, even an 1849 book about horse stables) that it flooded the
 * report with false positives and, worse, pushed out a genuinely relevant
 * study whose abstract never says "stable". German's static dictionary +
 * plain pass-through for gaps was already correct and tested; only French
 * was ever approved to get this tier ("für den Moment würde ich
 * französisch noch implementieren wollen" — Erwin, French-locale rollout).
 */
const AUTO_LEARN_LOCALES = new Set<Locale>(["fr"]);

function tokenize(text: string, stopwords: Set<string>): string[] {
  return text
    .toLowerCase()
    .replace(/[?.,;:!()„""'’]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopwords.has(word));
}

export interface BuildSearchQueryDeps {
  /** Auto-learned term cache. Defaults to Supabase; pass an in-memory fake in tests. */
  learnedTermRepository?: LearnedTermRepository;
  translateTermsWithAi?: typeof defaultTranslateTermsWithAi;
}

/**
 * Second- and third-tier lookup for tokens the static dictionary doesn't
 * cover: first the learned-term cache (free, no AI call), then — only for
 * whatever's still unknown, and only when AI is configured — a live AI
 * translation call whose result is persisted so the next occurrence of the
 * same term across any user's question is served from the cache instead.
 * Every step degrades safely: a cache-lookup failure, a disabled/missing
 * AI key, or an AI call failure all just mean these tokens stay
 * untranslated (existing dictionary-gap behavior), never a broken search.
 */
async function translateUnknownTokens(
  tokens: string[],
  locale: Locale,
  question: string,
  dictionary: Record<string, string>,
  deps: BuildSearchQueryDeps,
): Promise<Map<string, string>> {
  const learned = new Map<string, string>();
  const unknown = Array.from(new Set(tokens.filter((token) => !dictionary[token])));

  // The learned-term cache is only ever written by the AI fallback below —
  // with AI off/unconfigured, or this locale not opted into the tier at
  // all (see AUTO_LEARN_LOCALES), it can never hold anything, so skip the
  // lookup entirely rather than making a doomed Supabase call on every
  // dictionary gap (same early-return shape as enrichPremiumReportWithAi).
  if (
    unknown.length === 0 ||
    !AUTO_LEARN_LOCALES.has(locale) ||
    !serverEnv.AI_EXTRACTION_ENABLED ||
    !serverEnv.ANTHROPIC_API_KEY
  ) {
    return learned;
  }

  const learnedTermRepository = deps.learnedTermRepository ?? new SupabaseLearnedTermRepository();

  let stillUnknown = unknown;
  try {
    const cached = await learnedTermRepository.findMany(locale, unknown);
    for (const [term, translation] of cached) {
      learned.set(term, translation);
    }
    stillUnknown = unknown.filter((term) => !cached.has(term));
  } catch (error) {
    console.error("Learned-term cache lookup failed — continuing without it:", error);
  }

  if (stillUnknown.length === 0) {
    return learned;
  }

  try {
    const translateTermsWithAi = deps.translateTermsWithAi ?? defaultTranslateTermsWithAi;
    const aiTranslations = await translateTermsWithAi(stillUnknown, locale, question);
    for (const [term, translation] of aiTranslations) {
      learned.set(term, translation);
      // Best effort: a failed write never blocks using the translation for
      // this query — it only means one more AI call next time this term
      // shows up.
      void learnedTermRepository.upsert(locale, term, translation).catch((error: unknown) => {
        console.error("Learned-term cache write failed — continuing without caching:", error);
      });
    }
  } catch (error) {
    console.error("AI term translation failed — leaving these tokens untranslated:", error);
  }

  return learned;
}

/**
 * Builds the keyword string actually sent to the 4 external search APIs
 * (docs/CLAUDE.md-adjacent bug fix — see project chat 2026-07-27: OpenAlex,
 * Crossref, Europe PMC, and NCBI index overwhelmingly English content, so a
 * raw German or French question returns almost nothing there). Tokens are
 * translated via the locale's static dictionary where a match exists, then
 * the learned-term cache, then (if AI is configured) a live AI fallback —
 * see translateUnknownTokens. Anything still unmatched after all three tiers
 * passes through unchanged rather than being dropped: a coverage gap can
 * only leave a term untranslated, never remove it from the query.
 *
 * Also used by run-search.ts for relevance screening/ranking against the
 * fetched (realistically always English) record text — not just the
 * initial adapter fetch. Only display (the report's "original question")
 * and later AI extraction still use the untranslated question.
 */
export async function buildSearchQuery(
  question: string,
  locale: Locale,
  deps: BuildSearchQueryDeps = {},
): Promise<string> {
  const tokens = tokenize(question, STOPWORDS[locale]);

  if (tokens.length === 0) {
    // Every token was a stopword (or the question was empty) — fall back to
    // the original text rather than sending an empty query to the adapters.
    return question;
  }

  const dictionary = DICTIONARIES[locale];
  if (!dictionary) {
    return tokens.join(" ");
  }

  const learned = await translateUnknownTokens(tokens, locale, question, dictionary, deps);

  return tokens.map((token) => dictionary[token] ?? learned.get(token) ?? token).join(" ");
}
