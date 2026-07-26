import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function PaywallPanel({
  dict,
  priceDisplay,
  priceVersion,
}: {
  dict: Dictionary;
  priceDisplay: string;
  priceVersion: string;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-xl border-2 border-brand-teal-600 bg-white p-6 text-left">
      <h2 className="text-xl font-semibold text-brand-navy-900">{dict.paywallPanel.heading}</h2>
      <ul className="flex flex-col gap-2 text-sm text-brand-neutral-600">
        {dict.home.paidFeatures.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
      <Link href="/example-report" className="text-sm font-medium text-brand-teal-700 hover:underline">
        {dict.paywallPanel.exampleReportCta} →
      </Link>
      <p className="text-2xl font-semibold text-brand-navy-900">{priceDisplay}</p>
      <p className="text-xs text-brand-neutral-600">{dict.home.priceNote}</p>
      <p className="text-xs text-brand-neutral-600">
        {dict.paywallPanel.priceVersionLabel}: {priceVersion}
      </p>
      <p className="text-xs text-brand-neutral-600">{dict.paywallPanel.refundNote}</p>
      <p className="rounded-lg bg-brand-neutral-100 p-3 text-xs text-brand-neutral-600">
        {dict.paywallPanel.checkoutComingSoon}
      </p>
    </div>
  );
}
