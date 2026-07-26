import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env/server";

let cachedClient: Anthropic | null = null;

/**
 * Lazily constructed — same pattern as the Stripe/Resend/Supabase clients,
 * so importing this module never fails before ANTHROPIC_API_KEY is
 * provisioned. The error only surfaces when AI extraction/synthesis is
 * actually attempted.
 */
export function getAnthropicClient(): Anthropic {
  if (cachedClient) {
    return cachedClient;
  }
  if (!serverEnv.ANTHROPIC_API_KEY) {
    throw new Error("AI extraction is not configured: ANTHROPIC_API_KEY must be set.");
  }
  cachedClient = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
  return cachedClient;
}
