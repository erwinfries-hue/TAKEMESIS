import "server-only";
import { runSearch as defaultRunSearch } from "@/lib/search/run-search";
import { NO_FILTERS } from "@/lib/search/filters";
import type { Report } from "./types";
import type { NormalizedRecord, SourceId } from "@/lib/source-adapters/types";

/** Rate-limits re-triggering (decision #7: a one-time, user-triggered recheck, not a recurring subscription — CLAUDE.md: "No subscription in MVP"). */
export const MIN_UPDATE_CHECK_INTERVAL_HOURS = 24;

export interface NewlyFoundStudy {
  title: string | null;
  venue: string | null;
  year: number | null;
  source: SourceId;
  sourceUrl: string | null;
  doi: string | null;
}

export interface UpdateCheckResult {
  checkedAt: string;
  newStudies: NewlyFoundStudy[];
}

/**
 * Whether an Evidenz-Update-Check may run right now for this report: only
 * for a "ready" report with an email on file (the only delivery channel
 * without a mandatory account — see OPEN_RISKS.md #25), and not more often
 * than MIN_UPDATE_CHECK_INTERVAL_HOURS, so this stays a genuinely one-time,
 * user-triggered action rather than something that could be hammered
 * through a public report link.
 */
export function canRunUpdateCheck(
  report: Pick<Report, "status" | "email" | "lastUpdateCheckAt">,
  now: Date = new Date(),
): boolean {
  if (report.status !== "ready" || !report.email) {
    return false;
  }
  if (!report.lastUpdateCheckAt) {
    return true;
  }
  const elapsedMs = now.getTime() - new Date(report.lastUpdateCheckAt).getTime();
  return elapsedMs >= MIN_UPDATE_CHECK_INTERVAL_HOURS * 60 * 60 * 1000;
}

function studyIdentityKey(study: { doi: string | null; sourceUrl: string | null }): string | null {
  if (study.doi) return `doi:${study.doi.trim().toLowerCase()}`;
  if (study.sourceUrl) return `url:${study.sourceUrl.trim().toLowerCase()}`;
  return null;
}

export interface RunUpdateCheckDeps {
  runSearch?: typeof defaultRunSearch;
}

/**
 * Re-runs the same search the report was originally built from (same
 * question/domain/locale/filters) and diffs its included studies against
 * the report's already-shown `finalPayload.sources` — the full originally-
 * included list, not just the top-`DETAILED_RESULTS_CAP` detailed subset
 * (see premium-report.ts: `sources` is built from `rankedIncluded`,
 * `profiles`/`comparison` from the capped `detailed`) — by DOI, falling
 * back to source URL. A study with neither is never comparable and is
 * silently skipped rather than guessed as new or not — consistent with the
 * "unknown stays null, never guessed" rule.
 *
 * Deliberately returns only minimal, directly-sourced fields (title, venue,
 * year, source, link) — never AI-synthesized findings, since these newly
 * found studies were only screened/included by the search pipeline here,
 * not run through AI extraction/synthesis like the original report's
 * detailed profiles were. Presenting anything beyond that would risk the
 * "present a protocol as completed evidence"-style overclaiming CLAUDE.md
 * rules out.
 */
export async function runUpdateCheck(
  report: Report,
  deps: RunUpdateCheckDeps = {},
): Promise<UpdateCheckResult> {
  const runSearch = deps.runSearch ?? defaultRunSearch;

  if (!report.domainSlug) {
    throw new Error(`Report ${report.id} has no domainSlug — cannot run an update check`);
  }

  const filters = report.previewPayload?.filtersApplied ?? NO_FILTERS;
  const searchResult = await runSearch(report.originalQuestion, report.domainSlug, report.locale, filters);

  const knownKeys = new Set(
    (report.finalPayload?.sources ?? [])
      .map((source) => studyIdentityKey(source))
      .filter((key): key is string => key !== null),
  );

  const newStudies: NewlyFoundStudy[] = [];
  for (const scored of searchResult.rankedIncluded) {
    const record: NormalizedRecord = scored.deduped.record;
    const key = studyIdentityKey(record);
    if (!key || knownKeys.has(key)) {
      continue;
    }
    knownKeys.add(key);
    newStudies.push({
      title: record.title,
      venue: record.venue,
      year: record.year,
      source: record.source,
      sourceUrl: record.sourceUrl,
      doi: record.doi,
    });
  }

  return { checkedAt: new Date().toISOString(), newStudies };
}
