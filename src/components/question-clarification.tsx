import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { TopicRiskProfile } from "@/content/topics";

export interface CandidateOption {
  slug: string;
  name: string;
  riskProfile: TopicRiskProfile;
}

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

      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.searchPage.confirmButton}
      </button>
    </form>
  );
}
