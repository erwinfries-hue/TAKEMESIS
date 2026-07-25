# Source Coverage Matrix

Per `07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md`: no single-source
architecture. Each topic category is routed to a primary and secondary source role.
Adapter implementation must verify current official API docs/terms at build time —
this matrix defines routing intent, not final query parameters.

| Category | Primary source role | Secondary / enrichment | Notes |
|---|---|---|---|
| Gesundheit & Prävention | Europe PMC, PubMed/NCBI E-utilities | OpenAlex, Crossref | Non-diagnostic prevention only; high-risk sub-topics routed to `restricted_high_risk` before search |
| Ernährung & Supplements | Europe PMC, PubMed/NCBI | OpenAlex, Crossref | |
| Schlaf & Regeneration | Europe PMC, PubMed/NCBI | OpenAlex, Crossref | |
| Fitness & körperliche Leistungsfähigkeit | Europe PMC, PubMed/NCBI | OpenAlex, Crossref | Sports-science leaning; OpenAlex often has better coverage than PubMed here |
| Lernen & Bildung | OpenAlex | Crossref; optional ERIC (P1) | Curated example report topic (decision #3) lives here |
| Arbeit, Produktivität & Organisation | OpenAlex | Crossref | |
| Psychologie, Wohlbefinden & Gewohnheiten | OpenAlex | Europe PMC (where clinical-adjacent), Crossref | |
| Beziehungen & Kommunikation | OpenAlex | Crossref | |
| Kinder, Erziehung & Entwicklung | OpenAlex | Europe PMC/NCBI (developmental-health-adjacent), Crossref | Heightened safeguarding language; individual-child-assessment questions routed to `restricted_high_risk` |
| Konsum & Kaufentscheidungen | OpenAlex | Crossref | Weaker biomedical relevance; expect more `eligible_with_limitations` |
| Umwelt, Nachhaltigkeit & Alltag | OpenAlex | Crossref | |
| Technologie & Digital Life | OpenAlex | Crossref | |

## Layer roles (all categories)

- **Broad discovery:** OpenAlex — primary discovery graph across all 12 domains.
- **Metadata verification:** Crossref — DOI/publisher metadata enrichment for every
  candidate record regardless of domain.
- **Biomedical/health enrichment:** Europe PMC + NCBI E-utilities — used where the
  category or the specific question is health/biomedical-adjacent.
- **Optional:** Semantic Scholar — only if approved later; not in P0 build.
- **Content layer:** abstracts and legally available open-access full text only,
  from whichever of the above returns it — no scraping, no paywall bypass.

## Coverage honesty (applies to every report)

- Sources searched vs. sources unavailable stated explicitly.
- Search date stated.
- Metadata-only vs. abstract-supported vs. full-text-supported distinguished per
  study in the comparison table.
- No claim of exhaustive literature coverage, ever.

## Expected weaker-coverage categories (beta risk, tracked in `OPEN_RISKS.md`)

Konsum & Kaufentscheidungen, Umwelt/Nachhaltigkeit, and Beziehungen &
Kommunikation are expected to hit `eligible_with_limitations` or `not_eligible`
more often than health/education topics, since OpenAlex/Crossref coverage for
consumer-behavior and everyday-sustainability research is less consistently
structured than biomedical/education literature. This is disclosed to users via
the standard eligibility/limitations UX, not hidden.
