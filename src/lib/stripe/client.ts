import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env/server";

let cachedClient: Stripe | null = null;

/**
 * Lazily constructed so importing this module doesn't fail before
 * STRIPE_SECRET_KEY is provisioned — the error only surfaces when checkout/
 * webhook code actually tries to use it, same pattern as the Phase 4 source
 * adapters and the Supabase client.
 */
export function getStripeClient(): Stripe {
  if (cachedClient) {
    return cachedClient;
  }
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured: STRIPE_SECRET_KEY must be set.");
  }
  cachedClient = new Stripe(serverEnv.STRIPE_SECRET_KEY);
  return cachedClient;
}
