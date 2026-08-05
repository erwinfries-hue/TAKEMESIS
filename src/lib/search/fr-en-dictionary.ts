/**
 * Curated French→English term dictionary for query-translation.ts.
 *
 * Same rationale as de-en-dictionary.ts: OpenAlex, Crossref, Europe PMC, and
 * NCBI/PubMed index overwhelmingly English-language content, so a French
 * question sent to them as-is returns almost nothing. This is a flat,
 * single-token lookup covering the vocabulary that actually shows up in
 * TEKMESIS's 12 topic categories (content/topics.ts's fr copy) plus general
 * adjacent scientific/everyday terms.
 *
 * Deliberately not exhaustive and not grammatically precise, for the same
 * reasons as the German dictionary. Unmatched tokens pass through unchanged
 * in query-translation.ts rather than being dropped, so a coverage gap never
 * makes the query worse than before this dictionary existed.
 *
 * One extra limitation specific to French: unlike German's single-word
 * compounds (e.g. "Herzgesundheit"), French expresses the same concepts as
 * multi-word phrases ("pleine conscience", "mot de passe"). Because this
 * dictionary translates one token at a time, such phrases only get partial
 * coverage via their individual content words — full phrase-level matching
 * would need an n-gram lookup, which is out of scope for this flat table.
 *
 * Keys are lowercase tokens matching query-translation.ts's tokenizer output
 * (which also splits on apostrophes and hyphens, e.g. "qu'est-ce" → "qu",
 * "est", "ce" — single-letter elision fragments like "d"/"l"/"qu" belong in
 * that tokenizer's French stopword list, not in this dictionary).
 */
export const FR_EN_DICTIONARY: Record<string, string> = {
  // General question/science vocabulary (cuts across all topics)
  mesures: "measures",
  mesure: "measure",
  réduit: "reduces",
  réduisent: "reduce",
  réduire: "reduce",
  risque: "risk",
  risques: "risks",
  fréquentes: "common",
  fréquente: "common",
  fréquent: "common",
  effet: "effect",
  effets: "effects",
  marqué: "pronounced",
  efficace: "effective",
  efficacité: "effectiveness",
  influence: "influence",
  influencent: "affect",
  bénéfice: "benefit",
  bénéfices: "benefits",
  avantage: "benefit",
  avantages: "benefits",
  étayées: "supported",
  étayés: "supported",
  étayé: "supported",
  rôle: "role",
  joue: "plays",
  régulière: "regular",
  régulier: "regular",
  réguliers: "regular",
  régulières: "regular",
  générale: "general",
  général: "general",
  générales: "general",
  généraux: "general",
  individuelle: "individual",
  individuelles: "individual",
  individuel: "individual",
  individuels: "individual",
  meilleur: "best",
  meilleure: "best",
  meilleurs: "best",
  meilleures: "best",
  mieux: "best",
  méthode: "method",
  méthodes: "methods",
  approche: "approach",
  approches: "approaches",
  intervention: "intervention",
  interventions: "interventions",
  comparaison: "comparison",
  différence: "difference",
  soutient: "supports",
  soutiennent: "support",
  favorise: "promotes",
  favorisent: "promote",
  améliore: "improves",
  améliorent: "improve",
  amélioration: "improvement",
  augmente: "increases",
  augmentent: "increase",
  quotidien: "everyday",
  quotidienne: "everyday",
  quotidiennes: "everyday",
  quotidiens: "everyday",
  quotidiennement: "daily",

  // Santé & Prévention / Health & Prevention
  prévention: "prevention",
  préventif: "preventive",
  préventive: "preventive",
  préventives: "preventive",
  douleurs: "pain",
  dorsales: "back",
  maladie: "disease",
  activité: "activity",
  système: "system",
  immunitaire: "immune",
  sain: "healthy",
  saine: "healthy",
  sains: "healthy",
  santé: "health",

  // Alimentation & Compléments / Nutrition & Supplements
  alimentation: "nutrition",
  alimentaires: "dietary",
  habitudes: "habits",
  compléments: "supplements",
  complément: "supplement",
  oméga3: "omega-3",
  créatine: "creatine",
  performance: "performance",
  mentale: "mental",
  physique: "physical",
  jeûne: "fasting",
  intermittent: "intermittent",
  probiotiques: "probiotics",
  utiles: "useful",
  utile: "useful",
  objectifs: "goals",
  apport: "intake",
  protéines: "protein",
  maintien: "maintenance",
  musculaire: "muscular",
  âge: "age",
  vitamine: "vitamin",
  magnésium: "magnesium",

  // Sommeil & Récupération / Sleep & Regeneration
  sommeil: "sleep",
  qualité: "quality",
  récupération: "recovery",
  mélatonine: "melatonin",
  écrans: "screens",
  écran: "screen",
  utilisation: "use",
  caféine: "caffeine",
  consommation: "consumption",
  rythme: "schedule",
  troubles: "disorders",

  // Fitness & Performance physique / Fitness & Physical Performance
  entraînement: "training",
  muscle: "muscle",
  prise: "gain",
  endurance: "endurance",
  exposition: "exposure",
  froid: "cold",
  fréquence: "frequency",
  gains: "gains",
  force: "strength",
  étirement: "stretching",
  blessures: "injuries",
  blessure: "injury",
  réhabilitation: "rehabilitation",

  // Apprentissage & Éducation / Learning & Education
  apprentissage: "learning",
  réussite: "success",
  scolaire: "academic",
  mémoire: "memory",
  rappel: "recall",
  actif: "active",
  relecture: "rereading",
  répétition: "repetition",
  espacée: "spaced",
  notes: "notes",
  manuscrite: "handwritten",
  rétention: "retention",
  entrelacement: "interleaving",

  // Travail, Productivité & Organisation / Work, Productivity & Organization
  télétravail: "remote work",
  productivité: "productivity",
  formats: "formats",
  réunion: "meeting",
  temps: "time",
  travail: "work",
  "bien-être": "well-being",
  interruptions: "interruptions",
  concentré: "focused",
  concentration: "concentration",
  sociaux: "social",
  satisfaction: "satisfaction",
  employé: "employee",
  employés: "employees",
  salaire: "salary",
  rémunération: "compensation",
  organisation: "organization",

  // Psychologie, Bien-être & Habitudes / Psychology, Well-being & Habits
  habitude: "habit",
  durables: "lasting",
  instaurer: "establish",
  stress: "stress",
  régulation: "regulation",
  gratitude: "gratitude",
  exercices: "exercises",
  nouvelles: "new",
  lien: "link",
  contacts: "contacts",

  // Relations & Communication / Relationships & Communication
  communication: "communication",
  résolution: "resolution",
  conflits: "conflicts",
  conflit: "conflict",
  relationnelle: "relationship",
  écoute: "listening",
  active: "active",
  partagé: "shared",
  relation: "relationship",
  reconnaissance: "appreciation",
  relations: "relationships",

  // Enfants, Éducation & Développement / Children, Parenting & Development
  éducatives: "educational",
  autorégulation: "self-regulation",
  domaines: "areas",
  développement: "development",
  environnement: "environment",
  enfants: "children",
  enfant: "child",
  routine: "routine",
  lecture: "reading",
  langage: "language",

  // Consommation & Décisions d'achat / Consumer & Purchasing Decisions
  caractéristiques: "features",
  produit: "product",
  durabilité: "sustainability",
  ancrages: "anchors",
  prix: "price",
  comportement: "behavior",
  achat: "purchase",
  labels: "labels",
  ménagères: "household",
  économiser: "save",
  énergie: "energy",
  avis: "reviews",
  utilisateur: "user",
  utilisateurs: "users",
  décisions: "decisions",

  // Environnement, Durabilité & Quotidien / Environment, Sustainability & Everyday Life
  alternatives: "alternatives",
  emballage: "packaging",
  modes: "modes",
  mobilité: "mobility",
  écologique: "ecological",
  recyclage: "recycling",
  réduction: "reduction",
  changements: "changes",
  // Static entries mirroring the German-dictionary fix (2026-08-05): French
  // is opted into the AI-fallback tier (AUTO_LEARN_LOCALES) which could
  // cover gaps like this, but only when ANTHROPIC_API_KEY is actually
  // configured — without it these terms would silently pass through
  // untranslated, same failure mode as German had.
  changement: "change",
  climatique: "climate",
  réchauffement: "warming",
  empreinte: "footprint",
  carbone: "carbon",
  gaz: "gas",
  serre: "greenhouse",
  émissions: "emissions",
  émission: "emission",

  // Technologie & Vie numérique / Technology & Digital Life
  réseaux: "networks",
  outils: "tools",
  ia: "AI",
  numérique: "digital",
  sécurité: "security",
  notifications: "notifications",
  smartphone: "smartphone",
  technologie: "technology",
  vie: "life",
};
