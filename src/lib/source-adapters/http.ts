import "server-only";
import { SourceAdapterError, type SourceId } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchJsonOptions {
  source: SourceId;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  /** Injectable for tests (fixtures) — defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Shared GET-JSON helper: bounded timeout, bounded retries with backoff, and
 * response validation (non-2xx → SourceAdapterError). Adapters must degrade
 * safely when a source is unavailable (10_TECHNICAL_ARCHITECTURE...md,
 * "Resilience") — this is the one place that behavior is enforced.
 */
export async function fetchJson(url: string, options: FetchJsonOptions): Promise<unknown> {
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
    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal });
      if (!response.ok) {
        throw new SourceAdapterError(
          `${source} responded with HTTP ${response.status}`,
          source,
        );
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(2 ** attempt * 300);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new SourceAdapterError(
    `${source} request failed after ${maxRetries + 1} attempt(s)`,
    source,
    lastError,
  );
}
