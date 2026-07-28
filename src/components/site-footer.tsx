import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const AXIA4_ROOT_URL = "https://axia4.ch";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="border-t border-brand-neutral-200 px-6 py-6 text-center text-xs text-brand-neutral-600 print:hidden sm:px-10">
      <nav className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/privacy" className="hover:text-brand-teal-700">
          {dict.nav.privacy}
        </Link>
        <Link href="/legal" className="hover:text-brand-teal-700">
          {dict.nav.legal}
        </Link>
        <Link href="/methodology" className="hover:text-brand-teal-700">
          {dict.nav.methodology}
        </Link>
        <Link href="/sources" className="hover:text-brand-teal-700">
          {dict.nav.sources}
        </Link>
      </nav>
      <p className="mb-2 flex flex-wrap items-center justify-center gap-2">
        <a
          href={AXIA4_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-navy-900 hover:underline"
        >
          {dict.brand.name}
        </a>
        <span>{dict.brand.parent}</span>
      </p>
      <p className="mt-1">{dict.footer.disclaimer}</p>
    </footer>
  );
}
