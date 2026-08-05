"use client";

import { useId, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { MAX_TEMPLATE_FIELD_LENGTH } from "@/lib/security/limits";
import { assembleTemplatedQuestion } from "@/lib/search/templated-question";
import { QuestionFormCard } from "@/components/question-form-card";

/**
 * Zero-cost, keyword-driven alternative to typing a full question freehand
 * (Erwin, 2026-08-05: "gibt es eine andere Möglichkeit den User zu führen
 * ... via einem formular wo mittels stichwörter den Kerninhalt definiert
 * wird?") — an ADDITIONAL third input mode next to OwnQuestionForm and
 * StudyLookupForm, not a replacement. Two short keyword fields are stitched
 * into the same "Welchen Effekt hat X auf Y?" template already proven live,
 * and submitted as a plain `q` param via the shared QuestionFormCard GET
 * form — no client-side navigation, no AI call.
 */
export function TemplatedQuestionForm({
  dict,
  locale,
  id,
  hideHeading,
}: {
  dict: Dictionary;
  locale: Locale;
  id?: string;
  /** Skips the internal <h2> — for placements (e.g. QuestionModeSelector) where a tab/section label already names this form. */
  hideHeading?: boolean;
}) {
  const [measure, setMeasure] = useState("");
  const [outcome, setOutcome] = useState("");
  const measureId = useId();
  const outcomeId = useId();

  const assembled = assembleTemplatedQuestion(measure, outcome, locale);
  const hasContent = measure.trim().length > 0 || outcome.trim().length > 0;

  return (
    <QuestionFormCard
      id={id}
      hasContent={hasContent}
      heading={dict.templatedQuestionForm.heading}
      hideHeading={hideHeading}
    >
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={measureId} className="text-sm font-medium text-brand-neutral-950">
            {dict.templatedQuestionForm.measureLabel}
          </label>
          <input
            id={measureId}
            type="text"
            value={measure}
            onChange={(event) => setMeasure(event.target.value)}
            placeholder={dict.templatedQuestionForm.measurePlaceholder}
            maxLength={MAX_TEMPLATE_FIELD_LENGTH}
            className="w-full rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={outcomeId} className="text-sm font-medium text-brand-neutral-950">
            {dict.templatedQuestionForm.outcomeLabel}
          </label>
          <input
            id={outcomeId}
            type="text"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder={dict.templatedQuestionForm.outcomePlaceholder}
            maxLength={MAX_TEMPLATE_FIELD_LENGTH}
            className="w-full rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
          />
        </div>
        {assembled && (
          <p role="status" className="text-xs text-brand-teal-700">
            {dict.templatedQuestionForm.previewPrefix} <strong>{assembled}</strong>
          </p>
        )}
        <p className="text-xs text-brand-neutral-600">{dict.ownQuestionForm.warning}</p>
        <input type="hidden" name="q" value={assembled ?? ""} />
      </div>
      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!assembled}
      >
        {dict.ownQuestionForm.submit}
      </button>
    </QuestionFormCard>
  );
}
