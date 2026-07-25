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
