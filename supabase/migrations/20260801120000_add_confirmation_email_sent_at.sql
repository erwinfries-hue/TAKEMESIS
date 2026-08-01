-- Confirmation-email delivery tracking (2026-08-01).
-- Not run against a live Supabase project yet — same caveat as the other
-- migrations in this directory (see 20260725220000_init_core_schema.sql's
-- header).
--
-- docs/OPEN_RISKS.md #30: the "report ready" confirmation email is the last
-- step of a webhook-triggered chain (live search + AI synthesis) that can
-- run close to or past the webhook route's maxDuration (60s) under real
-- network latency. When the serverless function is killed mid-flight, the
-- report itself is already correctly persisted as "ready" (that write
-- happens before the email send), but the customer never gets notified.
-- This column lets a scheduled sweep (src/lib/reports/resend-confirmation-
-- emails.ts) find exactly those reports — status "ready" with no confirmed
-- send — without guessing from status/timestamps alone, and without ever
-- double-sending to a report that already succeeded.

alter table reports add column confirmation_email_sent_at timestamptz;
