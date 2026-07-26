import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Plain GET form (no client JS needed) — alternative entry point to OwnQuestionForm for "I already have a study, compare it against the rest of the evidence." */
export function StudyLookupForm({ dict, id }: { dict: Dictionary; id?: string }) {
  return (
    <form
      id={id}
      action="/search"
      method="get"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-5 text-left shadow-sm"
    >
      <h2 className="font-semibold text-brand-navy-900">{dict.studyLookupForm.heading}</h2>
      <p className="text-sm text-brand-neutral-600">{dict.studyLookupForm.intro}</p>
      <label htmlFor="study-doi" className="text-sm font-medium text-brand-neutral-950">
        {dict.studyLookupForm.label}
      </label>
      <input
        id="study-doi"
        name="doi"
        type="text"
        placeholder={dict.studyLookupForm.placeholder}
        className="w-full rounded-lg border border-brand-neutral-200 p-3 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
      />
      <button
        type="submit"
        className="self-start rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.studyLookupForm.submit}
      </button>
    </form>
  );
}
