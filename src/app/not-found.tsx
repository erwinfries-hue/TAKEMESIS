import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

/**
 * A document-with-magnifying-glass motif — "no result found" reused for
 * "no page found", staying inside the same calm/credible line-icon
 * language as src/components/icons (24x24 viewBox, currentColor stroke,
 * rounded caps/joins). Deliberately not a variant of TekmesisLogo, whose
 * icon-left-of-wordmark layout is fixed and not meant to be restyled.
 */
function NotFoundIllustration() {
  return (
    <svg
      viewBox="0 0 96 96"
      className="h-24 w-24 text-brand-teal-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M28 12h28l14 14v46a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" />
      <path d="M56 12v14h14" />
      <path d="M34 46h20M34 56h14" />
      <circle cx="60" cy="66" r="12" />
      <path d="M69 75l9 9" strokeLinecap="round" />
    </svg>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.notFoundPage.eyebrow} — ${dict.brand.name}` };
}

export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const p = dict.notFoundPage;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center sm:px-10">
      <NotFoundIllustration />
      <p className="text-xs font-medium uppercase tracking-widest text-brand-teal-700">
        {p.eyebrow}
      </p>
      <h1 className="text-2xl font-semibold text-brand-navy-900">{p.heading}</h1>
      <p className="max-w-md text-sm text-brand-neutral-600">{p.body}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
        >
          {p.homeCta}
        </Link>
        <Link
          href="/topics"
          className="rounded-full border border-brand-neutral-200 px-5 py-2 text-sm font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-50"
        >
          {p.topicsCta}
        </Link>
      </div>
    </main>
  );
}
