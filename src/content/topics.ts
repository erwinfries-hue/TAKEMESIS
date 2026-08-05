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

import type { Locale } from "@/lib/i18n/config";

export type { Locale } from "@/lib/i18n/config";
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
  fr: TopicCopy;
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
        "Welche Massnahmen zeigen die stärkste präventive Wirkung bei gesunden Erwachsenen?",
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
        "Which measures show the strongest preventive effect for healthy adults?",
        "What effect does regular exercise have on general disease risk?",
        "Which everyday measures support a healthy immune system?",
      ],
      limitations:
        "Questions about diagnosis, medication, dosing, acute symptoms, or other high-risk topics are not answered individually and do not replace professional medical advice.",
    },
    fr: {
      name: "Santé & Prévention",
      description:
        "Questions générales et non diagnostiques sur la prévention et un mode de vie sain — aucun diagnostic, aucun traitement individuel.",
      examples: [
        "Quelles mesures réduisent le risque de douleurs dorsales fréquentes ?",
        "Quelles mesures de prévention sont bien étayées pour les adultes en bonne santé ?",
        "Quelles mesures montrent l'effet préventif le plus marqué chez les adultes en bonne santé ?",
        "Quel est l'effet de l'activité physique régulière sur le risque général de maladie ?",
        "Quelles mesures soutiennent un système immunitaire sain au quotidien ?",
      ],
      limitations:
        "Les questions portant sur des diagnostics, médicaments, dosages, symptômes aigus ou autres thèmes à risque élevé ne reçoivent pas de réponse individuelle et ne remplacent pas un avis médical spécialisé.",
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
    fr: {
      name: "Alimentation & Compléments",
      description:
        "Questions sur les habitudes alimentaires, les compléments alimentaires et leur utilité pour des objectifs précis.",
      examples: [
        "Quels bénéfices des oméga-3 sont bien étayés ?",
        "La créatine améliore-t-elle la performance mentale ou physique ?",
        "Quels sont les effets du jeûne intermittent ?",
        "Les probiotiques sont-ils utiles pour des objectifs précis ?",
        "Quel rôle joue l'apport en protéines pour le maintien musculaire avec l'âge ?",
      ],
      limitations:
        "Aucune recommandation de dosage individuelle ni indication sur les interactions médicamenteuses.",
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
    fr: {
      name: "Sommeil & Récupération",
      description: "Questions sur la qualité du sommeil, la récupération et les facteurs qui les influencent.",
      examples: [
        "Quelles mesures améliorent démontrablement la qualité du sommeil ?",
        "Quel effet a la mélatonine selon les groupes ?",
        "Comment l'utilisation des écrans influence-t-elle le sommeil ?",
        "Quel effet a la consommation de caféine l'après-midi sur le sommeil ?",
        "Comment un rythme de sommeil régulier influence-t-il la récupération ?",
      ],
      limitations:
        "Aucune évaluation des troubles du sommeil diagnostiqués ni de la médication individuelle.",
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
    fr: {
      name: "Fitness & Performance physique",
      description: "Questions sur l'entraînement, l'endurance, la récupération et la performance physique.",
      examples: [
        "Quelle méthode d'entraînement soutient le mieux la prise de muscle ?",
        "Qu'est-ce qui améliore l'endurance le plus efficacement ?",
        "Quel bénéfice a l'exposition au froid pour la récupération ?",
        "Comment la fréquence d'entraînement influence-t-elle les gains de force ?",
        "Quel rôle joue l'étirement dans la prévention des blessures ?",
      ],
      limitations:
        "Aucune planification individuelle d'entraînement ou de rééducation en cas de blessures existantes.",
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
    fr: {
      name: "Apprentissage & Éducation",
      description: "Questions sur les méthodes d'apprentissage, la mémoire et la réussite scolaire.",
      examples: [
        "Quelle méthode d'apprentissage améliore la réussite scolaire ?",
        "Le rappel actif fonctionne-t-il mieux que la relecture ?",
        "Quel rôle joue la répétition espacée ?",
        "La prise de notes manuscrite améliore-t-elle la rétention ?",
        "Comment l'entrelacement influence-t-il la réussite de l'apprentissage ?",
      ],
      limitations:
        "Les résultats proviennent surtout d'études portant sur des populations spécifiques (p. ex. étudiant·es) et ne se transposent pas automatiquement à toute situation d'apprentissage.",
    },
  },
  {
    slug: "arbeit-produktivitaet",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend)",
    de: {
      name: "Arbeit, Produktivität & Organisation",
      description:
        "Fragen zu Arbeitsformen, Produktivität, Vergütung/Zusatzleistungen und Organisation im Berufsalltag.",
      examples: [
        "Wie beeinflusst Homeoffice die Produktivität?",
        "Welchen Einfluss hat Multitasking auf die Arbeitsleistung?",
        "Unterstützen Fokuszeiten die Arbeitsleistung?",
        "Welche Arbeitszeitmodelle verbessern Leistung und Wohlbefinden?",
        "Wie wirken sich Unterbrechungen auf konzentrierte Arbeit aus?",
        "Welche Zusatzleistungen verbessern die Mitarbeiterzufriedenheit am stärksten?",
      ],
      limitations:
        "Ergebnisse sind stark kontextabhängig (Branche, Rolle, Unternehmenskultur) und nicht universell übertragbar.",
    },
    en: {
      name: "Work, Productivity & Organization",
      description:
        "Questions about work formats, productivity, compensation/benefits, and organization at work.",
      examples: [
        "How does remote work affect productivity?",
        "What influence does multitasking have on productivity?",
        "Do focus blocks support work performance?",
        "Which work-time models improve performance and well-being?",
        "How do interruptions affect focused work?",
        "Which employee benefits most improve job satisfaction?",
      ],
      limitations:
        "Results are highly context-dependent (industry, role, company culture) and don't transfer universally.",
    },
    fr: {
      name: "Travail, Productivité & Organisation",
      description:
        "Questions sur les formes de travail, la productivité, la rémunération/les avantages et l'organisation au travail.",
      examples: [
        "Comment le télétravail influence-t-il la productivité ?",
        "Quelle influence le multitâche a-t-il sur la performance au travail ?",
        "Les plages de concentration soutiennent-elles la performance au travail ?",
        "Quels modèles de temps de travail améliorent la performance et le bien-être ?",
        "Comment les interruptions influencent-elles le travail concentré ?",
        "Quels avantages sociaux améliorent le plus la satisfaction des employé·es ?",
      ],
      limitations:
        "Les résultats dépendent fortement du contexte (secteur, fonction, culture d'entreprise) et ne se transposent pas universellement.",
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
        "Wie wirksam sind Achtsamkeitsübungen?",
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
        "How effective are mindfulness exercises?",
        "What factors favor sticking with new habits?",
        "How are social contact and general well-being related?",
      ],
      limitations:
        "Acute mental-health crises or clinical questions are not addressed individually; users are pointed to qualified support instead.",
    },
    fr: {
      name: "Psychologie, Bien-être & Habitudes",
      description: "Questions sur la formation des habitudes, la régulation du stress et le bien-être au quotidien.",
      examples: [
        "Quelles méthodes aident à instaurer des habitudes durables ?",
        "Quelles interventions réduisent le stress quotidien ?",
        "Dans quelle mesure les exercices de pleine conscience sont-ils efficaces ?",
        "Quels facteurs favorisent le maintien de nouvelles habitudes ?",
        "Quel est le lien entre les contacts sociaux et le bien-être général ?",
      ],
      limitations:
        "Les crises psychiques aiguës ou les questions cliniques ne sont pas traitées individuellement ; un renvoi vers des services spécialisés est proposé.",
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
        "How effective is active listening for resolving conflict?",
        "What role does shared time play in relationship quality?",
        "How does appreciation affect satisfaction in relationships?",
      ],
      limitations:
        "No individual couples or family counseling; general, non-personalized orientation only.",
    },
    fr: {
      name: "Relations & Communication",
      description: "Questions sur la communication, la résolution de conflits et la satisfaction relationnelle.",
      examples: [
        "Quelles méthodes de communication améliorent la résolution de conflits ?",
        "Quels facteurs soutiennent la satisfaction relationnelle à long terme ?",
        "Quelle est l'efficacité de l'écoute active ?",
        "Quel rôle joue le temps partagé pour la qualité de la relation ?",
        "Comment la reconnaissance influence-t-elle la satisfaction dans les relations ?",
      ],
      limitations:
        "Aucun conseil individuel de couple ou familial ; orientation générale, non personnalisée.",
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
        "Welchen Effekt hat regelmässige Bewegung auf die kindliche Entwicklung?",
        "Welche Lernumgebung unterstützt Kinder am besten?",
        "Welche Rolle spielt Routine für die kindliche Entwicklung?",
        "Wie wirkt sich Vorlesen auf die Sprachentwicklung aus?",
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
        "What effect does regular physical activity have on child development?",
        "Which learning environment best supports children?",
        "What role does routine play in child development?",
        "How does reading aloud affect language development?",
      ],
      limitations:
        "No individual assessment or treatment of specific children; heightened safeguarding care for sensitive topics.",
    },
    fr: {
      name: "Enfants, Éducation & Développement",
      description:
        "Questions générales sur les approches éducatives et le développement de l'enfant — aucune évaluation d'enfants individuels.",
      examples: [
        "Quelles approches éducatives favorisent l'autorégulation ?",
        "Quel effet l'activité physique régulière a-t-elle sur le développement de l'enfant ?",
        "Quel environnement d'apprentissage soutient le mieux les enfants ?",
        "Quel rôle joue la routine dans le développement de l'enfant ?",
        "Comment la lecture à voix haute influence-t-elle le développement du langage ?",
      ],
      limitations:
        "Aucune évaluation ou traitement individuel d'enfants spécifiques ; vigilance accrue pour les sujets sensibles (protection de l'enfance).",
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
        "Welchen Einfluss hat Nachhaltigkeit auf das Kaufverhalten?",
        "Wie beeinflusst Verpackung das Kaufverhalten?",
        "Welche Labels beeinflussen das Kaufverhalten nachweislich?",
        "Welche Haushaltsmassnahmen sparen tatsächlich Energie?",
        "Wie beeinflussen Bewertungen anderer Nutzer das Kaufverhalten?",
      ],
      limitations:
        "Forschungsabdeckung zu Konsumentscheidungen ist unregelmässiger als in Gesundheit/Bildung; häufiger nur eingeschränkte Eignung.",
    },
    en: {
      name: "Consumer & Purchasing Decisions",
      description: "Questions about buying behavior, product decisions, and consumer psychology.",
      examples: [
        "What influence does sustainability have on buying behavior?",
        "How does packaging influence buying behavior?",
        "Which labels demonstrably influence buying behavior?",
        "Which household measures actually save energy?",
        "How do other users' reviews influence buying behavior?",
      ],
      limitations:
        "Research coverage for consumer decisions is less consistent than in health/education; limited eligibility is more common.",
    },
    fr: {
      name: "Consommation & Décisions d'achat",
      description: "Questions sur le comportement d'achat, les décisions relatives aux produits et la psychologie de la consommation.",
      examples: [
        "Quelle influence la durabilité a-t-elle sur le comportement d'achat ?",
        "Comment l'emballage influence-t-il le comportement d'achat ?",
        "Quels labels influencent démontrablement le comportement d'achat ?",
        "Quelles mesures ménagères permettent réellement d'économiser de l'énergie ?",
        "Comment les avis d'autres utilisateur·rices influencent-ils le comportement d'achat ?",
      ],
      limitations:
        "La couverture de recherche sur les décisions de consommation est moins homogène que dans la santé/l'éducation ; une éligibilité limitée est plus fréquente.",
    },
  },
  {
    slug: "umwelt-nachhaltigkeit",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · Crossref (ergänzend) — erwartungsgemäss schwächere Abdeckung",
    de: {
      name: "Umwelt, Nachhaltigkeit & Alltag",
      description:
        "Fragen zu nachhaltigem Verhalten, Klimawandel und dessen messbarer Wirkung im Alltag.",
      examples: [
        "Welchen Einfluss hat Mobilität auf die Nachhaltigkeit?",
        "Welche Verpackungsalternativen schneiden in Studien besser ab?",
        "Welche Mobilitätsformen haben den grössten messbaren ökologischen Effekt?",
        "Wie wirksam ist Recycling im Vergleich zu Konsumreduktion?",
        "Welche Ernährungsumstellungen haben den grössten ökologischen Effekt?",
        "Welche Massnahmen reduzieren den CO2-Fussabdruck im Alltag nachweislich?",
        "Welche Faktoren treiben den Klimawandel nachweislich am stärksten an?",
        "Wie wirksam sind Massnahmen gegen den Klimawandel im Alltag wirklich?",
      ],
      limitations:
        "Studienlage ist oft kontext- und länderspezifisch; Ergebnisse lassen sich nicht immer verallgemeinern.",
    },
    en: {
      name: "Environment, Sustainability & Everyday Life",
      description:
        "Questions about sustainable behavior, climate change, and its measurable everyday impact.",
      examples: [
        "What influence does mobility have on sustainability?",
        "Which packaging alternatives perform better in studies?",
        "Which mobility choices have the largest measurable ecological effect?",
        "How effective is recycling compared to reducing consumption?",
        "Which dietary changes have the largest ecological effect?",
        "Which everyday measures demonstrably reduce your carbon footprint?",
        "Which factors are the largest proven drivers of climate change?",
        "How effective are everyday measures against climate change really?",
      ],
      limitations:
        "Evidence is often context- and country-specific; results don't always generalize.",
    },
    fr: {
      name: "Environnement, Durabilité & Quotidien",
      description:
        "Questions sur les comportements durables, le changement climatique et leur effet mesurable au quotidien.",
      examples: [
        "Quelle influence la mobilité a-t-elle sur la durabilité ?",
        "Quelles alternatives d'emballage obtiennent de meilleurs résultats dans les études ?",
        "Quels modes de mobilité ont l'effet écologique mesurable le plus important ?",
        "Quelle est l'efficacité du recyclage par rapport à la réduction de la consommation ?",
        "Quels changements alimentaires ont l'effet écologique le plus important ?",
        "Quelles mesures quotidiennes réduisent réellement l'empreinte carbone ?",
        "Quels facteurs sont les principaux moteurs prouvés du changement climatique ?",
        "Quelle est l'efficacité réelle des mesures quotidiennes contre le changement climatique ?",
      ],
      limitations:
        "Les données sont souvent spécifiques au contexte et au pays ; les résultats ne se généralisent pas toujours.",
    },
  },
  {
    slug: "technologie-digital-life",
    riskProfile: "standard",
    sourceRoute: "OpenAlex (primär) · arXiv, Crossref (ergänzend)",
    de: {
      name: "Technologie & Digital Life",
      description: "Fragen zu digitalen Gewohnheiten, Tools und deren Wirkung auf Alltag und Leistung.",
      examples: [
        "Wie beeinflussen soziale Medien Konzentration und Wohlbefinden?",
        "Wie beeinflusst der Einsatz von KI-Tools das digitale Lernverhalten?",
        "Welche Passwort- und Sicherheitsgewohnheiten sind wirksam?",
        "Wie wirken digitale Unterbrechungen auf Leistung?",
        "Wie wirken sich Smartphone-Benachrichtigungen auf das digitale Wohlbefinden aus?",
      ],
      limitations:
        "Schnelllebiges Forschungsfeld; viele Studien beziehen sich auf spezifische Plattformen oder Altersgruppen.",
    },
    en: {
      name: "Technology & Digital Life",
      description: "Questions about digital habits, tools, and their effect on everyday life and performance.",
      examples: [
        "How do social media affect concentration and well-being?",
        "How does the use of AI tools affect digital learning behavior?",
        "Which password and security habits are effective?",
        "How do digital interruptions affect performance?",
        "How do smartphone notifications affect digital well-being?",
      ],
      limitations:
        "Fast-moving research field; many studies relate to specific platforms or age groups.",
    },
    fr: {
      name: "Technologie & Vie numérique",
      description: "Questions sur les habitudes numériques, les outils et leur effet sur le quotidien et la performance.",
      examples: [
        "Comment les réseaux sociaux influencent-ils la concentration et le bien-être ?",
        "Comment l'utilisation d'outils d'IA influence-t-elle le comportement d'apprentissage numérique ?",
        "Quelles habitudes en matière de mots de passe et de sécurité sont efficaces ?",
        "Comment les interruptions numériques influencent-elles la performance ?",
        "Comment les notifications sur smartphone influencent-elles le bien-être numérique ?",
      ],
      limitations:
        "Domaine de recherche en évolution rapide ; de nombreuses études portent sur des plateformes ou tranches d'âge spécifiques.",
    },
  },
];

export function getTopic(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}

export function topicCopy(topic: Topic, locale: Locale): TopicCopy {
  return topic[locale];
}
