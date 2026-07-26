import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env/server";

let cachedClient: Resend | null = null;

/**
 * Lazily constructed — same pattern as the Stripe/Supabase clients, so
 * importing this module never fails before EMAIL_API_KEY is provisioned
 * (decision #13: Resend).
 */
export function getEmailClient(): Resend {
  if (cachedClient) {
    return cachedClient;
  }
  if (!serverEnv.EMAIL_API_KEY) {
    throw new Error("Email is not configured: EMAIL_API_KEY must be set.");
  }
  cachedClient = new Resend(serverEnv.EMAIL_API_KEY);
  return cachedClient;
}
