import "server-only";
import { SourceAdapterError, type SourceId } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
// Live bug found 2026-07-29 (OPEN_RISKS.md #27): a plain 300ms/600ms backoff
// treats a real rate limit (HTTP 429) exactly like a transient network blip
// — nowhere near enough to survive an actual rate-limit window, which is
// why one tripped limit kept failing every subsequent request in a batch of
// searches. 429s now get a longer base delay and honor the server's own
// `Retry-After` hint when present, capped so a single slow source can't
// blow the caller's own function-duration budget (e.g. /admin/report-preview
// and the Stripe webhook route's `maxDuration = 60`).
const RATE_LIMIT_BASE_DELAY_MS = 1000;
const MAX_BACKOFF_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parses `Retry-After` as either delta-seconds or an HTTP-date, per RFC 9110 §10.2.3. Returns null if absent or unparseable. */
function parseRetryAfterMs(response: Response): number | null {
  const header = response.headers?.get?.("retry-after");
  if (!header) {
    return null;
  }
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return null;
}

export interface FetchOptions {
  source: SourceId;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  /** Injectable for tests (fixtures) — defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export type FetchJsonOptions = FetchOptions;

/**
 * Shared bounded-timeout, bounded-retry-with-backoff GET, with response
 * validation (non-2xx → SourceAdapterError). Adapters must degrade safely
 * when a source is unavailable (10_TECHNICAL_ARCHITECTURE...md,
 * "Resilience") — this is the one place that behavior is enforced.
 * `fetchJson`/`fetchText` below just pick how to read the body — JSON for
 * every adapter except arXiv, which returns Atom XML.
 */
async function fetchWithRetry(url: string, options: FetchOptions): Promise<Response> {
  const {
    source,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    fetchImpl = fetch,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retryAfterMs: number | null = null;
    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal });
      if (!response.ok) {
        if (response.status === 429) {
          retryAfterMs = parseRetryAfterMs(response);
        }
        throw new SourceAdapterError(
          `${source} responded with HTTP ${response.status}`,
          source,
          undefined,
          response.status,
        );
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const status = error instanceof SourceAdapterError ? error.status : undefined;
        const delay =
          status === 429
            ? (retryAfterMs ?? RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt)
            : 2 ** attempt * 300;
        await sleep(Math.min(delay, MAX_BACKOFF_MS));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new SourceAdapterError(
    `${source} request failed after ${maxRetries + 1} attempt(s)`,
    source,
    lastError,
    lastError instanceof SourceAdapterError ? lastError.status : undefined,
  );
}

export async function fetchJson(url: string, options: FetchJsonOptions): Promise<unknown> {
  const response = await fetchWithRetry(url, options);
  return response.json();
}

export async function fetchText(url: string, options: FetchOptions): Promise<string> {
  const response = await fetchWithRetry(url, options);
  return response.text();
}
