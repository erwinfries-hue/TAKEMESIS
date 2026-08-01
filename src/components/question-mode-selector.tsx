"use client";

import { Suspense, useId, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { OwnQuestionForm } from "@/components/own-question-form";
import { StudyLookupForm } from "@/components/study-lookup-form";

type Mode = "question" | "doi";

/**
 * Replaces the homepage's previous side-by-side OwnQuestionForm +
 * StudyLookupForm cards — the audit (docs/HOMEPAGE_UX_UI_AUDIT.md) found
 * those competing as two equal-weight CTAs with no primary action. The DOI
 * lookup stays fully functional, just demoted to a secondary tab, default
 * "question" mode. Each form keeps its own internal state, so switching
 * tabs away and back clears whatever was typed in the other one — an
 * accepted simplification for a first version, not a bug.
 */
export function QuestionModeSelector({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [mode, setMode] = useState<Mode>("question");
  const tabListId = useId();

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div
        role="tablist"
        aria-label={dict.questionModeSelector.tabListLabel}
        id={tabListId}
        className="inline-flex gap-1 rounded-full border border-brand-neutral-200 bg-white p-1 text-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "question"}
          onClick={() => setMode("question")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "question"
              ? "bg-brand-navy-900 text-white"
              : "text-brand-neutral-600 hover:text-brand-navy-900"
          }`}
        >
          {dict.ownQuestionForm.heading}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "doi"}
          onClick={() => setMode("doi")}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "doi"
              ? "bg-brand-navy-900 text-white"
              : "text-brand-neutral-600 hover:text-brand-navy-900"
          }`}
        >
          {dict.studyLookupForm.heading}
        </button>
      </div>

      <div role="tabpanel" className="w-full">
        {mode === "question" ? (
          <Suspense>
            <OwnQuestionForm dict={dict} locale={locale} hideHeading />
          </Suspense>
        ) : (
          <StudyLookupForm dict={dict} hideHeading />
        )}
      </div>
    </div>
  );
}
