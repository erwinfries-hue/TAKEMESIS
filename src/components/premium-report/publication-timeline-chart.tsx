import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumComparisonRow } from "@/lib/reports/premium-report";

function yearCounts(rows: PremiumComparisonRow[]): Array<{ year: number; count: number }> {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (row.year === null) continue;
    counts.set(row.year, (counts.get(row.year) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Simple CSS-bar histogram of publication years — no charting library,
 * consistent with the rest of the report (e.g. ConfidenceGauge is plain
 * divs too). Studies with an unknown year are counted separately rather
 * than silently dropped, so the bars never imply more precision than the
 * underlying metadata actually has.
 */
export function PublicationTimelineChart({
  dict,
  rows,
}: {
  dict: Dictionary;
  rows: PremiumComparisonRow[];
}) {
  const buckets = yearCounts(rows);
  const undated = rows.filter((row) => row.year === null).length;

  if (buckets.length === 0) {
    return null;
  }

  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">
        {dict.premiumReportPage.timelineHeading}
      </h3>
      <div className="flex items-end gap-1.5" role="img" aria-label={dict.premiumReportPage.timelineHeading}>
        {buckets.map((bucket) => (
          <div key={bucket.year} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-brand-neutral-600">{bucket.count}</span>
            <div
              className="w-6 rounded-t bg-brand-teal-600"
              style={{ height: `${Math.max((bucket.count / maxCount) * 64, 6)}px` }}
            />
            <span className="text-[10px] text-brand-neutral-600">{bucket.year}</span>
          </div>
        ))}
      </div>
      {undated > 0 && (
        <p className="mt-2 text-xs text-brand-neutral-600">
          {dict.premiumReportPage.timelineUndatedNote.replace("{count}", String(undated))}
        </p>
      )}
    </div>
  );
}
