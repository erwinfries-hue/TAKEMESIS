import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: `${dict.privacyPage.heading} — ${dict.brand.name}`,
    description: dict.privacyPage.intro,
    alternates: { canonical: "/privacy" },
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.privacyPage.heading}
        </h1>
        <p className="text-brand-neutral-600">{dict.privacyPage.intro}</p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-6">
        {dict.privacyPage.sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-1 font-semibold text-brand-navy-900">{section.title}</h2>
            <p className="text-sm text-brand-neutral-600">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
