import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env/server";

/**
 * Minimal admin auth (decision context / OPEN_RISKS.md #8: email allowlist +
 * shared secret — acceptable for a single-operator closed beta, revisit
 * before public MVP). No session storage needed: the cookie is
 * self-verifying (email + HMAC signature keyed on ADMIN_AUTH_SECRET), so a
 * forged or tampered cookie value fails verification without a database
 * lookup.
 */
export const ADMIN_SESSION_COOKIE = "tekmesis_admin_session";

// Not valid in an unquoted email address, so splitting on it is unambiguous.
const SESSION_SEPARATOR = "|";

function parseAdminEmails(): string[] {
  return (serverEnv.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  return parseAdminEmails().includes(email.trim().toLowerCase());
}

function signEmail(email: string): string {
  if (!serverEnv.ADMIN_AUTH_SECRET) {
    throw new Error("Admin auth is not configured: ADMIN_AUTH_SECRET must be set.");
  }
  return createHmac("sha256", serverEnv.ADMIN_AUTH_SECRET).update(email.toLowerCase()).digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/** Verifies the shared secret entered on the login form — NOT the session cookie. */
export function verifyAdminCredentials(email: string, secret: string): boolean {
  if (!serverEnv.ADMIN_AUTH_SECRET || !isAllowedAdminEmail(email)) {
    return false;
  }
  return timingSafeStringEqual(secret, serverEnv.ADMIN_AUTH_SECRET);
}

export function createAdminSessionValue(email: string): string {
  const normalized = email.trim().toLowerCase();
  return `${normalized}${SESSION_SEPARATOR}${signEmail(normalized)}`;
}

/** Returns the verified admin email, or null if the cookie is missing, malformed, forged, or the email is no longer allowlisted. */
export function verifyAdminSessionValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const separatorIndex = value.indexOf(SESSION_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }
  const email = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  if (!isAllowedAdminEmail(email)) {
    return null;
  }
  let expectedSignature: string;
  try {
    expectedSignature = signEmail(email);
  } catch {
    return null;
  }
  return timingSafeStringEqual(signature, expectedSignature) ? email : null;
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifyAdminSessionValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
