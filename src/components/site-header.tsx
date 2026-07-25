import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function SiteHeader({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const navItems: Array<{ href: string; label: string }> = [
    { href: "/topics", label: dict.nav.topics },
    { href: "/methodology", label: dict.nav.methodology },
    { href: "/sources", label: dict.nav.sources },
    { href: "/example-report", label: dict.nav.exampleReport },
    { href: "/about", label: dict.nav.about },
  ];

  return (
    <header className="border-b border-brand-neutral-200 px-6 py-4 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-navy-900"
        >
          {dict.brand.name}
        </Link>
        <nav
          aria-label={locale === "de" ? "Hauptnavigation" : "Main navigation"}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-brand-neutral-600"
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-teal-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <LocaleSwitcher current={locale} />
      </div>
    </header>
  );
}
