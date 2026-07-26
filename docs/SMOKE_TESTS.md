# Smoke Tests

Two layers, run in this order after any deploy (preview or production):

## 1. Automated (`scripts/smoke-test.sh`)

Read-only HTTP checks — never starts a checkout, never logs into admin,
never mutates data. Safe to run against production at any time.

```bash
bash scripts/smoke-test.sh https://tekmesis.com
# or against a Vercel preview:
bash scripts/smoke-test.sh https://your-preview.vercel.app
```

Checks: all main content pages return 200 (home, topics, methodology,
sources, privacy, legal, about, example-report, checkout success/cancel,
search-with-no-question), `/admin` redirects unauthenticated requests (307),
`/api/cron/expire-reports` rejects an unauthorized request (401), and the
Phase 10 security headers (CSP, X-Frame-Options, X-Content-Type-Options,
HSTS) are present. **Live-verified in this session** against a real
`npm run build && npm run start` — all 17 checks passed.

Exit code is non-zero if anything fails, so it's safe to wire into a
post-deploy CI step later if desired (not currently wired — this repo's
`.github/workflows/ci.yml` runs lint/typecheck/tests/build/e2e, not
against a deployed URL).

## 2. Manual (needs a human, and for some items, real credentials)

These cannot be scripted safely (they involve real payment, real email
delivery, or subjective judgment) — from `00_START_HERE_ERWIN.md` §9/§10
and `19_MANUAL_FOUNDER_CHECKLIST.md`'s "Go-live" section:

- [ ] Own-question flow: enter a real question, confirm domain, reach a
      teaser (or the correct not-eligible/high-risk state)
- [ ] Stripe checkout: complete a real (or test-mode) payment
- [ ] Webhook fires and the report reaches `paid` in `/admin`
- [ ] Confirmation email arrives and renders correctly
- [ ] Refund: mark refunded via `/admin`, confirm the refund-confirmation
      email arrives
- [ ] Mobile viewport: repeat the above on a real phone, not just devtools
- [ ] DE and EN: repeat the core flow in both locales
- [ ] A sensitive/high-risk question is correctly blocked, not sold
- [ ] SSL certificate valid on the real domain (browser padlock, no
      mixed-content warnings)
- [ ] Hostpoint mail (`info@`/`support@`/`privacy@tekmesis.com`) still
      works after the DNS change — this is the one step most likely to
      break silently if done wrong

Run `docs/INDEPENDENT_REVIEW.md`'s full 25-item check again once these pass,
and only then consider the deployment production-ready.
