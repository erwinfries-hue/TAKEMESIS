# Production Runbook

Operationalizes `00_START_HERE_ERWIN.md` §7–12 and `IMPLEMENTATION_PLAN.md`
Phases 11–13 into an executable checklist, using this repo's actual env var
names (`.env.example`). Every step that touches a live account, DNS, or
money is an explicit `CLAUDE.md` human-stop-condition — **do not run these
from an agent session; Erwin (or someone he delegates) runs them by hand**,
then reports back so the next session can verify and continue.

## 0. Prerequisites (accounts)

- [ ] GitHub — already in place (`erwinfries-hue/takemesis`)
- [ ] Vercel account, linked to the GitHub repo
- [ ] Stripe account (test mode first, per decision context)
- [ ] Supabase project
- [ ] Transactional email provider account (Resend, per decision #10) or a
      vetted Hostpoint mail solution
- [ ] Anthropic API key (only needed once AI extraction/synthesis is built —
      not required to deploy the current MVP)
- [ ] Optional: Sentry, a privacy-friendly analytics provider (PostHog EU
      Cloud is already the coded default)

## 1. Vercel preview (Phase 11)

1. Import the repo into Vercel (framework preset: Next.js — auto-detected).
2. Set preview-environment variables (Vercel dashboard → Settings →
   Environment Variables → Preview). At minimum, to exercise real behavior
   rather than the documented no-credential fallbacks:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
     `STRIPE_PRICE_ID_MVP_01` (test-mode keys only — `STRIPE_MODE=test`)
   - `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, `EMAIL_FROM`
   - `ADMIN_EMAILS`, `ADMIN_AUTH_SECRET` (generate a strong random secret,
     e.g. `openssl rand -hex 32` — do not reuse the e2e test-only value from
     `playwright.config.ts`)
   - `RATE_LIMIT_SECRET` (same generation approach) — required for the
     Phase 10 rate limiter to actually enforce anything (it fails open when
     unset, by design)
   - `CRON_SECRET` (same generation approach) — required before the
     `vercel.json` daily expiry cron can authenticate; Vercel Cron sends it
     automatically as `Authorization: Bearer <CRON_SECRET>` once set
   - `LOG_REDACTION_SALT` (generate)
   - Leave `ANTHROPIC_API_KEY`/`AI_EXTRACTION_ENABLED` unset until that
     feature is actually built — the app runs correctly without it
     (AI-dependent report fields stay `null`, per `CLAUDE.md`'s evidence rules)
3. Run the Supabase migrations against the real project, in order:
   - `supabase/migrations/20260725220000_init_core_schema.sql`
   - `supabase/migrations/20260726000000_add_rate_limit_counters.sql`
4. In Stripe (test mode), create the CHF 9.90 one-time Price and set
   `STRIPE_PRICE_ID_MVP_01`; without it the app falls back to inline
   `price_data` from `src/lib/pricing/price-config.ts`, which works but
   won't show up as a named Product in the Stripe dashboard.
5. Add the Stripe webhook endpoint pointing at
   `https://<preview-url>/api/stripe/webhook`, subscribed at minimum to
   `checkout.session.completed`; copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.
6. Deploy the preview and run through `00_START_HERE_ERWIN.md` §10's list
   end to end, plus `19_MANUAL_FOUNDER_CHECKLIST.md`'s "Preview" and
   "Evidenz" sections (those are founder judgment calls — not something an
   agent session should fill in).
7. Run the Stripe test-mode cases from `00_START_HERE_ERWIN.md` §9
   (success, cancel, bad signature, duplicate webhook, refund) against the
   live preview — these were only unit-tested against a fake Stripe client
   until now (`OPEN_RISKS.md` #13).
8. Manually trigger `GET https://<preview-url>/api/cron/expire-reports`
   with `Authorization: Bearer <CRON_SECRET>` once and confirm a `200` with
   `{ checked, expiredCount }` — proves the route works against the real
   Supabase project before relying on the schedule.
9. Re-run the independent review (`docs/INDEPENDENT_REVIEW.md`) — items 2,
   16, 17, 22, 23, 25 can now be exercised live instead of assessed from
   static code; update that file's verdict.

## 2. Production preparation (Phase 12)

1. **Treuhänder VAT sign-off** (`OPEN_RISKS.md` #1) — must land before
   Stripe live mode or any real DE/AT payment. Blocks the rest of this
   section until resolved.
2. **DNS at Hostpoint** — in Vercel, add `tekmesis.com` as a production
   domain; Vercel will show the exact A/CNAME records to set. Set only
   those website records at Hostpoint; **do not touch existing MX/mail
   records** (`00_START_HERE_ERWIN.md` §1/§11 — `info@`, `support@`,
   `privacy@tekmesis.com` must keep working). Confirm SSL issuance in Vercel
   after DNS propagates.
3. **Stripe live activation** — switch the Stripe account out of test mode,
   create the live-mode CHF 9.90 Price, set live keys
   (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MVP_01`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) in Vercel's **Production**
   environment (not Preview), set `STRIPE_MODE=live`. Add a second webhook
   endpoint for the production URL.
4. **AXIA4 handover** — the exact copy to publish at `axia4.ch/digital` is
   already finalized in `docs/17_AXIA4_DIGITAL_PAGE_HANDOVER.md`; hand that
   file (or its content) to whoever manages the AXIA4 site. No code in this
   repo is involved — that page lives on a different domain/site entirely.
5. **Rollback plan:**
   - Vercel keeps every deployment; if production breaks after a deploy,
     use Vercel's dashboard ("Instant Rollback") to revert to the previous
     deployment — this is immediate and doesn't require a new build.
   - If a bad deploy already processed a Stripe webhook incorrectly (e.g.
     marked a report `paid` in error), fix the data directly via `/admin`
     (the "block"/"mark refund pending" actions exist precisely for this) —
     do not manually edit the database outside the app's state machine, or
     `assertTransition`'s invariants can be silently violated.
   - If a Supabase migration needs to be reverted, write a new forward
     migration that undoes it — this repo's migrations are additive/append-
     only by convention; never edit or delete an already-applied migration
     file.
   - Keep `CRON_SECRET` easy to rotate (Vercel env var) in case it leaks —
     the cron route immediately 401s once rotated, with zero code changes.

## 3. Production launch (Phase 13)

1. Confirm `tekmesis.com` resolves with valid SSL.
2. Run `docs/SMOKE_TESTS.md` against the live production URL.
3. Process one real, small live payment end to end (checkout → webhook →
   `paid` status in `/admin` → confirmation email received) — Erwin's own
   card, refund it afterward via the admin "mark refunded" flow to confirm
   that path too.
4. Re-run `docs/INDEPENDENT_REVIEW.md` one final time against production;
   only tag a release once its verdict is GO.
5. Tag the release (e.g. `git tag v0.1.0 && git push origin v0.1.0`) —
   **only after** the independent review is GO, not before; this session
   will not create that tag preemptively.
