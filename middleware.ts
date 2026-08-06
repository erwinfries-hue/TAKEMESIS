import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookieName, localeHeaderName } from "@/lib/i18n/config";

/**
 * Legacy bare marketing paths from before path-based i18n existed — these
 * were the only URLs Google (or anyone) could ever have indexed/bookmarked,
 * always serving German (the cookie-default). Permanently (301) redirected
 * to their /de equivalent so any existing search ranking or backlinks carry
 * over instead of 404ing. Deliberately not a catch-all: only these exact,
 * previously-real routes get this treatment.
 */
const LEGACY_MARKETING_PATHS = new Set([
  "/topics",
  "/methodology",
  "/sources",
  "/example-report",
  "/about",
  "/privacy",
  "/legal",
]);

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function preferredLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  return cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  // Bare root -> redirect to the visitor's known/preferred locale. Not
  // permanent (307): unlike the legacy paths below, which always meant
  // exactly one thing (German), "/" itself doesn't — the right destination
  // depends on the visitor, so it must stay re-evaluated every time.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}`;
    return NextResponse.redirect(url, 307);
  }

  if (LEGACY_MARKETING_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/de${pathname}`;
    return NextResponse.redirect(url, 301);
  }

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
  requestHeaders.set("Content-Security-Policy", csp);

  // /de|/en|/fr is the authoritative locale for anything under
  // src/app/[locale] — forwarded as a header for getLocale() to read
  // (lib/i18n/locale.ts). The cookie is refreshed to match on every such
  // request too, so pages deliberately left outside [locale] (search,
  // checkout, report/[token], admin — see the routing plan) still resolve
  // to the visitor's last explicit locale instead of silently drifting back
  // to German.
  const isLocalePrefixed = isLocale(firstSegment);
  if (isLocalePrefixed) {
    requestHeaders.set(localeHeaderName, firstSegment);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  if (isLocalePrefixed) {
    response.cookies.set(localeCookieName, firstSegment, {
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization files — CSP only needs to
    // apply to documents/HTML responses.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
