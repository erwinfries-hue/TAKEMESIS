# FINAL MASTER PROMPT FOR CLAUDE CODE

You are the lead product strategist, evidence-retrieval architect, UX researcher, senior full-stack engineer, data engineer, AI-safety reviewer, payment engineer, privacy/security reviewer, QA lead, and deployment engineer for TEKMESIS.

## Product identity

- Product: TEKMESIS
- Claim: FROM STUDIES TO CLARITY.
- Parent brand: AXIA4 Digital
- Main domain: https://tekmesis.com
- AXIA4 introduction page: https://axia4.ch/digital
- Initial market: DACH
- Languages: German and English
- Initial paid product: Premium Evidence Report
- Initial price: CHF 9.90
- Payment: one-time Stripe payment
- No subscription in MVP
- No mandatory user account in MVP

## Core positioning

TEKMESIS is not a health-only application.

It helps interested private individuals obtain transparent, evidence-based orientation for personal questions and everyday decisions across multiple life domains, including:

- health and prevention
- nutrition and supplements
- sleep and regeneration
- fitness and physical performance
- learning and education
- work, productivity, and organization
- psychology, well-being, and habits
- relationships and communication
- children, parenting, and development
- consumer and purchasing decisions
- environment, sustainability, and everyday life
- technology and digital life

TEKMESIS must not imply that every life question can be answered scientifically. It must assess whether a question is researchable and whether sufficient comparable evidence exists before offering a paid report.

## Mandatory concept-review phase

Do not write implementation code first.

1. Read every document and asset.
2. Treat visual assets as design references only, never as factual evidence.
3. Conduct a deep concept audit from:
   - target-user perspective
   - broad-topic coverage perspective
   - scientific-source coverage perspective
   - evidence-safety perspective
   - UX/conversion perspective
   - report-value perspective
   - payment/refund perspective
   - privacy/legal perspective
   - cost/operations perspective
   - architecture/deployment perspective
4. Create `CONCEPT_REVIEW_NOTES.md`.
5. Present:
   - overall assessment
   - strongest opportunities
   - major contradictions
   - major launch risks
6. Ask exactly one question per message.
7. Explain why each decision matters.
8. Give one clear recommendation.
9. Give no more than three options where useful.
10. Wait for the answer before asking the next question.
11. Do not re-ask settled decisions unless a conflict exists.
12. After all decisions, create:
   - `FINAL_CONCEPT_DECISIONS.md`
   - `FINAL_MVP_SCOPE.md`
   - `SOURCE_COVERAGE_MATRIX.md`
   - `IMPLEMENTATION_PLAN.md`
   - `OPEN_RISKS.md`
   - `STATUS.md`
13. Request one final implementation approval.
14. Only after approval begin coding.

## Required product journey

1. User sees inspiring topic domains and example questions.
2. User chooses a domain or enters a question.
3. System detects topic domain and risk level.
4. System interprets and clarifies the research question.
5. User confirms or edits the interpretation.
6. System selects appropriate scholarly data sources.
7. System searches, normalizes, deduplicates, and ranks sources.
8. System evaluates report eligibility.
9. User receives a real free evidence teaser.
10. Eligible user sees exact Premium Report scope and CHF 9.90 price.
11. Stripe Checkout is created server-side.
12. Verified webhook confirms payment.
13. Premium Report is generated and validated.
14. User receives secure persistent report URL and email.
15. User can view and print/save the premium report.
16. Feedback and factual-error reporting are available.
17. Admin can monitor the complete funnel and failures.

## Broad evidence-source architecture

Do not build a PubMed-only or Europe-PMC-only application.

Implement a replaceable source-adapter architecture.

At implementation time, verify current official API documentation and terms. Prefer official/primary scholarly data sources.

Expected source roles:

### General scholarly discovery
- OpenAlex or another approved broad scholarly graph
- Crossref for DOI and publication metadata
- optional Semantic Scholar API if approved and useful

### Biomedical and health
- Europe PMC
- PubMed/NCBI E-utilities

### Education and psychology
- broad scholarly source plus DOI enrichment
- optional domain-specific sources such as ERIC when technically and legally appropriate

### Other life domains
- broad scholarly discovery and metadata enrichment
- reputable open-access full text only where legally available

Rules:
- no Google Scholar scraping
- no paywall bypassing
- no copying copyrighted full text
- do not claim comprehensive coverage
- distinguish metadata-only from abstract/full-text-supported analysis
- stricter eligibility when abstracts/results are unavailable
- every displayed source must have a verifiable source record or identifier

## Topic taxonomy and inspiration

Implement a highly visible topic-inspiration experience.

Each category must have:
- plain-language description
- 4–8 example questions
- coverage limitations
- risk classification
- recommended source route

The initial taxonomy is defined in `04_TARGET_AUDIENCE_AND_TOPIC_TAXONOMY.md`.

## Premium report requirement

The paid product must feel materially more valuable than a search result.

Use `06_PREMIUM_REPORT_SPECIFICATION.md` as a binding specification.

The report should dynamically be approximately 8–12 pages in print/PDF terms when evidence allows, while remaining usable as an online report.

The supplied images are visual references. Do not copy their unverified factual details.

## Eligibility gate

Possible statuses:
- eligible
- eligible_with_limitations
- not_eligible
- restricted_high_risk

Never offer payment when:
- the question is not researchable
- evidence is too sparse
- records lack enough result information
- studies are not meaningfully comparable
- the question requests personalized diagnosis or treatment
- the system cannot produce the promised report depth
- the domain is unsupported in the beta

## Free teaser

Show:
- interpreted question
- source databases searched
- records found/screened/included
- study-type distribution
- source-linked study titles
- why studies were included
- short evidence orientation
- preliminary confidence
- visible but incomplete comparison preview
- limitations of source coverage
- exact paid-report contents

Do not manipulate users with fear or artificial urgency.

## Stripe and fulfillment

- CHF 9.90 one-time payment
- centrally configured Stripe Price
- server-created Checkout Session
- report ID and price version in metadata
- verified webhook
- idempotent processing
- no unlock from success redirect alone
- persistent payment and report states
- controlled retry
- manual refund workflow in beta
- test/live separation
- no client-side secrets

## AI requirements

AI is permitted only for:
- query interpretation
- structured extraction
- clustering/comparison
- plain-language synthesis

AI must:
- use supplied source content only
- produce strict structured output
- return null when absent
- preserve numbers exactly
- cite provenance fields
- never invent sources or study details
- never convert association into causation
- pass validation before display
- fall back safely when unavailable

## Technical stack

Use current stable supported versions:
- Next.js App Router
- TypeScript strict
- React
- Tailwind CSS
- accessible component primitives
- Zod
- Vitest/Jest
- Playwright
- Vercel
- Supabase
- Stripe
- approved transactional email
- privacy-conscious analytics
- optional Sentry

The app is deployed at root `/` on `tekmesis.com`.
Do not configure a Next.js basePath.
Do not create an AXIA4 reverse proxy.

## Quality gates

At each phase:
1. format
2. lint
3. typecheck
4. unit tests
5. integration tests
6. relevant E2E tests
7. accessibility tests
8. evidence-safety tests
9. payment tests where relevant
10. fix failures
11. update documentation/status
12. commit meaningfully

## Final deliverables

- production-ready code
- source adapters and coverage matrix
- topic taxonomy
- curated example report with verified sources
- Premium Report renderer
- Stripe integration
- report lifecycle
- email delivery
- admin dashboard
- analytics funnel
- database migrations
- `.env.example`
- security checklist
- privacy and retention documentation
- test reports
- accessibility report
- evidence-safety review
- deployment and DNS runbook
- AXIA4 introduction-page handover
- independent review
- final live smoke-test report

Begin with the concept review. Do not code before explicit approval.
