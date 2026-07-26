import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Per-request CSP nonce, following Next.js's documented pattern
 * (https://nextjs.org/docs/app/guides/content-security-policy): Next
 * automatically detects the `'nonce-<value>'` token in the outgoing
 * Content-Security-Policy header and applies it to the scripts it renders
 * itself, so no further plumbing is needed in the root layout.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization files — CSP only needs to
    // apply to documents/HTML responses.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
