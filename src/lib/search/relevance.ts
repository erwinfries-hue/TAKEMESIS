import type { NormalizedRecord } from "@/lib/source-adapters/types";

/**
 * Closed-class function words (articles, prepositions, conjunctions,
 * pronouns, auxiliary/modal verb forms, question words) in German, English,
 * and French — the three locales this app ships. Filtering these out
 * matters because real questions are heavily templated around a handful of
 * generic connector words ("hilft", "wirkt", "verbessert" show up across
 * nearly every topic's example questions); without this, those words alone
 * could make a totally unrelated record look relevant.
 */
export const STOPWORDS = new Set([
  // German
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "einer", "eines", "und", "oder", "aber", "wie", "was", "wer", "wen", "wem",
  "wessen", "welche", "welcher", "welches", "welchen", "welchem", "ist",
  "sind", "war", "waren", "sein", "bin", "bist", "seid", "hat", "haben",
  "hatte", "hatten", "wird", "werden", "wurde", "wurden", "kann", "können",
  "konnte", "sollte", "sollten", "muss", "müssen", "darf", "dürfen", "nicht",
  "auch", "noch", "nur", "schon", "sehr", "mehr", "als", "am", "im", "in",
  "an", "auf", "aus", "bei", "beim", "bis", "durch", "für", "gegen", "mit",
  "nach", "seit", "über", "um", "unter", "von", "vor", "zu", "zur", "zum",
  "zwischen", "dass", "ob", "weil", "wenn", "während", "dich", "mich",
  "sich", "uns", "euch", "ihn", "ihm", "ihr", "ihre", "ihrer", "sie", "er",
  "es", "du", "ich", "wir",
  // German generic connector verbs — the actual question templates across
  // topics.ts's example questions ("Wirkt X gegen Y?", "Verbessert X den
  // Y?") and real user questions ("Hilft X beim Y?") lean on a small set of
  // these; without filtering them, a record can clear the relevance bar by
  // matching only the connector verb plus one generic noun, never the
  // question's actual subject (e.g. matching "hilft" + "Muskelaufbau" while
  // never mentioning "Kreatin").
  "hilft", "hilfst", "helfen", "half", "halfen", "geholfen",
  "wirkt", "wirkst", "wirken", "wirkte", "wirkten", "gewirkt",
  "verbessert", "verbesserst", "verbessern", "verbesserte", "verbesserten",
  "fördert", "förderst", "fördern", "förderte", "förderten", "gefördert",
  "unterstützt", "unterstützst", "unterstützen", "unterstützte",
  "unterstützten", "beeinflusst", "beeinflussen", "beeinflusste",
  "beeinflussten", "senkt", "senkst", "senken", "senkte", "senkten",
  "gesenkt", "erhöht", "erhöhst", "erhöhen", "erhöhte", "erhöhten",
  "reduziert", "reduzierst", "reduzieren", "reduzierte", "reduzierten",
  "steigert", "steigerst", "steigern", "steigerte", "steigerten",
  "schadet", "schadest", "schaden", "schadete", "schadeten", "geschadet",
  "schützt", "schützen", "schützte", "schützten", "geschützt",
  // "hängen zusammen" ("are related") — live bug found 2026-07-29: a
  // "Wie hängen X und Y zusammen?" question left both words untranslated
  // and, being real (if generic) German content words, diluted the
  // relevance match against otherwise-correct English record text down
  // below the threshold for a topic with genuinely good source coverage.
  "hängt", "hängen", "hing", "hingen", "gehangen", "zusammen",
  // English
  "the", "and", "or", "but", "if", "then", "than", "as", "of", "to", "in",
  "on", "at", "by", "for", "with", "about", "against", "between", "into",
  "through", "during", "before", "after", "above", "below", "from", "up",
  "down", "out", "off", "over", "under", "again", "further", "once", "here",
  "there", "when", "where", "why", "how", "all", "any", "both", "each",
  "few", "more", "most", "other", "some", "such", "nor", "not", "only",
  "own", "same", "too", "very", "can", "will", "just", "should", "now",
  "does", "did", "doing", "this", "that", "these", "those", "you", "he",
  "she", "it", "we", "they", "which", "whom", "are", "was", "were", "been",
  "being", "have", "has", "had",
  // English generic connector verbs, same rationale as the German set above
  "helps", "help", "helped", "helping", "affects", "affect", "affected",
  "affecting", "improves", "improve", "improved", "improving", "supports",
  "support", "supported", "supporting", "reduces", "reduce", "reduced",
  "reducing", "increases", "increase", "increased", "increasing", "boosts",
  "boost", "boosted", "boosting", "harms", "harm", "harmed", "harming",
  "protects", "protect", "protected", "protecting",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // äöüß: German. àâçéèêëîïôœùûüÿ: French accented characters — without
    // these, an untranslated French fallback token (no dictionary entry)
    // would get chopped into fragments at every accent instead of staying
    // one word, breaking the term-overlap match entirely.
    .replace(/[^a-z0-9äöüßàâçéèêëîïôœùûÿ]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Fraction of the query's meaningful terms that appear in the record's
 * title+abstract, 0..1. Deliberately simple term overlap, not semantic
 * similarity — consistent with the rest of Phase 3-5 being rule-based until
 * AI query interpretation exists. Used for ranking (ranking.ts); see
 * `meetsRelevanceThreshold` below for the screening include/exclude decision,
 * which needs an extra rule this raw fraction can't express on its own.
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

/** Below this term-overlap fraction (for questions with 3+ meaningful terms), a record is considered off-topic — see `meetsRelevanceThreshold`. */
export const MIN_RELEVANCE_SCORE = 0.4;

/**
 * Whether a record clears the relevance bar for screening (screening.ts).
 * Not a plain `computeRelevanceScore(...) >= MIN_RELEVANCE_SCORE` check: a
 * question with only 1-2 meaningful terms (e.g. "Hilft Kreatin beim
 * Muskelaufbau?" → "kreatin", "muskelaufbau" once stopwords/connector verbs
 * are stripped) needs *both* terms to match, not just the fraction threshold
 * — a real production case (2026-07-26) showed records matching only the
 * generic noun ("Muskelaufbau") while never mentioning the actual named
 * subject ("Kreatin") still cleared 0.4 (1 of 2 terms = 0.5), because
 * removing a stopword shrinks the denominator as much as the numerator.
 * With that few terms, a partial match isn't a meaningful signal — for
 * longer questions (3+ terms) the plain fraction threshold is a strong
 * enough signal on its own.
 */
export function meetsRelevanceThreshold(query: string, record: NormalizedRecord): boolean {
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) {
    return false;
  }
  const recordText = [record.title, record.abstract].filter(Boolean).join(" ");
  const recordTerms = new Set(tokenize(recordText));

  let matches = 0;
  for (const term of queryTerms) {
    if (recordTerms.has(term)) {
      matches += 1;
    }
  }

  if (queryTerms.size <= 2) {
    return matches === queryTerms.size;
  }
  return matches / queryTerms.size >= MIN_RELEVANCE_SCORE;
}
