"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { MAX_QUESTION_LENGTH } from "@/lib/security/limits";
import { topDomainCandidates } from "@/lib/classification/domain";
import { topics, topicCopy } from "@/content/topics";

const SUGGESTION_DEBOUNCE_MS = 400;

export function OwnQuestionForm({
  dict,
  locale,
  id,
}: {
  dict: Dictionary;
  locale: Locale;
  id?: string;
}) {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("q") ?? "";

  // Keyed on `prefilled` so that navigating from an example-question chip
  // (query string changes, but this is a same-page transition — the
  // component wouldn't otherwise remount) resets the form to the new
  // initial value via a clean remount, rather than syncing state in an
  // effect.
  return (
    <OwnQuestionFormFields
      key={prefilled}
      dict={dict}
      locale={locale}
      id={id}
      initialValue={prefilled}
    />
  );
}

function OwnQuestionFormFields({
  dict,
  locale,
  id,
  initialValue,
}: {
  dict: Dictionary;
  locale: Locale;
  id?: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [suggestedTopicName, setSuggestedTopicName] = useState<string | null>(null);

  // Debounced, client-only preview of the same rule-based classifier
  // /search uses after submit (topDomainCandidates) — same "score > 0"
  // bar as the real clarification screen, so this never promises a match
  // that submitting wouldn't also find. Purely a navigation aid: the user
  // still confirms or picks a different domain after submitting either way.
  useEffect(() => {
    const trimmed = value.trim();
    const timer = setTimeout(() => {
      if (trimmed.length === 0) {
        setSuggestedTopicName(null);
        return;
      }
      const [topCandidate] = topDomainCandidates(trimmed, locale);
      if (!topCandidate) {
        setSuggestedTopicName(null);
        return;
      }
      const topic = topics.find((t) => t.slug === topCandidate.slug);
      setSuggestedTopicName(topic ? topicCopy(topic, locale).name : null);
    }, SUGGESTION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, locale]);

  return (
    <form
      id={id}
      action="/search"
      method="get"
      className="flex h-full w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-5 text-left shadow-sm"
    >
      <h2 className="font-semibold text-brand-navy-900">{dict.ownQuestionForm.heading}</h2>
      <label htmlFor="own-question" className="text-sm font-medium text-brand-neutral-950">
        {dict.ownQuestionForm.label}
      </label>
      <textarea
        id="own-question"
        name="q"
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={dict.ownQuestionForm.placeholder}
        maxLength={MAX_QUESTION_LENGTH}
        aria-describedby={suggestedTopicName ? "own-question-suggestion" : undefined}
        className="w-full resize-none rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
      />
      {suggestedTopicName && (
        <p id="own-question-suggestion" role="status" className="text-xs text-brand-teal-700">
          {dict.ownQuestionForm.suggestionPrefix} <strong>{suggestedTopicName}</strong>
        </p>
      )}
      <p className="text-xs text-brand-neutral-600">{dict.ownQuestionForm.warning}</p>
      <button
        type="submit"
        className="mt-auto self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={value.trim().length === 0}
      >
        {dict.ownQuestionForm.submit}
      </button>
    </form>
  );
}
