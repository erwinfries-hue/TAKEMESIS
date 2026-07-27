"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { deriveEligibilityStatus, type EligibilityStatus } from "@/lib/eligibility/eligibility";

const RESULT_STYLES: Record<EligibilityStatus, string> = {
  eligible: "border-brand-teal-600 bg-brand-teal-100 text-brand-teal-700",
  eligible_with_limitations: "border-brand-warning-500 bg-brand-warning-100 text-brand-warning-600",
  not_eligible: "border-brand-neutral-200 bg-brand-neutral-50 text-brand-neutral-600",
};

function Slider({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-center justify-between text-brand-neutral-950">
        <span>{label}</span>
        <span className="font-semibold text-brand-navy-900">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-brand-teal-600"
      />
    </label>
  );
}

/** Runs the real `deriveEligibilityStatus` decision rule against user-chosen counts — same source of truth as an actual search, not a reimplementation, so this can never quietly drift out of sync with what the pipeline really decides. */
export function MethodologyCalculator({ dict }: { dict: Dictionary }) {
  const [included, setIncluded] = useState(6);
  const [resultBearing, setResultBearing] = useState(4);
  const [reviewOrMeta, setReviewOrMeta] = useState(1);

  // Each count can't exceed the one above it — enforced on change, not just visually.
  const clampedResultBearing = Math.min(resultBearing, included);
  const clampedReviewOrMeta = Math.min(reviewOrMeta, clampedResultBearing);
  const individualResultBearing = clampedResultBearing - clampedReviewOrMeta;

  const status = useMemo(
    () =>
      deriveEligibilityStatus({
        includedCount: included,
        resultBearingCount: clampedResultBearing,
        reviewOrMetaCount: clampedReviewOrMeta,
        individualResultBearingCount: individualResultBearing,
      }),
    [included, clampedResultBearing, clampedReviewOrMeta, individualResultBearing],
  );

  const resultLabel = {
    eligible: dict.methodologyPage.calculatorResultEligible,
    eligible_with_limitations: dict.methodologyPage.calculatorResultLimitations,
    not_eligible: dict.methodologyPage.calculatorResultNotEligible,
  }[status];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-brand-neutral-200 bg-white p-6">
      <div>
        <h3 className="font-semibold text-brand-navy-900">{dict.methodologyPage.calculatorHeading}</h3>
        <p className="mt-1 text-sm text-brand-neutral-600">{dict.methodologyPage.calculatorIntro}</p>
      </div>

      <Slider
        label={dict.methodologyPage.calculatorIncludedLabel}
        value={included}
        max={15}
        onChange={(value) => setIncluded(value)}
      />
      <Slider
        label={dict.methodologyPage.calculatorResultBearingLabel}
        value={clampedResultBearing}
        max={included}
        onChange={(value) => setResultBearing(value)}
      />
      <Slider
        label={dict.methodologyPage.calculatorReviewLabel}
        value={clampedReviewOrMeta}
        max={clampedResultBearing}
        onChange={(value) => setReviewOrMeta(value)}
      />

      <div
        role="status"
        className={`rounded-lg border-2 p-3 text-sm font-medium ${RESULT_STYLES[status]}`}
      >
        {resultLabel}
      </div>

      <p className="text-xs text-brand-neutral-600">{dict.methodologyPage.calculatorNote}</p>
    </div>
  );
}
