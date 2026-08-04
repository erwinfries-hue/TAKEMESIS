-- Themen-Digest E-Mail (decision #7, second half — see docs/OPEN_RISKS.md
-- item #25's 2026-08-04 update: the cron-job-count question that deferred
-- this is resolved). Not run against a live Supabase project yet — same
-- caveat as every other migration in this directory.
--
-- One row per subscribing email address; `topic_slugs` grows as the same
-- email subscribes to further topics (merged, not duplicated — see
-- topics/subscribe.ts). No password/token column: the unsubscribe link is
-- an HMAC signature of this row's `id`, recomputed on demand from
-- TOPIC_DIGEST_SECRET (topics/unsubscribe-token.ts) rather than a stored
-- secret, so there is nothing here that itself grants access if leaked.

create table topic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text not null,
  topic_slugs text[] not null default '{}',
  created_at timestamptz not null default now(),
  -- Null until the first successful digest send; also the lower bound of
  -- the "new studies since" window for the next send (run-digest.ts).
  last_sent_at timestamptz
);

create unique index topic_subscriptions_email_idx on topic_subscriptions (email);

alter table topic_subscriptions enable row level security;
