# Final Concept Decisions

Consolidated from `DECISIONS_LOG.md`. All mandatory open decisions from
`02_CONCEPT_REVIEW_PROTOCOL.md` are resolved. This document is the binding
reference for implementation; the base package documents (`01`–`20`) remain
binding wherever this document does not override or refine them.

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Beta topic scope | All 12 categories active/sellable from beta start |
| 2 | High-risk sub-topics | Hard-blocked to `restricted_high_risk` regardless of parent category |
| 3 | Public example-report topic | "Welche Lernmethode verbessert den Lernerfolg?" (Active Recall / Spaced Repetition vs. Rereading) |
| 4 | Eligibility thresholds | `eligible` ≥5 comparable result-bearing studies OR 1 review+2 studies; `eligible_with_limitations` 2–4 studies or metadata-heavy; `not_eligible` <2 studies; min. 3/9 report sections must have real content |
| 5 | Paid-report retention | 12 months, auto-expiry; user can request earlier deletion anytime |
| 6 | Link sharing | Allowed with visible warning; buyer can self-revoke |
| 7 | Free-search limit | 5 per IP/session per day |
| 8 | Max included studies | 15 in detailed comparison/profiles; full candidate list in source appendix |
| 9 | Price confirmation | CHF 9.90 confirmed; est. variable cost CHF 1.00–1.50/report (~85–90% margin) |
| 10 | Support | `support@tekmesis.com`, 3–5 business days response target |
| 11 | Legal seller | **Resolved 2026-07-28 (Treuhänder).** Erwin Fries as a private individual ("Inhaber: Erwin Fries, 6332 Cham, Schweiz" — AXIA4 is an umbrella brand, not the legal seller entity). Swiss MWST: confirmed not required (under CHF 100'000 turnover). No Handelsregister-/UID number required on invoices. |
| 12 | Tax wording | **Resolved 2026-07-28 (Treuhänder).** "CHF 9.90, Einmalzahlung. Preis ohne Mehrwertsteuer." plus two always-shown clauses: Schweiz — nicht MWST-pflichtig; Ausland — Reverse-Charge gemäss Art. 8 MWSTG. No geo-detection; both clauses always shown since the buyer's country isn't known yet at price-display time. |
| 16 | EU cross-border digital-services VAT | **Resolved 2026-07-28 (Treuhänder).** No OSS registration at launch — explicit Treuhänder judgment call. Mitigation: **Stripe Tax must be activated from day one** (confirmed sufficient by the Treuhänder), even during the Switzerland-only beta, so nothing needs to change later at EU rollout. |
| 17 | EU withdrawal-right (Widerrufsrecht) waiver | **Resolved 2026-07-28 (Treuhänder).** Not a blocker for EU sales, but the eventual real checkout must include a mandatory checkbox where the buyer confirms they waive the 14-day withdrawal right because delivery is immediate. Not yet built — the real "buy" button/checkout flow itself doesn't exist yet (tracked in `OPEN_RISKS.md`); add this checkbox when that's built. |
| 13 | Email provider | Resend, domain-verified on `tekmesis.com` |
| 14 | Analytics provider | PostHog, EU Cloud region; event name + anonymized ID only, no raw questions/PII |
| 15 | Beta size / milestone / thresholds | 15 people, ≥4 categories; checkpoint at 4 weeks or 10 active users; continue ≥40% eligible + ≥15% conversion; optimize 20–40%/5–15%; pause <20% eligible or repeated evidence errors; stop on safety/legal incident |

## Full detail

See `DECISIONS_LOG.md` for the complete reasoning, date, and follow-on
implications behind each decision.

## Still outside this session's authority (human stop conditions, unchanged)

- ~~EU cross-border VAT/OSS determination~~ — **resolved 2026-07-28**, see #16/#17
  above. DNS changes at Hostpoint are done. What's left for live Stripe mode:
  activating **Stripe Tax** in the Stripe dashboard itself (an account action,
  not code) and provisioning live Stripe credentials.
- Stripe live-mode activation — requires actual account access (test-mode
  credentials only so far).
- EU withdrawal-right waiver checkbox at checkout — not built yet, since the
  real "buy" button/checkout flow itself doesn't exist yet (tracked in
  `OPEN_RISKS.md`).
- Final legal/privacy page text sign-off, if AXIA4 wants a lawyer review beyond
  this document — the Treuhänder confirmed the current `/legal` content is
  otherwise sufficient for an EU sales start (2026-07-28).
