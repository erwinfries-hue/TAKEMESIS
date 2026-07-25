# Implementation Plan

Phases from `15_EXECUTION_PHASES.md`, made concrete with the decisions in
`FINAL_CONCEPT_DECISIONS.md`. Each phase ends with: lint, typecheck, relevant
tests, meaningful commit, status update in `STATUS.md`.

## Phase 0 — Concept and source audit (this phase)
Done: `CONCEPT_REVIEW_NOTES.md`, `DECISIONS_LOG.md`, `FINAL_CONCEPT_DECISIONS.md`,
`FINAL_MVP_SCOPE.md`, `SOURCE_COVERAGE_MATRIX.md`, this plan, `OPEN_RISKS.md`,
`STATUS.md`. Blocked on final implementation approval from Erwin.

## Phase 1 — Foundation
Next.js App Router + TypeScript strict scaffold at repo root (no basePath), Tailwind,
i18n (DE/EN) scaffolding, design tokens from `13_DESIGN_SYSTEM_BRAND_AND_ASSETS.md`,
environment validation (Zod-parsed env, matching `.env.example`), CI (lint/typecheck/
test), core test harness (Vitest + Playwright + axe).

## Phase 2 — Topic inspiration and landing
All 12 taxonomy categories as cards (decision #1), example-question chips, own-
question input, curated example report placeholder wired to real data once Phase 8
lands, methodology/trust/legal placeholder pages.

## Phase 3 — Question interpretation
Domain classifier (12 categories) + independent high-risk detector (decision #2)
that can override domain routing to `restricted_high_risk`. Clarification flow with
confirm/edit/alternatives. Tests for unsafe/unsupported handling.

## Phase 4 — Source adapters
OpenAlex, Crossref, Europe PMC, NCBI E-utilities adapters behind the normalized-
record interface from `07`/`10`, per routing in `SOURCE_COVERAGE_MATRIX.md`. Source
health/status tracking, fixtures, adapter unit tests. Verify current official API
docs/terms for each before wiring (per `01`).

## Phase 5 — Search, ranking, screening
Query builders per adapter, deduplication, ranking per `07`'s signals, screening
decisions with exclusion reasons, cap at 15 detailed studies (decision #8) with
transparent "X of Y" disclosure, failure states for source outages.

## Phase 6 — Eligibility and teaser
Eligibility engine implementing decision #4's thresholds as configurable constants.
Free teaser UI. Paywall panel with exact CHF 9.90 price, interim tax wording
(decision #12), central price config (`price_versions` table, `MVP-01`). Free-search
rate limiter at 5/IP/session/day (decision #7).

## Phase 7 — Persistence and Stripe
Supabase migrations for all core tables in `10`. Report lifecycle states. Stripe
Checkout Session (server-side, test mode per `STRIPE_MODE=test`), webhook signature
verification, idempotent event processing, no redirect-only unlock. Self-revoke
control on report page (decision #6).

## Phase 8 — Premium report
AI extraction contract per `08` (strict JSON schema, null-when-absent, no external
knowledge). Comparison matrix, detailed study profiles, integrated synthesis,
confidence labeling, practical interpretation, source appendix. Print layout.
Build and manually verify the curated learning-methods example report (decision #3)
as the first full pipeline validation.

## Phase 9 — Email, admin, analytics
Resend integration (decision #13) for report-ready/delayed/refund emails. Admin
dashboard sections from `11`, including eligible-rate and checkout-conversion as
first-class metrics for the beta checkpoint (decision #15). PostHog EU Cloud
integration (decision #14) with the event whitelist — no raw questions/PII ever
leaves the server in an event payload.

## Phase 10 — Hardening
Security (RLS, hashed tokens, rate limiting, security headers, dependency audit),
privacy (retention job for 12-month expiry, deletion workflow), abuse controls,
accessibility (WCAG 2.2 AA-oriented, axe scan), performance, hallucination/evidence-
safety tests, high-risk routing tests.

## Phase 11 — Preview beta
Vercel preview deployment, Stripe test-mode webhook end-to-end test, external non-
technical test pass, evidence spot checks against the manual founder checklist
(`19`), defect fixes.

## Phase 12 — Production preparation
Domain/DNS runbook execution at Hostpoint (website records only, mail records
untouched), legal/tax sign-off gate: **Treuhänder confirmation on decision #11's
open EU cross-border VAT question is required here**, live Stripe activation,
rollback plan, AXIA4 `/digital` page handover per `17`.

## Phase 13 — Production
Domain/SSL live, one real payment tested, live report/email verified, smoke tests,
independent review per `18_FINAL_INDEPENDENT_REVIEW_PROMPT.md`, tag `v0.1.0`.

## Explicit stop points requiring Erwin's direct action (unchanged from CLAUDE.md)

Hostpoint DNS changes, Stripe live-mode credentials/activation, Treuhänder VAT
confirmation, any account login/secret handoff.
