"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { SPEECH_LOCALE } from "@/lib/i18n/speech-locale";
import { MAX_QUESTION_LENGTH } from "@/lib/security/limits";
import { topDomainCandidates } from "@/lib/classification/domain";
import { topics, topicCopy } from "@/content/topics";
import { VoiceInputButton } from "@/components/voice-input-button";
import { QuestionFormCard } from "@/components/question-form-card";
import { QuestionPhrasingTips } from "@/components/question-phrasing-tips";

const SUGGESTION_DEBOUNCE_MS = 400;

export function OwnQuestionForm({
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
      hideHeading={hideHeading}
    />
  );
}

function OwnQuestionFormFields({
  dict,
  locale,
  id,
  initialValue,
  hideHeading,
}: {
  dict: Dictionary;
  locale: Locale;
  id?: string;
  initialValue: string;
  hideHeading?: boolean;
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

  const hasContent = value.trim().length > 0;
  // Only shown once the field is meaningfully full — "dezent", not a
  // counter running from the first keystroke.
  const showCharacterCount = value.length > MAX_QUESTION_LENGTH * 0.8;

  return (
    <QuestionFormCard
      id={id}
      hasContent={hasContent}
      heading={dict.ownQuestionForm.heading}
      hideHeading={hideHeading}
    >
      {/* Same flex-1/justify-center wrapper as the paired StudyLookupForm
          card, so both stay structurally symmetric regardless of which
          one ends up taller as content changes. */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="own-question" className="text-sm font-medium text-brand-neutral-950">
            {dict.ownQuestionForm.label}
          </label>
          <VoiceInputButton
            lang={SPEECH_LOCALE[locale]}
            onResult={(transcript) =>
              setValue((prev) => (prev.trim().length > 0 ? `${prev} ${transcript}` : transcript))
            }
            ariaLabel={dict.ownQuestionForm.voiceInputCta}
            listeningLabel={dict.ownQuestionForm.voiceInputListening}
          />
        </div>
        <QuestionPhrasingTips dict={dict.questionPhrasingTips} />
        <textarea
          id="own-question"
          name="q"
          rows={3}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            // Plain Enter stays a newline (multi-sentence questions are
            // common); Cmd/Ctrl+Enter submits, same convention as most
            // chat/comment inputs.
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={dict.ownQuestionForm.placeholder}
          maxLength={MAX_QUESTION_LENGTH}
          aria-describedby={suggestedTopicName ? "own-question-suggestion" : undefined}
          className={`w-full resize-none rounded-lg border p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400 ${
            hasContent ? "border-brand-teal-600 ring-2 ring-brand-teal-400" : "border-brand-neutral-200"
          }`}
        />
        {showCharacterCount && (
          <p className="-mt-2 self-end text-xs text-brand-neutral-600">
            {dict.ownQuestionForm.characterCountLabel
              .replace("{count}", String(value.length))
              .replace("{max}", String(MAX_QUESTION_LENGTH))}
          </p>
        )}
        {suggestedTopicName && (
          <p id="own-question-suggestion" role="status" className="text-xs text-brand-teal-700">
            {dict.ownQuestionForm.suggestionPrefix} <strong>{suggestedTopicName}</strong>
          </p>
        )}
        <p className="text-xs text-brand-neutral-600">{dict.ownQuestionForm.warning}</p>
      </div>
      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={value.trim().length === 0}
      >
        {dict.ownQuestionForm.submit}
      </button>
    </QuestionFormCard>
  );
}
