"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav({
  items,
  ariaLabel,
}: {
  items: Array<{ href: string; label: string }>;
  ariaLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-brand-neutral-600"
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "font-semibold text-brand-teal-700"
                : "hover:text-brand-teal-700"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
