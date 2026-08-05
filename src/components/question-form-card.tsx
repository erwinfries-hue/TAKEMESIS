import type { ReactNode } from "react";

/**
 * Shared chrome for OwnQuestionForm, TemplatedQuestionForm and
 * StudyLookupForm: the `<form action="/search" method="get">` wrapper, the
 * "highlight while it has content" border/background treatment, and the
 * optional heading suppressed when nested inside QuestionModeSelector's tab
 * panel. No own max-width — all three are only ever rendered inside
 * QuestionModeSelector's tab panel, so `w-full` fills that panel and the two
 * end up the same width as the tab switcher above them, both capped by the
 * shared `max-w-2xl` wrapper (2026-08-05, aligning box and tab-row width).
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
      className={`flex w-full flex-col gap-3 rounded-xl border p-5 text-left shadow-sm transition-colors focus-within:border-brand-teal-500 focus-within:bg-brand-teal-50/40 ${
        hasContent ? "border-brand-teal-500 bg-brand-teal-50/40" : "border-brand-neutral-200"
      }`}
    >
      {!hideHeading && <h2 className="font-semibold text-brand-navy-900">{heading}</h2>}
      {children}
    </form>
  );
}
