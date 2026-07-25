# Final MVP Scope

Base scope from `03_PRODUCT_STRATEGY_AND_MVP_SCOPE.md`, refined by
`FINAL_CONCEPT_DECISIONS.md`.

## P0 — build for beta launch

- Landing page: brand, topic-inspiration grid (all 12 categories, all visible),
  own-question input, curated example report, how-it-works, free-vs-premium,
  trust/privacy/beta notice, price/no-subscription message.
- Domain + risk classification for all 12 categories, including a dedicated
  high-risk detector independent of category (routes to `restricted_high_risk`).
- Query clarification flow (interpret → confirm/edit → up to 3 alternatives).
- Source-adapter layer: OpenAlex (broad discovery), Crossref (DOI/metadata),
  Europe PMC + NCBI E-utilities (biomedical), normalized record schema, source
  health/status tracking.
- Search, ranking, deduplication, screening with transparent exclusion reasons.
- Eligibility engine implementing the thresholds in decision #4 (configurable
  constants, not hard-coded literals), capped at 15 detailed studies (decision #8).
- Free teaser (real search stats, source-linked titles, preliminary synthesis,
  confidence, coverage limitations, exact paid contents) — rate-limited to
  5 free searches/IP/session/day (decision #7).
- Stripe checkout: CHF 9.90 one-time, price version `MVP-01`, server-created
  session, verified webhook, idempotent fulfillment, no redirect-only unlock.
- Premium Report renderer: all 9 required sections from `06`, print-friendly A4,
  mobile comparison cards, evidence-confidence labeling per `08`.
- Report lifecycle: draft → preview_ready → checkout_started → paid → processing →
  ready/failed → refund_pending/refunded/blocked/expired states; 12-month retention
  with auto-expiry (decision #5); buyer self-revoke control (decision #6).
- Email via Resend (decision #13): report ready, delayed/failed, refund confirmation.
- Feedback and factual-error reporting on every report.
- Admin dashboard: funnel (via PostHog, decision #14, plus internal
  `analytics_events`), source health, payments, report jobs, failures, refunds,
  feedback/issues, cost estimates, audit log.
- DE/EN localization throughout, including the interim tax wording (decision #12).
- Privacy/legal/beta foundations: input warnings, retention policy, `/legal` with
  seller identity (decision #11), support commitment (decision #10).
- Deployment at `tekmesis.com` root, no basePath, no AXIA4 reverse proxy.
- Curated example report (decision #3) built and manually verified early as the
  first end-to-end pipeline validation.

## P1 — explicitly deferred

- Branded generated PDF (beyond browser "Save as PDF")
- Additional specialist databases (e.g. ERIC)
- User accounts and report library
- Sequential price tests
- Richer sharing controls beyond decision #6
- Report updates when new studies appear
- Expert-review workflow

## Explicitly excluded (unchanged from `03`)

Subscriptions, community features, personalized diagnosis, treatment/dosage advice,
medical-record upload, broad web-content summarization, Google Scholar scraping,
paywall bypass, guarantee of comprehensive evidence, native mobile app.

## Gate before P0 is "done"

All acceptance criteria in `14_TEST_AND_ACCEPTANCE_CRITERIA.md` pass, plus the
closed-beta launch (15 users, decision #15) is ready to start.
