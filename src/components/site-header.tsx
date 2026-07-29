import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { TekmesisLogo } from "@/components/brand/tekmesis-logo";
import { SiteNav } from "@/components/site-nav";

export function SiteHeader({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const navItems: Array<{ href: string; label: string }> = [
    { href: "/topics", label: dict.nav.topics },
    { href: "/methodology", label: dict.nav.methodology },
    { href: "/sources", label: dict.nav.sources },
    { href: "/example-report", label: dict.nav.exampleReport },
    { href: "/about", label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-brand-neutral-200 bg-white px-6 py-4 print:hidden sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <TekmesisLogo name={dict.brand.name} />
        </Link>
        <SiteNav items={navItems} ariaLabel={dict.nav.mainNavigation} />
        <LocaleSwitcher current={locale} />
      </div>
    </header>
  );
}
