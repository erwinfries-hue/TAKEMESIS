"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";

/** Swaps the leading /de|/en|/fr segment for `target`; leaves the rest of the path (and its query/hash, since those aren't part of `pathname`) untouched. */
function swapLocaleSegment(pathname: string, target: Locale): string | null {
  const segments = pathname.split("/");
  if (!isLocale(segments[1])) {
    return null;
  }
  segments[1] = target;
  return segments.join("/");
}

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 text-sm" aria-label="Sprache wählen / choose language">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          aria-current={locale === current}
          onClick={() => {
            // Pages under src/app/[locale] (the current path starts with a
            // real /de|/en|/fr segment) navigate to the same page under the
            // new locale. Pages deliberately left outside that segment
            // (search, checkout, report/[token], admin) have no locale
            // segment to swap — for those, only the cookie preference
            // changes, same as before path-based i18n existed.
            const target = swapLocaleSegment(pathname, locale);
            startTransition(async () => {
              await setLocale(locale);
              if (target) {
                router.push(target);
              } else {
                router.refresh();
              }
            });
          }}
          className={
            locale === current
              ? "font-semibold text-brand-teal-700 underline underline-offset-4"
              : "text-brand-neutral-600 hover:text-brand-teal-700"
          }
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
