import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

/**
 * Next.js automatically wraps `page.tsx` in this route segment in a
 * Suspense boundary keyed to this file — shown while the server component's
 * async work (the real search) is in flight. Deliberately generic: we don't
 * know which sources apply until the domain is confirmed, and we don't
 * track per-source completion, so this never claims a specific source is
 * "done" — only that a real search is genuinely running.
 */
export default async function SearchLoading() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center sm:px-10">
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-4 border-brand-neutral-200 border-t-brand-teal-600"
      />
      <p role="status" className="text-brand-navy-900 font-medium">
        {dict.searchPage.loadingHeading}
      </p>
      <p className="max-w-sm text-sm text-brand-neutral-600">{dict.searchPage.loadingBody}</p>
    </main>
  );
}
