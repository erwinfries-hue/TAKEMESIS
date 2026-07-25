# Concept Decisions Log (running)

Working log of concept-review decisions as they are made, one question at a time,
per `02_CONCEPT_REVIEW_PROTOCOL.md`. This will be consolidated into
`FINAL_CONCEPT_DECISIONS.md`, `FINAL_MVP_SCOPE.md`, `SOURCE_COVERAGE_MATRIX.md`,
`IMPLEMENTATION_PLAN.md`, `OPEN_RISKS.md`, and `STATUS.md` once all mandatory
open decisions are resolved.

## 1. Beta topic scope

**Decision:** All 12 topic categories from `04_TARGET_AUDIENCE_AND_TOPIC_TAXONOMY.md`
are active and sellable from beta start (not narrowed to a 6-category subset).

**Date:** 2026-07-25

**Follow-on implications:**
- Domain/risk classification and source routing must be built for all 12 domains
  at beta launch, not phased in.
- The high-risk handling question (cancer, pregnancy, prescription drugs, vaccines,
  mental-health crisis, acute symptoms, dosing, pediatric treatment — `08`) remains
  open as a separate decision: whether these specific sub-topics are excluded or
  handled via the `restricted_high_risk` status even though their parent category
  (e.g. Gesundheit & Prävention, Kinder/Erziehung) is active.

## 2. High-risk sub-topic handling

**Decision:** High-risk sub-topics (cancer, pregnancy, prescription drugs, vaccines,
acute mental-health crisis, acute symptoms, dosing, pediatric treatment) are hard-blocked
via risk classification to `restricted_high_risk` status, regardless of their parent
category being active. No individualized synthesis is produced for these; only general
orientation plus a pointer to qualified professional help, per `05_UX_USER_FLOWS_AND_PAGES.md`.

**Date:** 2026-07-25

**Follow-on implications:**
- Risk classifier needs an explicit high-risk keyword/topic detector independent of
  domain classification, evaluated for every question regardless of chosen category.
- `restricted_high_risk` must be unconditionally non-payable (already required by
  acceptance criteria in `14`).

## 3. Public example-report topic

**Decision:** The curated public example report (landing page + `/example-report`)
answers: "Welche Lernmethode verbessert den Lernerfolg – Active Recall und Spaced
Repetition im Vergleich zu Wiederlesen?" — matching the topic already used in the
supplied visual references (onepager, premium-report reference images).

**Date:** 2026-07-25

**Follow-on implications:**
- Actual studies must be sourced live via the real adapters (OpenAlex/Crossref/
  Europe PMC etc.) and verified — the study names/numbers shown in the reference
  images are illustrative only and must not be copied as fact (per `20`).
- This example report becomes the first end-to-end validation case for the full
  pipeline (search → screening → synthesis → confidence → render) and should be
  built and manually verified early, not left to the end.

## 4. Eligibility thresholds and minimum report depth

**Decision:**
- `eligible`: at least 5 comparable, relevant studies with an available result
  (abstract or full text), OR at least 1 systematic review/meta-analysis plus at
  least 2 individual studies for context.
- `eligible_with_limitations`: 2–4 comparable studies, or enough studies but mostly
  metadata/abstract-only without a clear result — report is sold, but with a
  prominent limitations notice shown before checkout.
- `not_eligible`: fewer than 2 comparable, result-bearing studies.
- Minimum depth gate: the report must be able to fill at least 3 of the 9 mandatory
  sections from `06_PREMIUM_REPORT_SPECIFICATION.md` with real (non-"not reported")
  content, regardless of study count, or it is `not_eligible`.

**Date:** 2026-07-25

**Follow-on implications:**
- Eligibility engine implements these as configurable constants (not hard-coded
  magic numbers) so they can be tuned post-beta based on real conversion/refund data.
- Paywall copy must reflect which threshold tier applies (full vs. limitations notice).

## 5. Paid-report retention period

**Decision:** Paid reports remain accessible via the secure link for 12 months after
creation, then are automatically deleted/revoked. Users may request earlier deletion
at any time via the support/deletion workflow, independent of this default.

**Date:** 2026-07-25

**Follow-on implications:**
- Report email includes a notice of the 12-month retention window.
- `/privacy` page states this retention period explicitly.
- Scheduled job/cron needed to expire and purge reports past 12 months (report_jobs /
  admin visibility per `10_TECHNICAL_ARCHITECTURE_AND_DATA_MODEL.md`).

## 6. Secure link sharing policy

**Decision:** Sharing the report link is explicitly permitted (no technical
restriction). A clear, visible warning is shown on the report itself: "Jede Person
mit diesem Link kann den Report ansehen. Teilen Sie den Link nur mit Personen, denen
Sie vertrauen." The buyer can self-revoke the link at any time via a "Link
deaktivieren" control on the report page, without needing to contact support.

**Date:** 2026-07-25

**Follow-on implications:**
- Report page needs a self-service revoke action (distinct from admin revoke),
  writing to the same report status field admin revocation uses.
- Warning copy must appear both in the report UI and in the delivery email.
