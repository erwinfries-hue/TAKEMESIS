"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function OwnQuestionForm({
  dict,
  id,
}: {
  dict: Dictionary;
  id?: string;
}) {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("q") ?? "";

  // Keyed on `prefilled` so that navigating from an example-question chip
  // (query string changes, but this is a same-page transition — the
  // component wouldn't otherwise remount) resets the form to the new
  // initial value via a clean remount, rather than syncing state in an
  // effect.
  return <OwnQuestionFormFields key={prefilled} dict={dict} id={id} initialValue={prefilled} />;
}

function OwnQuestionFormFields({
  dict,
  id,
  initialValue,
}: {
  dict: Dictionary;
  id?: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-5 text-left shadow-sm"
    >
      <h2 className="font-semibold text-brand-navy-900">{dict.ownQuestionForm.heading}</h2>
      <label htmlFor="own-question" className="text-sm font-medium text-brand-neutral-950">
        {dict.ownQuestionForm.label}
      </label>
      <textarea
        id="own-question"
        name="question"
        rows={3}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSubmitted(false);
        }}
        placeholder={dict.ownQuestionForm.placeholder}
        className="w-full resize-none rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
      />
      <p className="text-xs text-brand-neutral-600">{dict.ownQuestionForm.warning}</p>
      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={value.trim().length === 0}
      >
        {dict.ownQuestionForm.submit}
      </button>
      {submitted && (
        <p role="status" className="text-sm text-brand-teal-700">
          {dict.ownQuestionForm.helper}
        </p>
      )}
    </form>
  );
}
