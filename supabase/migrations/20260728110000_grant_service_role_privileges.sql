-- Fixes "permission denied for table X" errors on every table.
--
-- Root cause: when the Supabase project was created, "Automatically expose
-- new tables" was deliberately unchecked, on the (incorrect) assumption that
-- service_role's RLS bypass alone was enough. RLS bypass and plain Postgres
-- table GRANTs are two separate privilege layers — disabling that project
-- setting means Supabase's own bootstrapping never grants any Data API role
-- (including service_role) baseline privileges on newly created tables, and
-- none of this repo's migrations ever issued an explicit GRANT. Result: every
-- table has RLS enabled with no policies AND no grants at all, so even the
-- service-role client (the only client this app ever uses — see
-- 20260725220000_init_core_schema.sql's header) is rejected outright before
-- RLS is even evaluated.
--
-- Scoped to service_role only, matching the app's actual security model:
-- anon/authenticated are meant to have zero access (no mandatory user
-- accounts, server-only service key — docs/10 "Security"), so they
-- deliberately get no grants here either.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- So every future migration's new tables/sequences get the same privileges
-- automatically, without needing to remember this step again.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
