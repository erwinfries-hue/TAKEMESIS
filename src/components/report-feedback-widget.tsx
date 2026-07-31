"use client";

import { useActionState, useId } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { MAX_FEEDBACK_COMMENT_LENGTH } from "@/lib/security/limits";
import { submitReportFeedbackAction, type SubmitReportFeedbackResult } from "@/app/report/[token]/feedback-actions";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

async function handleSubmit(
  _previous: SubmitReportFeedbackResult | null,
  formData: FormData,
): Promise<SubmitReportFeedbackResult> {
  return submitReportFeedbackAction(formData);
}

export function ReportFeedbackWidget({
  dict,
  reportId,
}: {
  dict: Dictionary["reportFeedback"];
  reportId: string;
}) {
  const [result, formAction, pending] = useActionState(handleSubmit, null);
  const commentId = useId();

  if (result?.ok) {
    return (
      <div
        role="status"
        className="flex w-full max-w-xl flex-col gap-1 rounded-xl border border-brand-teal-200 bg-brand-teal-50 p-6 text-center"
      >
        <p className="font-semibold text-brand-navy-900">{dict.thankYouHeading}</p>
        <p className="text-sm text-brand-neutral-600">{dict.thankYouBody}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-xl flex-col gap-4 rounded-xl border border-brand-neutral-200 bg-white p-6"
    >
      <input type="hidden" name="reportId" value={reportId} />
      <h2 className="text-lg font-semibold text-brand-navy-900">{dict.heading}</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-brand-navy-900">{dict.ratingLabel}</legend>
        <div className="flex items-center gap-2">
          {RATING_VALUES.map((value) => (
            <label
              key={value}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-brand-neutral-200 text-sm font-medium text-brand-navy-900 transition-colors has-[:checked]:border-brand-teal-600 has-[:checked]:bg-brand-teal-100"
            >
              <input type="radio" name="rating" value={value} className="sr-only" />
              {value}
            </label>
          ))}
        </div>
        <div className="flex justify-between text-xs text-brand-neutral-600">
          <span>{dict.ratingScaleLowLabel}</span>
          <span>{dict.ratingScaleHighLabel}</span>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={commentId} className="text-sm font-medium text-brand-navy-900">
          {dict.commentLabel}
        </label>
        <textarea
          id={commentId}
          name="comment"
          rows={3}
          maxLength={MAX_FEEDBACK_COMMENT_LENGTH}
          placeholder={dict.commentPlaceholder}
          className="rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-navy-900 focus:border-brand-teal-600 focus:outline-none"
        />
      </div>

      {result?.error && <p className="text-sm text-brand-warning-600">{dict.errorBody}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
      >
        {dict.submitLabel}
      </button>
    </form>
  );
}
