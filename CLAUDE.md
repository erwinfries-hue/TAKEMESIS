# CLAUDE.md – Permanent Project Rules

## Identity

TEKMESIS is an AXIA4 Digital product.

- Main domain: `https://tekmesis.com`
- AXIA4 introduction: `https://axia4.ch/digital`
- Price: CHF 9.90 one-time
- No subscription in MVP
- Broad evidence platform, not health-only

## Workflow

- No implementation before concept approval.
- Ask one concept question at a time.
- Document every material decision.
- Keep main deployable.
- Never claim a test passed if it was not run.

## Evidence integrity

Never invent:
- citations
- DOI/PMID/identifiers
- authors
- sample sizes
- methods
- results
- effect sizes
- limitations
- funding/conflicts
- source coverage

Unknown values remain null and display:
- `Nicht angegeben`
- `Not reported`

Never:
- turn association into causation
- equate no evidence with evidence of no effect
- present a protocol as completed evidence
- present an animal study as direct human evidence
- scrape Google Scholar
- bypass paywalls
- copy unlicensed full text
- use visual-reference images as evidence

## Broad-domain rule

A question must be:
- classified by domain
- classified by risk
- mapped to suitable data sources
- tested for researchability
- tested for evidence sufficiency

Unsupported questions must not be sold.

## Payment

- verified Stripe webhook required
- idempotent fulfillment
- no redirect-only unlock
- test mode first
- centralized price config
- manual refunds supported
- failures visible in admin
- no secrets in client or repository

## Privacy

- no mandatory account
- no health profile
- no unnecessary personal data
- warning not to enter names or private health data
- no raw queries in analytics
- approved retention schedule enforced
- secure hashed report tokens

## Design

- use supplied visual references for layout and style only
- use official AXIA4 logo asset
- retain premium, calm, credible visual language
- no fear marketing or dark patterns
- all critical information accessible and mobile-friendly

## Commands

Maintain:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:a11y`
- `npm run verify`

## Human stop conditions

Ask for one exact action only when blocked by:
- login
- secret
- account permission
- DNS ownership
- Stripe configuration
- legal/tax approval
- source licensing/terms decision
