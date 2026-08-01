"use client";

import { useMemo, useState } from "react";
import { LOW_RATING_CUTOFF } from "@/lib/feedback/feedback-analytics";

export interface FeedbackRow {
  id: string;
  createdAt: string;
  email: string | null;
  topicLabel: string;
  question: string | null;
  rating: number | null;
  comment: string | null;
}

type SortKey = "createdAt" | "rating";
type SortDir = "asc" | "desc";
type RatingFilter = "all" | "low" | "5" | "4" | "3" | "2" | "1";

const RATING_FILTER_LABEL: Record<RatingFilter, string> = {
  all: "Alle Bewertungen",
  low: `Nur niedrige (≤ ${LOW_RATING_CUTOFF})`,
  "5": "5 / 5",
  "4": "4 / 5",
  "3": "3 / 5",
  "2": "2 / 5",
  "1": "1 / 5",
};

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 font-semibold hover:text-brand-teal-700"
    >
      {label}
      <span aria-hidden="true" className={active ? "text-brand-teal-700" : "text-brand-neutral-200"}>
        {active && dir === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}

/** Client-side sort/filter over the already-fetched rows — beta-scale dataset (see ReportRepository.listAll's own doc comment), no server round-trip needed. */
export function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const topics = useMemo(
    () => Array.from(new Set(rows.map((row) => row.topicLabel))).sort((a, b) => a.localeCompare(b, "de")),
    [rows],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (topicFilter !== "all" && row.topicLabel !== topicFilter) {
        return false;
      }
      if (ratingFilter === "low") {
        return row.rating !== null && row.rating <= LOW_RATING_CUTOFF;
      }
      if (ratingFilter !== "all") {
        return row.rating === Number(ratingFilter);
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const comparison =
        sortKey === "createdAt"
          ? a.createdAt.localeCompare(b.createdAt)
          : (a.rating ?? -1) - (b.rating ?? -1);
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [rows, topicFilter, ratingFilter, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-brand-neutral-600">Thema</span>
          <select
            value={topicFilter}
            onChange={(event) => setTopicFilter(event.target.value)}
            className="rounded-lg border border-brand-neutral-200 px-2 py-1 text-brand-neutral-950"
          >
            <option value="all">Alle Themen</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-brand-neutral-600">Bewertung</span>
          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value as RatingFilter)}
            className="rounded-lg border border-brand-neutral-200 px-2 py-1 text-brand-neutral-950"
          >
            {(Object.keys(RATING_FILTER_LABEL) as RatingFilter[]).map((key) => (
              <option key={key} value={key}>
                {RATING_FILTER_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        {(topicFilter !== "all" || ratingFilter !== "all") && (
          <span className="self-center text-xs text-brand-neutral-600">
            {visibleRows.length} von {rows.length} Einträgen
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
            <tr>
              <th className="px-3 py-2">
                <SortButton
                  label="Erstellt"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onClick={() => toggleSort("createdAt")}
                />
              </th>
              <th className="px-3 py-2 font-semibold">E-Mail</th>
              <th className="px-3 py-2 font-semibold">Thema</th>
              <th className="px-3 py-2 font-semibold">Frage</th>
              <th className="px-3 py-2">
                <SortButton
                  label="Bewertung"
                  active={sortKey === "rating"}
                  dir={sortDir}
                  onClick={() => toggleSort("rating")}
                />
              </th>
              <th className="px-3 py-2 font-semibold">Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-brand-neutral-100 align-top last:border-0">
                <td className="px-3 py-2 whitespace-nowrap text-brand-neutral-600">
                  {new Date(row.createdAt).toLocaleString("de-CH")}
                </td>
                <td className="px-3 py-2 text-brand-neutral-600">{row.email ?? "–"}</td>
                <td className="px-3 py-2 text-brand-neutral-600">{row.topicLabel}</td>
                <td className="px-3 py-2 text-brand-neutral-950">{row.question ?? "–"}</td>
                <td className="px-3 py-2 font-medium">
                  {row.rating != null ? (
                    <span
                      className={
                        row.rating <= LOW_RATING_CUTOFF
                          ? "rounded-full bg-brand-warning-100 px-2 py-0.5 text-brand-warning-600"
                          : "text-brand-navy-900"
                      }
                    >
                      {row.rating} / 5
                    </span>
                  ) : (
                    <span className="text-brand-navy-900">–</span>
                  )}
                </td>
                <td className="px-3 py-2 text-brand-neutral-950">{row.comment ?? "–"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-brand-neutral-600">
                  Noch kein Feedback.
                </td>
              </tr>
            )}
            {rows.length > 0 && visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-brand-neutral-600">
                  Kein Feedback entspricht den gewählten Filtern.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
