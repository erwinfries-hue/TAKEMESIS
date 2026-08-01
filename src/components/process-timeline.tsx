import type { IconProps } from "@/components/icons/icon-base";

/**
 * Shared vertical process timeline: icon-in-circle nodes connected by a
 * single line, used on the homepage ("How it works", 4 grouped steps) and
 * /methodology (7 detailed steps). Each caller passes its own icon per
 * step (see PROCESS_STEP_ICONS in icons/process-step-icons.tsx) since the
 * two pages no longer share the same step count/order.
 */
export function ProcessTimeline({
  steps,
}: {
  steps: Array<{ title: string; body?: string; icon?: (props: IconProps) => React.ReactElement }>;
}) {
  return (
    <ol className="flex w-full max-w-2xl flex-col">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-teal-600 bg-white text-brand-teal-700">
                {StepIcon ? (
                  <StepIcon className="h-5 w-5" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </span>
              {!isLast && <span className="w-px flex-1 bg-brand-neutral-200" aria-hidden="true" />}
            </div>
            <div className={isLast ? "pb-0 pt-1.5" : "pb-8 pt-1.5"}>
              <span className="text-xs font-semibold text-brand-teal-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="font-semibold text-brand-navy-900">{step.title}</p>
              {step.body && <p className="text-sm text-brand-neutral-600">{step.body}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
