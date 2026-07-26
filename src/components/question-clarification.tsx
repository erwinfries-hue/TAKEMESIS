import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { TopicRiskProfile } from "@/content/topics";
import { AGE_FILTER_OPTIONS, STUDY_TYPE_GROUP_IDS, type StudyTypeGroupId } from "@/lib/search/filters";

export interface CandidateOption {
  slug: string;
  name: string;
  riskProfile: TopicRiskProfile;
}

const STUDY_TYPE_GROUP_LABEL_KEY: Record<StudyTypeGroupId, keyof Dictionary["searchFilters"]> = {
  reviews: "groupReviews",
  rct: "groupRct",
  observational: "groupObservational",
  other: "groupOther",
};

const AGE_OPTION_LABEL_KEY: Record<(typeof AGE_FILTER_OPTIONS)[number], keyof Dictionary["searchFilters"]> = {
  5: "age5",
  10: "age10",
  15: "age15",
};

/**
 * Plain GET form (no client JS needed): confirming navigates to
 * /search?q=...&domain=... so the server component can run the real search
 * pipeline for the chosen domain. No local "confirmed" UI state anymore —
 * the result of confirming is a real search, not a placeholder message.
 */
export function QuestionClarification({
  dict,
  question,
  candidates,
  fallbackTopics,
}: {
  dict: Dictionary;
  question: string;
  candidates: CandidateOption[];
  fallbackTopics: CandidateOption[];
}) {
  const options = candidates.length > 0 ? candidates : fallbackTopics;

  return (
    <form
      method="get"
      action="/search"
      className="flex w-full max-w-xl flex-col gap-4 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <input type="hidden" name="q" value={question} />
      <h2 className="text-lg font-semibold text-brand-navy-900">
        {candidates.length > 0
          ? dict.searchPage.clarificationHeading
          : dict.searchPage.notClassifiedHeading}
      </h2>
      <p className="text-sm text-brand-neutral-600">
        {candidates.length > 0
          ? dict.searchPage.clarificationIntro
          : dict.searchPage.notClassifiedBody}
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{dict.searchPage.clarificationHeading}</legend>
        {options.map((option, index) => (
          <label
            key={option.slug}
            className="flex items-center gap-2 rounded-lg border border-brand-neutral-200 px-3 py-2 text-sm has-[:checked]:border-brand-teal-600 has-[:checked]:bg-brand-teal-100"
          >
            <input type="radio" name="domain" value={option.slug} defaultChecked={index === 0} />
            {option.name}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-brand-neutral-200 pt-4">
        <h3 className="text-sm font-semibold text-brand-navy-900">{dict.searchFilters.heading}</h3>

        <label className="flex flex-wrap items-center gap-2 text-sm text-brand-neutral-950">
          {dict.searchFilters.ageLabel}
          <select
            name="maxAgeYears"
            defaultValue=""
            className="rounded-lg border border-brand-neutral-200 px-2 py-1 text-sm"
          >
            <option value="">{dict.searchFilters.ageNoLimit}</option>
            {AGE_FILTER_OPTIONS.map((years) => (
              <option key={years} value={years}>
                {dict.searchFilters[AGE_OPTION_LABEL_KEY[years]]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-brand-neutral-950">
            {dict.searchFilters.studyTypeHeading}
          </legend>
          {STUDY_TYPE_GROUP_IDS.map((groupId) => (
            <label key={groupId} className="flex items-center gap-2 text-sm text-brand-neutral-600">
              <input
                type="checkbox"
                name="studyTypeGroup"
                value={groupId}
                defaultChecked
                className="h-4 w-4 rounded border-brand-neutral-200 text-brand-teal-600 focus:ring-brand-teal-400"
              />
              {dict.searchFilters[STUDY_TYPE_GROUP_LABEL_KEY[groupId]]}
            </label>
          ))}
        </fieldset>

        <p className="text-xs text-brand-neutral-600">{dict.searchFilters.note}</p>
      </div>

      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.searchPage.confirmButton}
      </button>
    </form>
  );
}
