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

  const tabs: { mode: Mode; label: string }[] = [
    { mode: "question", label: dict.ownQuestionForm.heading },
    { mode: "doi", label: dict.studyLookupForm.heading },
  ];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      {/* Sized up ~50% from its original text-sm/px-4/py-1.5 (2026-08-01,
          layout follow-up) so the tab switcher reads as the page's primary
          control, not a small secondary widget. */}
      <div
        role="tablist"
        aria-label={dict.questionModeSelector.tabListLabel}
        id={tabListId}
        className="inline-flex gap-2 rounded-full border border-brand-neutral-200 bg-white p-1.5 text-lg"
      >
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            onClick={() => setMode(tab.mode)}
            className={`rounded-full px-6 py-2.5 font-medium transition-colors ${
              mode === tab.mode
                ? "bg-brand-navy-900 text-white"
                : "text-brand-neutral-600 hover:text-brand-navy-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
