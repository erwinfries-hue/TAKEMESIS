"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Alternative entry point to OwnQuestionForm for "I already have a study, compare it against the rest of the evidence." Client-side purely for the has-content highlight below (2026-08-01) — the form itself still works as a plain GET submit. */
export function StudyLookupForm({
  dict,
  id,
  hideHeading,
}: {
  dict: Dictionary;
  id?: string;
  /** Skips the internal <h2> — for placements (e.g. QuestionModeSelector) where a tab/section label already names this form. */
  hideHeading?: boolean;
}) {
  const [value, setValue] = useState("");
  const hasContent = value.trim().length > 0;

  return (
    <form
      id={id}
      action="/search"
      method="get"
      className={`flex w-full max-w-xl flex-col gap-3 rounded-xl border p-5 text-left shadow-sm transition-colors focus-within:border-brand-teal-500 focus-within:bg-brand-teal-50/40 ${
        hasContent ? "border-brand-teal-500 bg-brand-teal-50/40" : "border-brand-neutral-200"
      }`}
    >
      {!hideHeading && (
        <h2 className="font-semibold text-brand-navy-900">{dict.studyLookupForm.heading}</h2>
      )}
      {/* Grows to absorb whatever extra height the paired OwnQuestionForm card
          imposes (its multi-line textarea makes it the taller of the two),
          and centers its own content within that space — so any leftover
          room is distributed evenly above and below the input instead of
          collapsing into one large gap just above the button. */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <p className="text-sm text-brand-neutral-600">{dict.studyLookupForm.intro}</p>
        <label htmlFor="study-doi" className="text-sm font-medium text-brand-neutral-950">
          {dict.studyLookupForm.label}
        </label>
        <input
          id="study-doi"
          name="doi"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={dict.studyLookupForm.placeholder}
          className={`w-full rounded-lg border p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400 ${
            hasContent ? "border-brand-teal-600 ring-2 ring-brand-teal-400" : "border-brand-neutral-200"
          }`}
        />
      </div>
      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.studyLookupForm.submit}
      </button>
    </form>
  );
}
