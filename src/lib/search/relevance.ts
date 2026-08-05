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
  "wessen", "welche", "welcher", "welches", "welchen", "welchem",
  // Live bug found 2026-08-05: "warum" ("why") was missing from this list
  // — a trivia question ("Warum ist der Eiffelturm so hoch?", not a
  // researchable evidence question at all) matched real but wholly
  // unrelated German-language papers that happened to share only "warum"
  // + "hoch" ("so hoch" = "so tall") in their titles, clearing the
  // relevance bar and the eligible_with_limitations threshold. "wieso" and
  // "weshalb" are the same word class (German has three ways to ask
  // "why"), added preventively for the same reason.
  "warum", "wieso", "weshalb", "ist",
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
  // Live production case (2026-08-05): "Massnahmen" and "im Alltag" both
  // translate to "measures" and "everyday life" — near-universal phrasing
  // in scientific writing, not distinctive to any topic. With a query that
  // reduces to few concepts, matching only these two was enough to clear
  // the threshold: "Subjective and physiological measures reveal
  // emotionally salient moments in virtual everyday life" and "Repressive
  // Measures and Everyday Life of ... Belarusian Society" both passed
  // screening for a climate-change question that never mentions climate,
  // CO2, or anything related — they only ever matched "measures" +
  // "everyday life". Same rationale as the connector-verb stopwords above:
  // a word this generic can't be allowed to stand in for the question's
  // actual subject. (German/French mirror: "massnahme(n)"/"mesure(s)" and
  // "alltag"/"alltäglich"/"quotidien(ne/s)" all translate to these same
  // English words, so stopwording them here covers all three locales.)
  "measures", "measure", "everyday", "life",
  // French — this list's own doc comment already claimed German/English/
  // French coverage, but no French section actually existed until this
  // fix (found alongside the "warum" gap above, same root cause: relevance
  // scoring and query-translation tokenization both call this same
  // STOPWORDS set — see query-translation.ts's RELEVANCE_STOPWORDS merge —
  // so a missing entry here weakens screening for that locale specifically).
  // Mirrors classification/domain.ts's STOPWORDS_FR, the one place this
  // list already existed.
  "quelle", "quel", "quels", "quelles", "comment", "pourquoi", "est", "sont",
  "pour", "et", "ou", "le", "la", "les", "un", "une", "des", "du", "de",
  "dans", "sur", "à", "au", "aux", "avec", "ne", "pas", "se", "être", "sera",
  "peut", "peuvent", "par", "qui", "que", "quoi", "cette", "ce", "ces",
  "son", "sa", "ses", "avoir", "a", "ont", "avait", "avaient",
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
 * Whether two already-tokenized words should count as the same term.
 * Exact match, plus tolerance for the handful of regular English plural
 * suffixes (-s, -es, -y/-ies) — without this, meetsRelevanceThreshold's
 * per-concept AND (below) would wrongly exclude a genuinely relevant record
 * just because it says "gains" where the query says "gain".
 */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  if (a.endsWith("s") && a.slice(0, -1) === b) return true;
  if (b.endsWith("s") && b.slice(0, -1) === a) return true;
  if (a.endsWith("es") && a.slice(0, -2) === b) return true;
  if (b.endsWith("es") && b.slice(0, -2) === a) return true;
  if (a.endsWith("y") && b === `${a.slice(0, -1)}ies`) return true;
  if (b.endsWith("y") && a === `${b.slice(0, -1)}ies`) return true;
  return false;
}

/**
 * Whether a record clears the relevance bar for screening (screening.ts).
 * Takes the query as *concept groups* (see buildSearchQueryConcepts) rather
 * than one flat term list: a source term the dictionary translates to a
 * multi-word English phrase (e.g. "trainingsfrequenz" → "training
 * frequency") stays one 2-word concept. A concept only counts as matched if
 * *every* word in it appears in the record (with light plural tolerance via
 * wordsMatch) — not just any one of them.
 *
 * This concept-level AND is what a flat word-overlap fraction can't
 * express, and is the fix for a real production case (2026-08-01): a
 * 4-word/2-concept query ("training frequency" + "strength gain") let
 * records through that matched only one word from each concept — e.g. an
 * MRI-imaging paper mentioning "frequency" (signal frequency) and "gain"
 * (signal gain), never "training" or "strength" — because the old flat
 * check only required 2 of 4 words (50%) to clear the 0.4 threshold,
 * regardless of which two.
 *
 * With that concept-level match computed, the same "few terms need full
 * coverage, more terms tolerate a fraction" split from before still
 * applies, just counting concepts instead of words: a question with only
 * 1-2 meaningful concepts (e.g. "Hilft Kreatin beim Muskelaufbau?" →
 * concepts "kreatin", "muskelaufbau") needs *all* of them matched — a real
 * production case (2026-07-26) showed records matching only the generic
 * noun while never mentioning the actual named subject still cleared 0.4.
 * For 3+ concepts, the plain fraction threshold is a strong enough signal.
 */
export function meetsRelevanceThreshold(concepts: string[][], record: NormalizedRecord): boolean {
  const meaningfulConcepts = concepts.map((concept) => tokenize(concept.join(" "))).filter(
    (terms) => terms.length > 0,
  );
  if (meaningfulConcepts.length === 0) {
    return false;
  }

  const recordText = [record.title, record.abstract].filter(Boolean).join(" ");
  const recordTerms = tokenize(recordText);

  const matchedConceptCount = meaningfulConcepts.filter((conceptTerms) =>
    conceptTerms.every((term) => recordTerms.some((recordTerm) => wordsMatch(term, recordTerm))),
  ).length;

  if (meaningfulConcepts.length <= 2) {
    return matchedConceptCount === meaningfulConcepts.length;
  }
  return matchedConceptCount / meaningfulConcepts.length >= MIN_RELEVANCE_SCORE;
}
