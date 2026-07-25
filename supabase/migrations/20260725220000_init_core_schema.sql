-- TEKMESIS core schema — docs/10_TECHNICAL_ARCHITECTURE_AND_DATA_MODEL.md
--
-- Not run against a live Supabase project yet (no project provisioned in
-- this session — see docs/OPEN_RISKS.md). Written to the documented schema
-- and Postgres/Supabase conventions; validate with `supabase db push` (or
-- equivalent) against a real project before relying on it in production.
--
-- Security model: the app has no mandatory user accounts and talks to
-- Supabase exclusively through the server-only service-role key (never the
-- anon key from the browser — docs/10, "Security": "server-only service
-- keys"). Row Level Security is enabled on every table with no policies
-- defined, so the anon/authenticated roles get the default-deny behavior;
-- the service role bypasses RLS by design, which is the only client this
-- app is meant to use.

create extension if not exists pgcrypto;

create table price_versions (
  id text primary key,
  amount_minor integer not null check (amount_minor > 0),
  currency text not null,
  environment text not null check (environment in ('test', 'live')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  status text not null default 'draft' check (
    status in (
      'draft', 'preview_ready', 'checkout_started', 'paid', 'processing',
      'ready', 'failed', 'refund_pending', 'refunded', 'blocked', 'expired'
    )
  ),
  eligibility text check (
    eligibility in ('eligible', 'eligible_with_limitations', 'not_eligible', 'restricted_high_risk')
  ),
  domain_slug text,
  risk_level text,
  original_question text not null,
  interpreted_question text,
  locale text not null check (locale in ('de', 'en')),
  source_route text,
  search_stats jsonb,
  preview_payload jsonb,
  final_payload jsonb,
  report_version text,
  price_version text references price_versions (id),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  failure_code text
);

create index reports_token_hash_idx on reports (token_hash);
create index reports_status_idx on reports (status);

create table report_sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  source text not null,
  source_id text not null,
  doi text,
  title text,
  authors text[] not null default '{}',
  venue text,
  year integer,
  publication_type text,
  abstract text,
  is_open_access boolean,
  retraction_status text,
  subject_concepts text[] not null default '{}',
  source_url text,
  data_completeness text,
  included boolean not null default true,
  exclusion_reason text,
  rank_score double precision,
  created_at timestamptz not null default now()
);

create index report_sources_report_id_idx on report_sources (report_id);

create table search_runs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  query text not null,
  topic_slug text not null,
  search_date timestamptz not null,
  screening_version text not null,
  candidate_count integer not null,
  duplicates_removed integer not null,
  included_count integer not null,
  excluded_by_reason jsonb not null,
  per_source jsonb not null,
  created_at timestamptz not null default now()
);

create index search_runs_report_id_idx on search_runs (report_id);

create table screening_decisions (
  id uuid primary key default gen_random_uuid(),
  search_run_id uuid not null references search_runs (id) on delete cascade,
  source text not null,
  source_id text not null,
  decision text not null check (decision in ('included', 'excluded')),
  reason text,
  created_at timestamptz not null default now()
);

create index screening_decisions_search_run_id_idx on screening_decisions (search_run_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  amount_minor integer not null,
  currency text not null,
  price_version text not null references price_versions (id),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'failed', 'refund_pending', 'refunded')
  ),
  mode text not null check (mode in ('test', 'live')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_stripe_checkout_session_id_idx on payments (stripe_checkout_session_id);
create index payments_report_id_idx on payments (report_id);

-- Primary key is the Stripe event ID itself — the idempotency check is a
-- plain insert-or-detect-conflict, per 09_MONETIZATION..md's "verified
-- webhook / idempotent processing" requirement.
create table stripe_webhook_events (
  id text primary key,
  type text not null,
  report_id uuid references reports (id),
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table report_jobs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports (id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index report_jobs_report_id_idx on report_jobs (report_id);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports (id) on delete set null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table issue_reports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports (id) on delete set null,
  category text,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- No raw questions here, per docs/11 ("Do not put raw personal questions
-- into analytics") — event_name + optional non-identifying metadata only.
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  report_id uuid references reports (id) on delete set null,
  anonymized_session_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_event_name_idx on analytics_events (event_name);

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table source_health_checks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  ok boolean not null,
  error text,
  checked_at timestamptz not null default now()
);

create index source_health_checks_source_idx on source_health_checks (source);

-- decision #9 seed: CHF 9.90, test mode until Stripe live is activated.
insert into price_versions (id, amount_minor, currency, environment, active)
values ('MVP-01', 990, 'CHF', 'test', true);

alter table price_versions enable row level security;
alter table reports enable row level security;
alter table report_sources enable row level security;
alter table search_runs enable row level security;
alter table screening_decisions enable row level security;
alter table payments enable row level security;
alter table stripe_webhook_events enable row level security;
alter table report_jobs enable row level security;
alter table feedback enable row level security;
alter table issue_reports enable row level security;
alter table analytics_events enable row level security;
alter table admin_audit_log enable row level security;
alter table source_health_checks enable row level security;
