import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const AXIA4_ROOT_URL = "https://axia4.ch";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.aboutPage.heading} — ${dict.brand.name}` };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16 text-center sm:px-10">
      <p className="text-xs font-medium uppercase tracking-widest text-brand-teal-700">
        {dict.brand.claim}
      </p>
      <h1 className="text-3xl font-semibold text-brand-navy-900">{dict.aboutPage.heading}</h1>
      <p className="max-w-2xl text-brand-neutral-600">{dict.aboutPage.body}</p>

      <section className="flex max-w-2xl flex-col items-center gap-2">
        <h2 className="font-semibold text-brand-navy-900">{dict.aboutPage.nameOriginHeading}</h2>
        <p className="text-brand-neutral-600">{dict.aboutPage.nameOriginBody}</p>
      </section>

      <section className="flex flex-col items-center gap-2">
        <p className="text-brand-neutral-600">{dict.aboutPage.axia4Body}</p>
        <a
          href={AXIA4_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-teal-700 hover:underline"
        >
          {dict.aboutPage.axia4Cta} →
        </a>
      </section>
    </main>
  );
}
