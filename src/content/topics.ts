/**
 * Topic taxonomy — source of truth for the 12 categories from
 * docs/04_TARGET_AUDIENCE_AND_TOPIC_TAXONOMY.md, decision #1 (all 12 active
 * at beta start) and decision #2 (high-risk sub-topics hard-blocked via risk
 * classification regardless of category). Source routing summaries follow
 * docs/SOURCE_COVERAGE_MATRIX.md.
 *
 * `riskProfile: "elevated"` marks categories where high-risk sub-topics are
 * expected often enough to warrant an explicit UI notice — the actual gate
 * (routing a specific question to `restricted_high_risk`) is a per-question
 * classifier decision (Phase 3), not a category-level block.
 */

export type Locale = "de" | "en";
export type TopicRiskProfile = "standard" | "elevated";

export interface TopicCopy {
  name: string;
  description: string;
  examples: string[];
  limitations: string;
}

export interface Topic {
  slug: string;
  riskProfile: TopicRiskProfile;
  sourceRoute: string;
  de: TopicCopy;
  en: TopicCopy;
}

export const topics: Topic[] = [
  {
    slug: "gesundheit-praevention",
    riskProfile: "elevated",
    sourceRoute: "Europe PMC, PubMed/NCBI (primär) · OpenAlex, Crossref (ergänzend)",
    de: {
      name: "Gesundheit & Prävention",
      description:
        "Allgemeine, nicht-diagnostische Fragen zu Prävention und gesunder Lebensweise — keine Diagnosen, keine individuelle Behandlung.",
      examples: [
        "Welche Massnahmen senken das Risiko häufiger Rückenschmerzen?",
        "Welche Präventionsmassnahmen sind für gesunde Erwachsene gut belegt?",
        "Wie wirksam sind bestimmte nicht-medikamentöse Ansätze?",
        "Welchen Einfluss hat regelmässige Bewegung auf das allgemeine Erkrankungsrisiko?",
        "Welche Massnahmen unterstützen ein gesundes Immunsystem im Alltag?",
      ],
      limitations:
        "Fragen zu Diagnosen, Medikamenten, Dosierungen, akuten Symptomen oder anderen Hochrisiko-Themen werden nicht individuell beantwortet und ersetzen keine fachärztliche Beratung.",
    },
    en: {
      name: "Health & Prevention",
      description:
        "General, non-diagnostic questions about prevention and healthy living — no diagnosis, no individual treatment.",
      examples: [
        "Which measures reduce the risk of common back pain?",
        "Which prevention measures are well supported for healthy adults?",
        "How effective are certain non-drug approaches?",
        "What effect does regular exercise have on general disease risk?",
        "Which everyday measures support a healthy immune system?",
      ],
      limitations:
        "Questions about diagnosis, medication, dosing, acute symptoms, or other high-risk topics are not answered individually and do not replace professional medical advice.",
    },
  },
  {
    slug: "ernaehrung-supplements",
    riskProfile: "standard",
    sourceRoute: "Europe PMC, PubMed/NCBI (primär) · OpenAlex, Crossref (ergänzend)",
    de: {
      name: "Ernährung & Supplements",
      description:
        "Fragen zu Ernährungsweisen, Nahrungsergänzung und deren Nutzen für bestimmte Ziele.",
      examples: [
        "Welche Vorteile von Omega-3 sind gut belegt?",
        "Verbessert Kreatin die geistige oder körperliche Leistung?",
        "Welche Effekte hat Intervallfasten?",
        "Sind Probiotika für bestimmte Ziele sinnvoll?",
        "Welche Rolle spielt Proteinzufuhr für den Muskelerhalt im Alter?",
      ],
      limitations:
        "Keine individuellen Dosierungsempfehlungen oder Aussagen zu Wechselwirkungen mit Medikamenten.",
    },
    en: {
      name: "Nutrition & Supplements",
      description:
        "Questions about diets, supplements, and their benefit for specific goals.",
      examples: [
        "Which benefits of omega-3 are well supported?",
        "Does creatine improve mental or physical performance?",
        "What effects does intermittent fasting have?",
        "Are probiotics useful for specific goals?",
        "What role does protein intake play in preserving muscle with age?",
      ],
      limitations:
        "No individual dosing recommendations or statements about drug interactions.",
    },
  },
  {
    slug: "schlaf-regeneration",
    riskProfile: "standard",
    sourceRoute: "Europe PMC, PubMed/NCBI (primär) · OpenAlex, Crossref (ergänzend)",
    de: {
      name: "Schlaf & Regeneration",
      description: "Fragen zu Schlafqualität, Erholung und beeinflussenden Faktoren.",
      examples: [
        "Welche Massnahmen verbessern nachweislich die Schlafqualität?",
        "Welche Wirkung hat Melatonin bei verschiedenen Gruppen?",
        "Wie beeinflusst Bildschirmnutzung den Schlaf?",
        "Welchen Effekt hat Koffeinkonsum am Nachmittag auf den Schlaf?",
        "Wie wirkt sich ein regelmässiger Schlafrhythmus auf die Erholung aus?",
      ],
      limitations:
        "Keine Bewertung diagnostizierter Schlafstörungen oder individueller Medikation.",
    },
    en: {
      name: "Sleep & Regeneration",
      description: "Questions about sleep quality, recovery, and influencing factors.",
      examples: [
        "Which measures demonstrably improve sleep quality?",
        "What effect does melatonin have across different groups?",
        "How does screen use affect sleep?",
        "What effect does afternoon caffeine intake have on sleep?",
        "How does a regular sleep schedule affect recovery?",
      ],
      limitations:
        "No assessment of diagnosed sleep disorders or individual medication.",
    },
  },
  {
    slug: "fitness-leistungsfaehigkeit",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Europe PMC/NCBI, Crossref (ergänzend)",
    de: {
      name: "Fitness & körperliche Leistungsfähigkeit",
      description: "Fragen zu Training, Ausdauer, Regeneration und körperlicher Leistung.",
      examples: [
        "Welche Trainingsmethode unterstützt Muskelaufbau am stärksten?",
        "Was verbessert Ausdauer am effizientesten?",
        "Welchen Nutzen hat Kälteexposition für Regeneration?",
        "Wie wirkt sich Trainingsfrequenz auf den Kraftzuwachs aus?",
        "Welche Rolle spielt Dehnen für Verletzungsprävention?",
      ],
      limitations:
        "Keine individuelle Trainings- oder Rehabilitationsplanung bei bestehenden Verletzungen.",
    },
    en: {
      name: "Fitness & Physical Performance",
      description:
        "Questions about training, endurance, recovery, and physical performance.",
      examples: [
        "Which training method best supports muscle growth?",
        "What most efficiently improves endurance?",
        "What benefit does cold exposure have for recovery?",
        "How does training frequency affect strength gains?",
        "What role does stretching play in injury prevention?",
      ],
      limitations:
        "No individual training or rehabilitation planning for existing injuries.",
    },
  },
  {
    slug: "lernen-bildung",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend), ERIC optional (P1)",
    de: {
      name: "Lernen & Bildung",
      description: "Fragen zu Lernmethoden, Gedächtnis und Lernerfolg.",
      examples: [
        "Welche Lernmethode verbessert den Lernerfolg?",
        "Funktioniert Active Recall besser als Wiederlesen?",
        "Welche Rolle spielt Spaced Repetition?",
        "Verbessert handschriftliches Notieren das Behalten?",
        "Wie wirkt sich Interleaving auf den Lernerfolg aus?",
      ],
      limitations:
        "Ergebnisse stammen überwiegend aus Studien mit spezifischen Populationen (z. B. Studierende) und sind nicht ohne Weiteres auf jede Lernsituation übertragbar.",
    },
    en: {
      name: "Learning & Education",
      description: "Questions about learning methods, memory, and learning outcomes.",
      examples: [
        "Which learning method improves learning outcomes?",
        "Does active recall work better than rereading?",
        "What role does spaced repetition play?",
        "Does handwritten note-taking improve retention?",
        "How does interleaving affect learning outcomes?",
      ],
      limitations:
        "Results mostly come from studies with specific populations (e.g. students) and don't automatically transfer to every learning situation.",
    },
  },
  {
    slug: "arbeit-produktivitaet",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend)",
    de: {
      name: "Arbeit, Produktivität & Organisation",
      description: "Fragen zu Arbeitsformen, Produktivität und Organisation im Berufsalltag.",
      examples: [
        "Wie beeinflusst Homeoffice die Produktivität?",
        "Welche Meetingformate sind effizienter?",
        "Unterstützen Fokuszeiten die Arbeitsleistung?",
        "Welche Arbeitszeitmodelle verbessern Leistung und Wohlbefinden?",
        "Wie wirken sich Unterbrechungen auf konzentrierte Arbeit aus?",
      ],
      limitations:
        "Ergebnisse sind stark kontextabhängig (Branche, Rolle, Unternehmenskultur) und nicht universell übertragbar.",
    },
    en: {
      name: "Work, Productivity & Organization",
      description: "Questions about work formats, productivity, and organization at work.",
      examples: [
        "How does remote work affect productivity?",
        "Which meeting formats are more efficient?",
        "Do focus blocks support work performance?",
        "Which work-time models improve performance and well-being?",
        "How do interruptions affect focused work?",
      ],
      limitations:
        "Results are highly context-dependent (industry, role, company culture) and don't transfer universally.",
    },
  },
  {
    slug: "psychologie-wohlbefinden",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Europe PMC (klinisch angrenzend), Crossref (ergänzend)",
    de: {
      name: "Psychologie, Wohlbefinden & Gewohnheiten",
      description: "Fragen zu Gewohnheitsbildung, Stressregulation und alltäglichem Wohlbefinden.",
      examples: [
        "Welche Methoden helfen beim Aufbau stabiler Gewohnheiten?",
        "Welche Interventionen reduzieren Alltagsstress?",
        "Wie wirksam sind Dankbarkeits- oder Achtsamkeitsübungen?",
        "Welche Faktoren begünstigen das Durchhalten neuer Gewohnheiten?",
        "Wie hängen soziale Kontakte und allgemeines Wohlbefinden zusammen?",
      ],
      limitations:
        "Akute psychische Krisen oder klinische Fragestellungen werden nicht individuell behandelt; es erfolgt ein Verweis auf Fachstellen.",
    },
    en: {
      name: "Psychology, Well-being & Habits",
      description: "Questions about habit formation, stress regulation, and everyday well-being.",
      examples: [
        "Which methods help build stable habits?",
        "Which interventions reduce everyday stress?",
        "How effective are gratitude or mindfulness practices?",
        "What factors favor sticking with new habits?",
        "How are social contact and general well-being related?",
      ],
      limitations:
        "Acute mental-health crises or clinical questions are not addressed individually; users are pointed to qualified support instead.",
    },
  },
  {
    slug: "beziehungen-kommunikation",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend)",
    de: {
      name: "Beziehungen & Kommunikation",
      description: "Fragen zu Kommunikation, Konfliktlösung und Beziehungszufriedenheit.",
      examples: [
        "Welche Kommunikationsmethoden verbessern Konfliktlösung?",
        "Welche Faktoren unterstützen langfristige Beziehungszufriedenheit?",
        "Wie wirkt aktives Zuhören?",
        "Welche Rolle spielt gemeinsame Zeit für die Beziehungsqualität?",
        "Wie beeinflusst Wertschätzung die Zufriedenheit in Beziehungen?",
      ],
      limitations:
        "Keine individuelle Paar- oder Familienberatung; allgemeine, nicht personalisierte Orientierung.",
    },
    en: {
      name: "Relationships & Communication",
      description: "Questions about communication, conflict resolution, and relationship satisfaction.",
      examples: [
        "Which communication methods improve conflict resolution?",
        "What factors support long-term relationship satisfaction?",
        "How does active listening work?",
        "What role does shared time play in relationship quality?",
        "How does appreciation affect satisfaction in relationships?",
      ],
      limitations:
        "No individual couples or family counseling; general, non-personalized orientation only.",
    },
  },
  {
    slug: "kinder-erziehung",
    riskProfile: "elevated",
    sourceRoute: "OpenAlex (primär) · Europe PMC/NCBI (entwicklungsmedizinisch angrenzend), Crossref (ergänzend)",
    de: {
      name: "Kinder, Erziehung & Entwicklung",
      description:
        "Allgemeine Fragen zu Erziehungsansätzen und kindlicher Entwicklung — keine Einschätzung einzelner Kinder.",
      examples: [
        "Welche Erziehungsansätze fördern Selbstregulation?",
        "Wie beeinflusst Bildschirmzeit bestimmte Entwicklungsbereiche?",
        "Welche Lernumgebung unterstützt Kinder am besten?",
        "Welche Rolle spielt Routine für die kindliche Entwicklung?",
        "Wie wirkt sich gemeinsames Vorlesen auf die Sprachentwicklung aus?",
      ],
      limitations:
        "Keine individuelle Einschätzung oder Behandlung einzelner Kinder; erhöhte Sorgfalt bei sensiblen Themen (Safeguarding).",
    },
    en: {
      name: "Children, Parenting & Development",
      description:
        "General questions about parenting approaches and child development — no assessment of individual children.",
      examples: [
        "Which parenting approaches foster self-regulation?",
        "How does screen time affect specific areas of development?",
        "Which learning environment best supports children?",
        "What role does routine play in child development?",
        "How does shared reading affect language development?",
      ],
      limitations:
        "No individual assessment or treatment of specific children; heightened safeguarding care for sensitive topics.",
    },
  },
  {
    slug: "konsum-kaufentscheidungen",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend) — erwartungsgemäss schwächere Abdeckung",
    de: {
      name: "Konsum & Kaufentscheidungen",
      description: "Fragen zu Kaufverhalten, Produktentscheidungen und Konsumpsychologie.",
      examples: [
        "Welche Produktmerkmale beeinflussen nachweislich Haltbarkeit?",
        "Wie wirken Preisanker auf Kaufentscheidungen?",
        "Welche Labels unterstützen bessere Konsumentscheidungen?",
        "Welche Haushaltsmassnahmen sparen tatsächlich Energie?",
        "Wie beeinflussen Bewertungen anderer Nutzer Kaufentscheidungen?",
      ],
      limitations:
        "Forschungsabdeckung zu Konsumentscheidungen ist unregelmässiger als in Gesundheit/Bildung; häufiger nur eingeschränkte Eignung.",
    },
    en: {
      name: "Consumer & Purchasing Decisions",
      description: "Questions about buying behavior, product decisions, and consumer psychology.",
      examples: [
        "Which product features demonstrably influence durability?",
        "How do price anchors affect purchasing decisions?",
        "Which labels support better consumer decisions?",
        "Which household measures actually save energy?",
        "How do other users' reviews influence purchasing decisions?",
      ],
      limitations:
        "Research coverage for consumer decisions is less consistent than in health/education; limited eligibility is more common.",
    },
  },
  {
    slug: "umwelt-nachhaltigkeit",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend) — erwartungsgemäss schwächere Abdeckung",
    de: {
      name: "Umwelt, Nachhaltigkeit & Alltag",
      description: "Fragen zu nachhaltigem Verhalten und dessen messbarer Wirkung im Alltag.",
      examples: [
        "Welche Alltagsmassnahmen reduzieren den persönlichen Energieverbrauch?",
        "Welche Verpackungsalternativen schneiden in Studien besser ab?",
        "Welche Mobilitätsentscheidungen haben den grössten messbaren Effekt?",
        "Wie wirksam ist Recycling im Vergleich zu Konsumreduktion?",
        "Welche Ernährungsumstellungen haben den grössten ökologischen Effekt?",
      ],
      limitations:
        "Studienlage ist oft kontext- und länderspezifisch; Ergebnisse lassen sich nicht immer verallgemeinern.",
    },
    en: {
      name: "Environment, Sustainability & Everyday Life",
      description: "Questions about sustainable behavior and its measurable everyday impact.",
      examples: [
        "Which everyday measures reduce personal energy consumption?",
        "Which packaging alternatives perform better in studies?",
        "Which mobility choices have the largest measurable effect?",
        "How effective is recycling compared to reducing consumption?",
        "Which dietary changes have the largest ecological effect?",
      ],
      limitations:
        "Evidence is often context- and country-specific; results don't always generalize.",
    },
  },
  {
    slug: "technologie-digital-life",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend)",
    de: {
      name: "Technologie & Digital Life",
      description: "Fragen zu digitalen Gewohnheiten, Tools und deren Wirkung auf Alltag und Leistung.",
      examples: [
        "Wie beeinflussen soziale Medien Konzentration und Wohlbefinden?",
        "Verbessern KI-Tools Produktivität oder Lernleistung?",
        "Welche Passwort- und Sicherheitsgewohnheiten sind wirksam?",
        "Wie wirken digitale Unterbrechungen auf Leistung?",
        "Welchen Effekt hat digitale Bildschirmzeit auf die Schlafqualität?",
      ],
      limitations:
        "Schnelllebiges Forschungsfeld; viele Studien beziehen sich auf spezifische Plattformen oder Altersgruppen.",
    },
    en: {
      name: "Technology & Digital Life",
      description: "Questions about digital habits, tools, and their effect on everyday life and performance.",
      examples: [
        "How do social media affect concentration and well-being?",
        "Do AI tools improve productivity or learning performance?",
        "Which password and security habits are effective?",
        "How do digital interruptions affect performance?",
        "What effect does digital screen time have on sleep quality?",
      ],
      limitations:
        "Fast-moving research field; many studies relate to specific platforms or age groups.",
    },
  },
];

export function getTopic(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}

export function topicCopy(topic: Topic, locale: Locale): TopicCopy {
  return topic[locale];
}
