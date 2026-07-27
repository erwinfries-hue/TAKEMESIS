const STORAGE_KEY = "tekmesis_recent_questions_v1";
const MAX_ENTRIES = 8;
const EMPTY_HISTORY: LocalHistoryEntry[] = [];

export interface LocalHistoryEntry {
  question: string;
  href: string;
  askedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Purely client-side, device-local history — never sent to the server or
 * to analytics (CLAUDE.md: "no raw queries in analytics", "no mandatory
 * account"). Read/write failures (private browsing, storage quota, disabled
 * storage) are swallowed: this is a convenience feature, never something
 * that should break the page if unavailable.
 */
export function readLocalHistory(): LocalHistoryEntry[] {
  if (!isBrowser()) return EMPTY_HISTORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_HISTORY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_HISTORY;
    return parsed;
  } catch {
    return EMPTY_HISTORY;
  }
}

// --- useSyncExternalStore plumbing --------------------------------------
// A cached snapshot + a listener set, so `recent-searches-panel.tsx` can
// read this safely across server/client render via useSyncExternalStore
// instead of a setState-in-effect pattern: getSnapshot must return a
// stable reference when nothing changed (readLocalHistory() alone would
// re-parse JSON into a new array on every call, which would trip
// useSyncExternalStore's "getSnapshot should be cached" infinite-loop
// guard).

let cachedSnapshot: LocalHistoryEntry[] = readLocalHistory();
const listeners = new Set<() => void>();

function refreshSnapshotAndNotify(): void {
  cachedSnapshot = readLocalHistory();
  for (const listener of listeners) listener();
}

export function getLocalHistorySnapshot(): LocalHistoryEntry[] {
  return cachedSnapshot;
}

export function getServerLocalHistorySnapshot(): LocalHistoryEntry[] {
  return EMPTY_HISTORY;
}

export function subscribeToLocalHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
// -------------------------------------------------------------------------

export function addToLocalHistory(entry: Omit<LocalHistoryEntry, "askedAt">): void {
  if (!isBrowser()) return;
  try {
    const existing = readLocalHistory().filter((item) => item.href !== entry.href);
    const next = [{ ...entry, askedAt: new Date().toISOString() }, ...existing].slice(
      0,
      MAX_ENTRIES,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    refreshSnapshotAndNotify();
  } catch {
    // Storage unavailable or full — the search itself already succeeded, so
    // silently skip recording rather than surface an error for a
    // convenience feature.
  }
}

export function removeFromLocalHistory(href: string): void {
  if (!isBrowser()) return;
  try {
    const next = readLocalHistory().filter((item) => item.href !== href);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    refreshSnapshotAndNotify();
  } catch {
    // See addToLocalHistory.
  }
}

export function clearLocalHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    refreshSnapshotAndNotify();
  } catch {
    // See addToLocalHistory.
  }
}
