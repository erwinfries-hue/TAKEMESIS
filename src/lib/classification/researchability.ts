import "server-only";
import type { Locale } from "@/lib/i18n/config";
import { serverEnv } from "@/lib/env/server";
import { classifyResearchability as defaultClassifyResearchability } from "@/lib/ai/researchability-classification";

/**
 * Cheap fast path (docs/OPEN_RISKS.md #34's follow-up decision, "hybrid" —
 * Erwin, 2026-08-05): if a question already contains one of the
 * relationship/effect words that real, good questions on this app are
 * templated around (same connector-verb + effect-noun vocabulary already
 * tracked in relevance.ts/domain.ts for a different reason), it's treated
 * as confidently researchable without spending an AI call. Deliberately
 * one-directional — there is no "confidently NOT researchable" fast path,
 * because these same words ("why", "how") are equally common in
 * perfectly good questions; a false accept here just falls through to the
 * existing eligibility check downstream (still safe), while a false rule-
 * based reject would incorrectly turn away real, good questions with no
 * appeal. Only genuinely ambiguous questions reach the AI call, keeping
 * this affordable at free-search volume, not just paid-report volume.
 */
const RESEARCHABLE_SIGNAL_TERMS: Record<Locale, string[]> = {
  de: [
    "hilft", "hilfst", "helfen", "half", "geholfen",
    "wirkt", "wirkst", "wirken", "wirkte", "gewirkt",
    "verbessert", "verbessern", "verbesserte",
    "fördert", "fördern", "förderte", "gefördert",
    "unterstützt", "unterstützen", "unterstützte",
    "beeinflusst", "beeinflussen", "beeinflusste",
    "senkt", "senken", "senkte", "gesenkt",
    "erhöht", "erhöhen", "erhöhte",
    "reduziert", "reduzieren", "reduzierte",
    "steigert", "steigern", "steigerte",
    "schadet", "schaden", "schadete", "geschadet",
    "schützt", "schützen", "schützte", "geschützt",
    "wirkung", "effekt", "effekte", "einfluss", "auswirkung", "auswirkungen",
    "zusammenhang", "unterschied", "vergleich", "im vergleich", "verglichen",
  ],
  en: [
    "helps", "help", "helped", "helping",
    "affects", "affect", "affected", "affecting",
    "improves", "improve", "improved", "improving",
    "supports", "support", "supported", "supporting",
    "reduces", "reduce", "reduced", "reducing",
    "increases", "increase", "increased", "increasing",
    "boosts", "boost", "boosted", "boosting",
    "harms", "harm", "harmed", "harming",
    "protects", "protect", "protected", "protecting",
    "effect", "effects", "influence", "impact", "impacts",
    "relationship", "difference", "compared", "comparison",
  ],
  fr: [
    "aide", "aident", "aidé",
    "affecte", "affectent", "affecté",
    "améliore", "améliorent", "amélioré",
    "soutient", "soutiennent", "soutenu",
    "réduit", "réduisent", "réduit",
    "augmente", "augmentent", "augmenté",
    "nuit", "nuisent", "nui",
    "protège", "protègent", "protégé",
    "effet", "effets", "influence", "impact", "impacts",
    "différence", "comparé", "par rapport",
  ],
};

export function isConfidentlyResearchable(question: string, locale: Locale): boolean {
  const lower = question.toLowerCase();
  return RESEARCHABLE_SIGNAL_TERMS[locale].some((term) => lower.includes(term));
}

export interface ResearchabilityResult {
  researchable: boolean;
  /** Admin/analytics visibility only — never surfaced to the user. */
  source: "fast_path" | "ai" | "ai_unavailable";
}

export interface CheckResearchabilityDeps {
  classifyResearchability?: typeof defaultClassifyResearchability;
}

/**
 * Runs after domain classification/confirmation, before the costly multi-
 * source search (see /search/page.tsx) — so a non-researchable question
 * neither burns a free-search-limit slot nor triggers a real search.
 * AI-unavailable (not configured, or the call itself errors) always fails
 * open: this check must never be the reason search stops working when AI
 * isn't provisioned, same graceful-degradation contract as every other
 * AI-gated feature in this app.
 */
export async function checkResearchability(
  question: string,
  locale: Locale,
  deps: CheckResearchabilityDeps = {},
): Promise<ResearchabilityResult> {
  if (isConfidentlyResearchable(question, locale)) {
    return { researchable: true, source: "fast_path" };
  }

  if (!serverEnv.AI_EXTRACTION_ENABLED || !serverEnv.ANTHROPIC_API_KEY) {
    return { researchable: true, source: "ai_unavailable" };
  }

  const classifyResearchability = deps.classifyResearchability ?? defaultClassifyResearchability;
  try {
    const result = await classifyResearchability(question, locale);
    if (result === null) {
      return { researchable: true, source: "ai_unavailable" };
    }
    return { researchable: result, source: "ai" };
  } catch (error) {
    console.error("Researchability AI check failed — failing open:", error);
    return { researchable: true, source: "ai_unavailable" };
  }
}
