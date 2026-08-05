"use client";

import { Suspense, useId, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { OwnQuestionForm } from "@/components/own-question-form";
import { StudyLookupForm } from "@/components/study-lookup-form";
import { TemplatedQuestionForm } from "@/components/templated-question-form";

type Mode = "question" | "template" | "doi";

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
    { mode: "template", label: dict.templatedQuestionForm.heading },
    { mode: "doi", label: dict.studyLookupForm.heading },
  ];

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      {/* Widened from max-w-xl to max-w-2xl (2026-08-05) so the three tabs
          fit on one line at text-sm instead of each wrapping mid-label.
          Each tab carries its own border/background — the earlier single
          pill wrapper with only the active tab filled made the two
          inactive tabs read as plain text links, not as tabs. The outer
          rounded-2xl/border/bg-white frame reads as one enclosing "button"
          with the three tab pills inside it, restoring the segmented-
          control look the original 2-tab design had; w-full makes this
          frame the same width as the form card below it (QuestionFormCard
          has no max-width of its own for exactly this reason — both are
          capped only by this component's shared max-w-2xl wrapper).
          flex-wrap lets the whole set drop to a second row as a unit on
          narrow viewports or long labels (French), rather than wrapping
          words inside a single button. */}
      <div
        role="tablist"
        aria-label={dict.questionModeSelector.tabListLabel}
        id={tabListId}
        className="flex w-full flex-wrap justify-center gap-2 rounded-2xl border border-brand-neutral-200 bg-white p-2 text-sm"
      >
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            onClick={() => setMode(tab.mode)}
            className={`rounded-full border px-5 py-2 font-medium transition-colors ${
              mode === tab.mode
                ? "border-brand-navy-900 bg-brand-navy-900 text-white"
                : "border-brand-neutral-200 bg-white text-brand-neutral-600 hover:border-brand-neutral-300 hover:text-brand-navy-900"
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
        ) : mode === "template" ? (
          <TemplatedQuestionForm dict={dict} locale={locale} hideHeading />
        ) : (
          <StudyLookupForm dict={dict} hideHeading />
        )}
      </div>
    </div>
  );
}
