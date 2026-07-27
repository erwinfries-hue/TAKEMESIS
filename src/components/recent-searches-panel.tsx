"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import {
  clearLocalHistory,
  getLocalHistorySnapshot,
  getServerLocalHistorySnapshot,
  removeFromLocalHistory,
  subscribeToLocalHistory,
} from "@/lib/search-history/local-history";

/** Renders nothing on the server/first paint (localStorage is client-only) and nothing at all when the history is empty — never an empty-state placeholder taking up space on first-time visits. useSyncExternalStore (not useState+useEffect) keeps this consistent across hydration without a setState-in-effect. */
export function RecentSearchesPanel({ dict }: { dict: Dictionary }) {
  const history = useSyncExternalStore(
    subscribeToLocalHistory,
    getLocalHistorySnapshot,
    getServerLocalHistorySnapshot,
  );

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-neutral-950">
          {dict.recentSearches.heading}
        </h2>
        <button
          type="button"
          onClick={() => clearLocalHistory()}
          className="text-xs text-brand-neutral-600 hover:underline"
        >
          {dict.recentSearches.clearCta}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {history.map((entry) => (
          <li
            key={entry.href}
            className="flex items-center gap-1.5 rounded-full border border-brand-neutral-200 bg-white py-1 pl-3 pr-1.5 text-sm"
          >
            <Link href={entry.href} className="text-brand-navy-900 hover:underline">
              {entry.question.length > 60 ? `${entry.question.slice(0, 60)}…` : entry.question}
            </Link>
            <button
              type="button"
              onClick={() => removeFromLocalHistory(entry.href)}
              aria-label={dict.recentSearches.removeAriaLabel}
              className="rounded-full px-1 text-brand-neutral-600 hover:bg-brand-neutral-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-brand-neutral-600">{dict.recentSearches.note}</p>
    </div>
  );
}
