-- Evidenz-Update-Check tracking (2026-08-03, decision #7).
-- Not run against a live Supabase project yet — same caveat as the other
-- migrations in this directory (see 20260725220000_init_core_schema.sql's
-- header).
--
-- docs/OPEN_RISKS.md #25/#7: a one-time, user-triggered "check again for new
-- studies" action (not a recurring subscription — CLAUDE.md: "No
-- subscription in MVP"). This column rate-limits re-triggering per report
-- (update-check.ts's MIN_UPDATE_CHECK_INTERVAL_HOURS) and gives admin
-- visibility into whether/when a report's evidence was last re-checked.

alter table reports add column last_update_check_at timestamptz;
