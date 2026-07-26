-- Free-search rate limiting (decision #7: 5/day/IP-session). Not run against
-- a live project yet — see supabase/migrations/20260725220000_init_core_schema.sql's
-- header note and docs/OPEN_RISKS.md.
--
-- Fixed-window counter: `key` is an HMAC-hashed identifier (never a raw IP —
-- see src/lib/security/rate-limit-key.ts), scoped to a UTC calendar day by
-- the caller including the date in the key itself.

create table rate_limit_counters (
  key text primary key,
  window_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table rate_limit_counters enable row level security;
