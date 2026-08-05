import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone=(self): live bug found 2026-08-05 — the voice-input feature
  // (voice-input-button.tsx, task #113) calls the Web Speech API, which
  // requires microphone access; `microphone=()` blocked it for every
  // origin including the page's own, so real browsers refused it outright
  // (no permission prompt, button visibly unresponsive) — silently missed
  // until now because all automated tests (unit + e2e) injected a fake
  // SpeechRecognition constructor that bypasses real browser permission
  // checks entirely. `(self)` keeps the original intent (no third-party
  // iframe gets microphone access) while allowing the page itself to ask.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
