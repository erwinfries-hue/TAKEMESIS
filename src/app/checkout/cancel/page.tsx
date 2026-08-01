import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: `${dict.checkoutCancelPage.heading} — ${dict.brand.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutCancelPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 px-6 py-16 text-center sm:px-10">
      <h1 className="text-2xl font-semibold text-brand-navy-900">
        {dict.checkoutCancelPage.heading}
      </h1>
      <p className="max-w-xl text-brand-neutral-600">{dict.checkoutCancelPage.body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/topics"
          className="rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
        >
          {dict.checkoutCancelPage.retryCta}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-brand-neutral-200 px-5 py-2 text-sm font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-100"
        >
          {dict.checkoutCancelPage.homeCta}
        </Link>
      </div>
    </main>
  );
}
