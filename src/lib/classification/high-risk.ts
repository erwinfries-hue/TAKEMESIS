import type { Locale } from "@/lib/i18n/config";

/**
 * Independent high-risk detector — decision #2 (DECISIONS_LOG.md #2): these
 * sub-topics are hard-blocked to `restricted_high_risk` regardless of which
 * of the 12 categories the question otherwise belongs to. Evaluated on every
 * question, before/independent of domain classification.
 *
 * Deliberately simple substring matching (not AI, not fancy NLP): for a
 * safety gate, a false positive (an unnecessary restriction) is the
 * acceptable failure mode — a false negative is not. No AI is available yet
 * (ANTHROPIC_API_KEY not provisioned), and this gate must work without it.
 */

export type HighRiskCategory =
  | "cancer"
  | "pregnancy"
  | "prescription_drugs"
  | "vaccines"
  | "mental_health_crisis"
  | "acute_symptoms"
  | "dosing"
  | "pediatric_treatment"
  | "legal_financial_high_stakes";

export interface HighRiskMatch {
  category: HighRiskCategory;
  matchedTerm: string;
}

const TERMS: Record<HighRiskCategory, Partial<Record<Locale, string[]>>> = {
  cancer: {
    de: ["krebs", "tumor", "tumore", "chemotherapie", "chemo", "onkologie", "karzinom", "metastasen"],
    en: ["cancer", "tumor", "tumour", "chemotherapy", "oncology", "carcinoma", "metastasis"],
  },
  pregnancy: {
    de: ["schwanger", "schwangerschaft", "stillzeit", "stillen", "trimester", "geburt"],
    en: ["pregnant", "pregnancy", "breastfeeding", "trimester", "childbirth"],
  },
  prescription_drugs: {
    de: [
      "medikament",
      "medikamente",
      "rezeptpflichtig",
      "verschreibungspflichtig",
      "antibiotika",
      "insulin",
      "wechselwirkung",
      "arzneimittel",
    ],
    en: [
      "medication",
      "prescription drug",
      "prescription medicine",
      "antibiotics",
      "insulin",
      "drug interaction",
    ],
  },
  vaccines: {
    de: ["impfung", "impfstoff", "impfnebenwirkung", "geimpft", "immunisierung"],
    en: ["vaccine", "vaccination", "immunization", "immunisation"],
  },
  mental_health_crisis: {
    de: ["suizid", "selbstmord", "selbstverletzung", "suizidgedanken", "psychische krise"],
    en: ["suicide", "suicidal", "self-harm", "self harm", "mental health crisis"],
  },
  acute_symptoms: {
    de: ["akute schmerzen", "brustschmerzen", "atemnot", "bewusstlos", "starke blutung", "notfall"],
    en: ["acute pain", "chest pain", "shortness of breath", "unconscious", "severe bleeding", "emergency"],
  },
  dosing: {
    de: ["dosierung", "dosis", "milligramm", "wie viel mg"],
    en: ["dosage", "dose", "milligram", "how many mg"],
  },
  legal_financial_high_stakes: {
    de: ["scheidung", "insolvenz", "konkurs", "strafanzeige", "erbschaftsstreit", "fristlose kündigung"],
    en: ["divorce", "bankruptcy", "lawsuit", "criminal charge", "inheritance dispute"],
  },
  // pediatric_treatment is handled separately below: it's a *combination*
  // of a child-related term and a treatment/medical term, since child-
  // development questions alone are legitimately in scope (Kinder,
  // Erziehung & Entwicklung).
  pediatric_treatment: {},
};

const CHILD_TERMS: Partial<Record<Locale, string[]>> = {
  de: ["kind", "kinder", "kleinkind", "säugling", "baby", "neugeborenes"],
  en: ["child", "children", "toddler", "infant", "baby", "newborn"],
};

const TREATMENT_TERMS: Partial<Record<Locale, string[]>> = {
  de: ["medikament", "dosierung", "behandlung", "diagnose", "symptom", "impfung", "therapie"],
  en: ["medication", "dosage", "treatment", "diagnosis", "symptom", "vaccine", "therapy"],
};

function includesTerm(haystack: string, term: string): boolean {
  return haystack.includes(term);
}

export function detectHighRisk(question: string, locale: Locale): HighRiskMatch[] {
  const normalized = question.toLowerCase();
  const matches: HighRiskMatch[] = [];

  for (const [category, byLocale] of Object.entries(TERMS) as [
    HighRiskCategory,
    Partial<Record<Locale, string[]>>,
  ][]) {
    for (const term of byLocale[locale] ?? []) {
      if (includesTerm(normalized, term)) {
        matches.push({ category, matchedTerm: term });
      }
    }
  }

  const hasChildTerm = (CHILD_TERMS[locale] ?? []).some((term) =>
    includesTerm(normalized, term),
  );
  const treatmentTerm = (TREATMENT_TERMS[locale] ?? []).find((term) =>
    includesTerm(normalized, term),
  );
  if (hasChildTerm && treatmentTerm) {
    matches.push({ category: "pediatric_treatment", matchedTerm: treatmentTerm });
  }

  return matches;
}

export function isHighRisk(question: string, locale: Locale): boolean {
  return detectHighRisk(question, locale).length > 0;
}
