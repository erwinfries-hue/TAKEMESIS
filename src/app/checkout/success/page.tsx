import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.checkoutSuccessPage.heading} — ${dict.brand.name}` };
}

/**
 * Deliberately does not show or unlock any report content itself — per
 * docs/09_MONETIZATION_STRIPE_AND_REPORT_LIFECYCLE.md, "success page does
 * not prove payment". The verified Stripe webhook is the only thing that
 * ever marks a report paid; this page just sets expectations.
 */
export default async function CheckoutSuccessPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-4 px-6 py-16 text-center sm:px-10">
      <h1 className="text-2xl font-semibold text-brand-navy-900">
        {dict.checkoutSuccessPage.heading}
      </h1>
      <p className="max-w-xl text-brand-neutral-600">{dict.checkoutSuccessPage.body}</p>
      <p className="max-w-xl text-xs text-brand-neutral-600">
        {dict.checkoutSuccessPage.notProofNote}
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
      >
        {dict.checkoutSuccessPage.homeCta}
      </Link>
    </main>
  );
}
