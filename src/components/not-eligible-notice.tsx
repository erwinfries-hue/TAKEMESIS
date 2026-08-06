import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { InfoIcon } from "@/components/icons/notice-icons";
import { ExampleQuestionChip } from "@/components/example-question-chip";

export interface NotEligibleExampleTopic {
  name: string;
  /** Already live-verified eligible (docs/OPEN_RISKS.md #19/#27, `/admin/example-questions`) — safe to hold up as a working template. */
  examples: string[];
}

export function NotEligibleNotice({
  dict,
  locale,
  exampleTopic,
}: {
  dict: Dictionary;
  locale: Locale;
  /** The primary domain this search was run against, if any — omitted for the rare not-eligible-with-no-domain edge case. */
  exampleTopic?: NotEligibleExampleTopic | null;
}) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-brand-teal-600" />
        <h1 className="text-xl font-semibold text-brand-navy-900">
          {dict.notEligiblePage.heading}
        </h1>
      </div>
      <p className="text-sm text-brand-neutral-600">
        {dict.notEligiblePage.bodyInsufficientEvidence}
      </p>
      <h2 className="font-semibold text-brand-navy-900">{dict.notEligiblePage.refineHeading}</h2>
      <p className="text-sm text-brand-neutral-600">{dict.notEligiblePage.refineBody}</p>
      {exampleTopic && exampleTopic.examples.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-brand-neutral-100 pt-3">
          <p className="text-sm font-medium text-brand-navy-900">
            {dict.notEligiblePage.exampleQuestionsHeading.replace("{topic}", exampleTopic.name)}
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleTopic.examples.slice(0, 3).map((example) => (
              <ExampleQuestionChip key={example} question={example} locale={locale} />
            ))}
          </div>
        </div>
      )}
      <Link
        href={`/${locale}/topics`}
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.notEligiblePage.refineCta}
      </Link>
    </div>
  );
}
