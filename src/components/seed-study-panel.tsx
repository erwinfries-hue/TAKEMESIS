import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { NormalizedRecord } from "@/lib/source-adapters/types";

/** Shows the study a "compare a study you already have" search was seeded from, clearly labeled apart from the comparison results below it. */
export function SeedStudyPanel({
  dict,
  study,
}: {
  dict: Dictionary;
  study: NormalizedRecord;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-2 rounded-xl border-2 border-brand-teal-600 bg-white p-5 text-left">
      <span className="w-fit rounded-full bg-brand-teal-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-teal-700">
        {dict.studyLookupForm.seedStudyLabel}
      </span>
      {study.sourceUrl ? (
        <a
          href={study.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-navy-900 hover:underline"
        >
          {study.title ?? dict.teaserPage.unknownTitle}
        </a>
      ) : (
        <span className="font-semibold text-brand-navy-900">
          {study.title ?? dict.teaserPage.unknownTitle}
        </span>
      )}
      <p className="text-sm text-brand-neutral-600">
        {[dict.publicationTypeLabels[study.publicationType], study.venue, study.year ? String(study.year) : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}
