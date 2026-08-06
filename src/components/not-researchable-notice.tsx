import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { InfoIcon } from "@/components/icons/notice-icons";
import { QuestionPhrasingTips } from "@/components/question-phrasing-tips";

/**
 * Distinct from NotEligibleNotice on purpose (docs/OPEN_RISKS.md #34): "not
 * enough evidence found" and "this question type can't be answered by
 * literature synthesis at all" are different, honest reasons — conflating
 * them into one generic message would misattribute a wrong-question-type
 * result to thin coverage, which isn't true and isn't actionable the same
 * way (no amount of rephrasing fixes thin coverage; the right rephrasing
 * does fix this).
 */
export function NotResearchableNotice({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div
      role="alert"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-brand-teal-600" />
        <h1 className="text-xl font-semibold text-brand-navy-900">
          {dict.notResearchablePage.heading}
        </h1>
      </div>
      <p className="text-sm text-brand-neutral-600">{dict.notResearchablePage.body}</p>
      <h2 className="font-semibold text-brand-navy-900">
        {dict.notResearchablePage.refineHeading}
      </h2>
      <p className="text-sm text-brand-neutral-600">{dict.notResearchablePage.refineBody}</p>
      <QuestionPhrasingTips dict={dict.questionPhrasingTips} />
      <Link
        href={`/${locale}/topics`}
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.notResearchablePage.refineCta}
      </Link>
    </div>
  );
}
