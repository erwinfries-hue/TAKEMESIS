import type { MonthlyFeedbackSummary } from "@/lib/feedback/feedback-analytics";

const MAX_RATING = 5;
/** Two separate single-hue bar charts rather than one dual-axis chart — count and average rating are different scales/units and must not share an axis. */
const BAR_MAX_HEIGHT_PX = 80;

function formatMonth(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1).toLocaleDateString("de-CH", {
    month: "short",
    year: "2-digit",
  });
}

/** Plain CSS bars, same pattern as PublicationTimelineChart — no charting library. */
export function FeedbackVolumeChart({ months }: { months: MonthlyFeedbackSummary[] }) {
  if (months.length === 0) {
    return null;
  }
  const max = Math.max(...months.map((entry) => entry.count));

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">
        Feedback-Volumen pro Monat
      </h3>
      <div
        className="flex items-end gap-2"
        role="img"
        aria-label="Anzahl Feedback-Einträge pro Monat"
      >
        {months.map((entry) => (
          <div key={entry.month} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-brand-neutral-600">{entry.count}</span>
            <div
              className="w-8 rounded-t bg-brand-teal-600"
              style={{ height: `${Math.max((entry.count / max) * BAR_MAX_HEIGHT_PX, 6)}px` }}
            />
            <span className="text-[10px] text-brand-neutral-600">{formatMonth(entry.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Months with zero rated entries (comment-only feedback) are omitted rather than shown as a false "0" bar. */
export function FeedbackRatingChart({ months }: { months: MonthlyFeedbackSummary[] }) {
  const rated = months.filter(
    (entry): entry is MonthlyFeedbackSummary & { averageRating: number } =>
      entry.averageRating !== null,
  );
  if (rated.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">Ø-Bewertung pro Monat</h3>
      <div
        className="flex items-end gap-2"
        role="img"
        aria-label="Durchschnittliche Bewertung pro Monat, Skala 1 bis 5"
      >
        {rated.map((entry) => (
          <div key={entry.month} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-brand-neutral-600">
              {entry.averageRating.toFixed(1)}
            </span>
            <div
              className="w-8 rounded-t bg-brand-teal-600"
              style={{
                height: `${Math.max((entry.averageRating / MAX_RATING) * BAR_MAX_HEIGHT_PX, 6)}px`,
              }}
            />
            <span className="text-[10px] text-brand-neutral-600">{formatMonth(entry.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
