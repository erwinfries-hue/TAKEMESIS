import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Axia4Logo } from "@/components/brand/axia4-logo";

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
      <p className="mb-2 flex items-center justify-center gap-2">
        <Axia4Logo alt="AXIA4 Digital" />
        <span>{dict.brand.parent}</span>
      </p>
      <p className="mt-1">{dict.footer.disclaimer}</p>
    </footer>
  );
}
