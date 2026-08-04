import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env/server";

/**
 * Signs a subscription's own `id` with TOPIC_DIGEST_SECRET, HMAC-SHA256.
 * Deliberately not a stored, randomly generated token like report tokens
 * (reports/token.ts): a subscription's unsubscribe link needs to keep
 * working every time it's rendered (confirmation email, every weekly
 * digest), and there's no side channel to recover a once-issued raw secret
 * later the way reports/resend-confirmation-emails.ts reads its token back
 * from Stripe. Re-deriving the signature on demand from the row's own id
 * avoids storing anything that would itself grant access if the database
 * leaked — the id alone is not enough without TOPIC_DIGEST_SECRET.
 */
export function signSubscriptionId(id: string): string | null {
  if (!serverEnv.TOPIC_DIGEST_SECRET) {
    return null;
  }
  return createHmac("sha256", serverEnv.TOPIC_DIGEST_SECRET).update(id).digest("hex");
}

export function verifySubscriptionSignature(id: string, signature: string): boolean {
  const expected = signSubscriptionId(id);
  if (!expected) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

/** Null when TOPIC_DIGEST_SECRET isn't configured — callers must treat that as "cannot send yet", not send a mail with a broken unsubscribe link. */
export function buildUnsubscribeUrl(appBaseUrl: string, id: string): string | null {
  const signature = signSubscriptionId(id);
  if (!signature) {
    return null;
  }
  return `${appBaseUrl}/api/topics/unsubscribe?id=${encodeURIComponent(id)}&sig=${signature}`;
}
