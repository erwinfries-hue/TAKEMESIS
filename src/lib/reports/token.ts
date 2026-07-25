import "server-only";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32; // 256 bits of entropy

export interface ReportToken {
  /** Raw token — goes in the report URL, given to the user, never stored. */
  token: string;
  /** SHA-256 hex digest — what actually gets stored (docs/10: "secure hashed report tokens"). */
  tokenHash: string;
}

/**
 * A SHA-256 digest (no per-token salt) is appropriate here specifically
 * because the input is a full 256-bit random token, not a low-entropy
 * secret like a password — brute-forcing it means guessing the whole
 * token, not a small keyspace, so a slow/salted KDF isn't needed.
 */
export function hashReportToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateReportToken(): ReportToken {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashReportToken(token) };
}
