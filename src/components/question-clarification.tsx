"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { TopicRiskProfile } from "@/content/topics";

export interface CandidateOption {
  slug: string;
  name: string;
  riskProfile: TopicRiskProfile;
}

export function QuestionClarification({
  dict,
  candidates,
  fallbackTopics,
  elevatedRiskWarning,
}: {
  dict: Dictionary;
  candidates: CandidateOption[];
  fallbackTopics: CandidateOption[];
  elevatedRiskWarning: string;
}) {
  const options = candidates.length > 0 ? candidates : fallbackTopics;
  const [selectedSlug, setSelectedSlug] = useState(options[0]?.slug ?? "");
  const [confirmed, setConfirmed] = useState(false);

  const selected = options.find((option) => option.slug === selectedSlug);

  if (confirmed && selected) {
    return (
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-teal-600 bg-white p-6 text-left">
        <h2 className="text-lg font-semibold text-brand-navy-900">
          {dict.searchPage.confirmedHeading}: {selected.name}
        </h2>
        <p className="text-sm text-brand-neutral-600">{dict.searchPage.confirmedBody}</p>
        {selected.riskProfile === "elevated" && (
          <p className="text-sm text-brand-warning-600">{elevatedRiskWarning}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={() => setConfirmed(false)}
            className="font-medium text-brand-teal-700 hover:underline"
          >
            {dict.searchPage.changeSelection}
          </button>
          <Link
            href={`/topics#${selected.slug}`}
            className="font-medium text-brand-teal-700 hover:underline"
          >
            {dict.searchPage.viewTopicCta} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left">
      <h2 className="text-lg font-semibold text-brand-navy-900">
        {candidates.length > 0
          ? dict.searchPage.clarificationHeading
          : dict.searchPage.notClassifiedHeading}
      </h2>
      <p className="text-sm text-brand-neutral-600">
        {candidates.length > 0
          ? dict.searchPage.clarificationIntro
          : dict.searchPage.notClassifiedBody}
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{dict.searchPage.clarificationHeading}</legend>
        {options.map((option) => (
          <label
            key={option.slug}
            className="flex items-center gap-2 rounded-lg border border-brand-neutral-200 px-3 py-2 text-sm has-[:checked]:border-brand-teal-600 has-[:checked]:bg-brand-teal-100"
          >
            <input
              type="radio"
              name="domain"
              value={option.slug}
              checked={selectedSlug === option.slug}
              onChange={() => setSelectedSlug(option.slug)}
            />
            {option.name}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        disabled={!selectedSlug}
        onClick={() => setConfirmed(true)}
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {dict.searchPage.confirmButton}
      </button>
    </div>
  );
}
