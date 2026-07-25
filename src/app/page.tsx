import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-brand-neutral-200 px-6 py-4 sm:px-10">
        <span className="text-lg font-semibold tracking-tight text-brand-navy-900">
          {dict.brand.name}
        </span>
        <LocaleSwitcher current={locale} />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center sm:px-10">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-teal-600">
          {dict.brand.claim}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-brand-navy-900 sm:text-4xl">
          {dict.home.description}
        </h1>
        <p className="text-brand-neutral-600">{dict.home.comingSoon}</p>
        <p className="text-sm text-brand-neutral-600">{dict.home.priceNote}</p>
      </main>

      <footer className="border-t border-brand-neutral-200 px-6 py-4 text-center text-xs text-brand-neutral-600 sm:px-10">
        <p>{dict.brand.parent}</p>
        <p className="mt-1">{dict.footer.disclaimer}</p>
      </footer>
    </div>
  );
}
