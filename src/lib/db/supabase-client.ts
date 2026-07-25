import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";

let cachedClient: SupabaseClient | null = null;

/**
 * Service-role client — server-only, bypasses RLS by design (docs/10:
 * "server-only service keys"; the app has no mandatory user accounts, so
 * there is no anon-key client-side path). Lazily created so importing this
 * module doesn't fail before SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are
 * provisioned; the error only surfaces when a repository actually tries to
 * use it, same pattern as the Phase 4 source adapters and the Stripe client.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }
  if (!serverEnv.SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }
  cachedClient = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
