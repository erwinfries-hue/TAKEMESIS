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
          Each tab now carries its own border/background — the previous
          single pill-shaped wrapper with only the active tab filled made
          the two inactive tabs read as plain text links, not as tabs; the
          per-tab border makes all three read as one segmented control at
          a glance. flex-wrap (instead of the old inline-flex, which forced
          a fixed total width) lets the whole set drop to a second row as
          a unit on narrow viewports, rather than wrapping words inside a
          single button. */}
      <div
        role="tablist"
        aria-label={dict.questionModeSelector.tabListLabel}
        id={tabListId}
        className="flex flex-wrap justify-center gap-2 text-sm"
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
