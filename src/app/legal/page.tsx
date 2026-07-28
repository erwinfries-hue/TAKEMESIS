import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.legalPage.heading} — ${dict.brand.name}` };
}

export default async function LegalPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-semibold text-brand-navy-900">{dict.legalPage.heading}</h1>

      <div className="flex w-full max-w-2xl flex-col gap-8">
        <section>
          <h2 className="mb-1 font-semibold text-brand-navy-900">
            {dict.legalPage.sellerHeading}
          </h2>
          {dict.legalPage.seller.map((line) => (
            <p key={line} className="text-sm text-brand-neutral-600">
              {line}
            </p>
          ))}
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-brand-navy-900">
            {dict.legalPage.contactHeading}
          </h2>
          <p className="text-sm text-brand-neutral-600">{dict.legalPage.supportEmail}</p>
          <p className="text-sm text-brand-neutral-600">{dict.legalPage.responseTime}</p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-brand-navy-900">
            {dict.legalPage.priceHeading}
          </h2>
          <p className="text-sm text-brand-neutral-600">{dict.legalPage.priceNote}</p>
          <p className="mt-2 text-sm text-brand-neutral-600">{dict.legalPage.taxNote}</p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-brand-navy-900">
            {dict.legalPage.disclaimerHeading}
          </h2>
          <p className="text-sm text-brand-neutral-600">{dict.legalPage.disclaimer}</p>
        </section>
      </div>
    </main>
  );
}
