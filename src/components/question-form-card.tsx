import type { ReactNode } from "react";

/**
 * Shared chrome for OwnQuestionForm and StudyLookupForm: the `<form
 * action="/search" method="get">` wrapper, the "highlight while it has
 * content" border/background treatment, and the optional heading suppressed
 * when nested inside QuestionModeSelector's tab panel.
 */
export function QuestionFormCard({
  id,
  hasContent,
  heading,
  hideHeading,
  children,
}: {
  id?: string;
  hasContent: boolean;
  heading: string;
  hideHeading?: boolean;
  children: ReactNode;
}) {
  return (
    <form
      id={id}
      action="/search"
      method="get"
      className={`flex w-full max-w-xl flex-col gap-3 rounded-xl border p-5 text-left shadow-sm transition-colors focus-within:border-brand-teal-500 focus-within:bg-brand-teal-50/40 ${
        hasContent ? "border-brand-teal-500 bg-brand-teal-50/40" : "border-brand-neutral-200"
      }`}
    >
      {!hideHeading && <h2 className="font-semibold text-brand-navy-900">{heading}</h2>}
      {children}
    </form>
  );
}
