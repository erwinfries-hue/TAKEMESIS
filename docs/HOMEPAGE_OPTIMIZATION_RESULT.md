# Homepage Optimization Result (2026-08-01)

Summarizes what shipped from the external homepage-optimization proposal and
the two decision docs it produced (`docs/HOMEPAGE_UX_UI_AUDIT.md`,
`docs/HOMEPAGE_LAYOUT_DECISION.md`), across three commits on
`claude/takemesis-mvp-app-f622xx`: the Phase 1 quick wins, the
`StickyMobileCta` bug fix found during their own verification, and a Phase 3
simplify pass. Phase 2 (full two-column hero rebuild) stays deferred per the
layout decision doc — screenshots below are of the shipped, incremental
version, not the deferred full rebuild.

## What shipped

1. **DOI lookup demoted from an equal-weight card to a secondary tab.**
   `QuestionModeSelector` (`src/components/question-mode-selector.tsx`)
   replaces the previous side-by-side `OwnQuestionForm`/`StudyLookupForm`
   cards with an ARIA tablist (`role="tablist"`/`role="tab"`), defaulting to
   "Eigene Frage stellen". This was the audit's main finding — two
   competing primary CTAs with no visual hierarchy.
2. **Visible character counter.** Appears once the question is over 80% of
   `MAX_QUESTION_LENGTH` (500), so the limit isn't a surprise only discovered
   by hitting it.
3. **Cmd/Ctrl+Enter submits.** Plain Enter stays a newline (the field is a
   multi-line `<textarea>`), per the audit's reasoning that the external
   proposal's "Enter submits" would break longer, multi-sentence questions.
4. **Trust strip under the hero CTA.** Three short badges restating
   already-true facts stated elsewhere on the page (source transparency,
   uncertainty disclosure, price/no-subscription) — no new claims.
5. **Sticky mobile CTA.** Appears once the visitor scrolls past the question
   section, hides again when they scroll back to it. Mobile-only
   (`sm:hidden`), confirmed absent on desktop.
6. **Simplify pass** (Phase 3): extracted a shared `QuestionFormCard`
   wrapper removing byte-for-byte duplicated form-highlight styling between
   the two forms, collapsed the tab-button JSX into an array + map.
7. **First React component tests in the repo.** Previously all 682 tests
   were logic-level (`.test.ts`); this added 12 `.test.tsx` tests
   (`@testing-library/react` + jsdom) covering tab switching, the character
   counter threshold, Cmd/Ctrl+Enter, and the sticky-CTA visibility logic —
   the last one is a regression test for the bug below.

## Bug found and fixed during this work: StickyMobileCta

The first implementation used `IntersectionObserver` to toggle visibility.
Verified via a local Playwright script that scrolled the page with a single
instant `window.scrollBy(0, 2000)`: the bar never appeared, even though the
target section was well above the viewport (`getBoundingClientRect().top`
around -630px).

Root cause: `IntersectionObserver`'s callback only fires on a
not-intersecting/intersecting **boundary crossing**. An instant scroll can
skip the target between sampled frames without the observer ever recording
it as intersecting — so the callback that would have flipped `visible` to
`true` never fires, and the bar stays hidden indefinitely. A real user's
scroll is gradual and would normally pass through an intersecting frame, but
a fast flick-scroll on a touch device can plausibly reproduce the same skip,
so this was a real risk, not just a test artifact.

Fixed by replacing the observer with a throttled (`requestAnimationFrame`)
`scroll`/`resize` listener that directly checks
`target.getBoundingClientRect().bottom < 0` — this reads the current
position on every scroll frame rather than depending on a transition being
observed, so it can't miss a fast scroll.

## Screenshots (local dev build, 2026-08-01)

Captured with a local headless Chromium via Playwright — this sandbox has no
network access to the live `tekmesis.com` production site, so these are from
`npm run dev`, not production. Erwin should visually spot-check the live
site separately.

- `docs/assets/homepage-2026-08-01/desktop-hero.png` — hero with trust strip
  under the CTA (1280×900).
- `docs/assets/homepage-2026-08-01/mobile-hero.png` — mobile hero (390×844,
  iPhone-sized viewport).
- `docs/assets/homepage-2026-08-01/mobile-doi-tab.png` — the DOI-lookup tab
  after switching, mobile viewport.
- `docs/assets/homepage-2026-08-01/mobile-sticky-cta.png` — sticky CTA
  visible after scrolling past the question section, mobile viewport.

## Verification

Each commit was verified with `npm run lint && npm run typecheck && npm run
test && npm run build` before pushing (all green — 682 unit tests as of the
Phase 3 commit, up from 670 before this round). The screenshots above were
additionally checked by hand against the intended behavior (tab default
state, tab switching, character counter appearing/not appearing, sticky CTA
show/hide, desktop `sm:hidden`).

## Deferred: Phase 2 (two-column hero rebuild)

Not attempted in this round. Per `docs/HOMEPAGE_LAYOUT_DECISION.md`, the full
two-column hero restructure (question input + a real product-preview column)
is the highest-risk, least incrementally-verifiable part of the external
proposal on a live, paying application, and this sandbox has no way to
visually confirm a change against the actual production site. Recommendation
unchanged: do this one together with Erwin live in the browser (propose →
deploy → screenshot-compare), the same pattern already used successfully for
today's hero reorder and mobile spacing changes — not blind, in one
autonomous round.

## A/B test readiness notes

The external proposal asked for A/B test prep. No A/B testing framework
exists in this codebase today (no variant assignment, no experiment
analysis) and building one is a separate concept decision, not something to
add silently inside a UI-polish round — flagging it here rather than
building it.

If/when Erwin wants to A/B test the deferred Phase 2 hero rebuild against
the current incremental version, here's what's already in place and what
would still be needed:

**Already available** (`src/lib/analytics/events.ts`,
`docs/11_ADMIN_ANALYTICS_EMAIL_AND_SUPPORT.md`):
- A funnel-event pipeline (`track()` → Supabase `analytics_events` table +
  PostHog) with a strict metadata allowlist (`sanitizeMetadata`) that
  already structurally prevents raw questions or free text from leaking
  into analytics — any new event added for A/B purposes must go through the
  same allowlist, not bypass it.
- `landing_viewed` already fires on page load, and `question_submitted`
  already fires on form submission — both existing events, not new.

**Would still be needed for a real A/B test**:
- A `variant` key added to `ALLOWED_METADATA_KEYS` (e.g. `"question_first"` |
  `"two_column_hero"`), attached to `landing_viewed` and
  `question_submitted` so conversion can be split by variant.
- A variant-assignment mechanism (e.g. a cookie set on first visit, sticky
  for the session) — none exists today; this is genuinely new
  infrastructure, not a config toggle.
- A decision on the primary metric (most likely: `question_submitted` /
  `landing_viewed` ratio — the "does the visitor start a search" rate,
  since that's the first real funnel step both hero variants would affect)
  and a minimum sample size / run duration before Erwin acts on the result,
  to avoid reading noise as a winner.
- Since TEKMESIS has no recurring traffic estimate published yet, a rough
  traffic figure from Erwin would be needed to say whether an A/B test is
  even statistically viable before the Phase 2 rebuild question comes up
  again.
