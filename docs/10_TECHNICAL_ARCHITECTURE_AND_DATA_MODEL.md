# Technical Architecture and Data Model

## Hosting

- `tekmesis.com`: Vercel
- domain/DNS/email: Hostpoint
- source: GitHub
- data: Supabase
- payments: Stripe
- AI: server-side provider API
- transactional email: approved provider

No basePath.
No AXIA4 reverse proxy.

## Suggested modules

```text
src/
  app/
  components/
  features/
    topics/
    questions/
    search/
    sources/
    screening/
    eligibility/
    preview/
    reports/
    payments/
    feedback/
    admin/
  lib/
    source-adapters/
    query/
    ranking/
    evidence/
    ai/
    stripe/
    email/
    analytics/
    security/
    i18n/
  content/
    topics/
    demos/
tests/
docs/
```

## Core tables

- reports
- report_sources
- search_runs
- screening_decisions
- payments
- stripe_webhook_events
- report_jobs
- feedback
- issue_reports
- analytics_events
- price_versions
- admin_audit_log
- source_health_checks

## Report fields

- internal UUID
- public token hash
- status
- eligibility
- domain
- risk level
- original question
- interpreted question
- locale
- source route
- search statistics
- preview payload
- final payload
- report version
- price version
- Stripe references
- email
- timestamps
- expiry/revocation
- failure code

## Resilience

App must degrade safely when:
- AI unavailable
- one source unavailable
- abstract missing
- email fails
- analytics disabled
- Supabase temporarily unavailable
- Stripe webhook duplicated

## Security

- environment validation
- RLS
- server-only service keys
- hashed report tokens
- rate limiting
- input-size limits
- safe external links
- admin auth
- audit log
- redacted logs
- security headers
- dependency audit
