import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Matches the 24x24/currentColor/rounded-cap line style of src/components/icons — kept local since it's a one-off list marker, not a reusable topic/process icon. */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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
    <div className="flex w-full max-w-3xl flex-col gap-6 rounded-xl border-2 border-brand-teal-600 bg-white p-6 text-left">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-brand-navy-900">{dict.paywallPanel.heading}</h2>
        <ul className="flex flex-col gap-2 text-sm text-brand-neutral-600">
          {dict.home.paidFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/example-report"
          className="self-start text-sm font-medium text-brand-teal-700 hover:underline"
        >
          {dict.paywallPanel.exampleReportCta} →
        </Link>
      </div>

      <div className="flex flex-col gap-1 border-t border-brand-neutral-200 pt-5">
        <p className="text-3xl font-semibold text-brand-navy-900">{priceDisplay}</p>
        <p className="text-xs text-brand-neutral-600">{dict.home.priceNote}</p>
        <p className="text-xs text-brand-neutral-600">
          {dict.paywallPanel.priceVersionLabel}: {priceVersion}
        </p>
        <p className="text-xs text-brand-neutral-600">{dict.paywallPanel.refundNote}</p>
      </div>

      <p className="rounded-lg bg-brand-neutral-100 p-3 text-xs text-brand-neutral-600">
        {dict.paywallPanel.checkoutComingSoon}
      </p>
    </div>
  );
}
