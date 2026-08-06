import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const AXIA4_ROOT_URL = "https://axia4.ch";
const AXIA4_BRAND_NAME = "AXIA4 by EF";

export function SiteFooter({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <footer className="border-t border-brand-neutral-200 px-6 py-6 text-center text-xs text-brand-neutral-600 print:hidden sm:px-10">
      <nav className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href={`/${locale}/privacy`} className="hover:text-brand-teal-700">
          {dict.nav.privacy}
        </Link>
        <Link href={`/${locale}/legal`} className="hover:text-brand-teal-700">
          {dict.nav.legal}
        </Link>
        <Link href={`/${locale}/methodology`} className="hover:text-brand-teal-700">
          {dict.nav.methodology}
        </Link>
        <Link href={`/${locale}/sources`} className="hover:text-brand-teal-700">
          {dict.nav.sources}
        </Link>
      </nav>
      <p className="mb-2 flex flex-wrap items-center justify-center gap-2">
        <span className="font-semibold text-brand-navy-900">{dict.brand.name}</span>
        <span>
          {dict.brand.parentPrefix}{" "}
          <a href={AXIA4_ROOT_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {AXIA4_BRAND_NAME}
          </a>
        </span>
      </p>
      <p className="mt-1">{dict.footer.disclaimer}</p>
    </footer>
  );
}
