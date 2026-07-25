"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
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
            startTransition(async () => {
              await setLocale(locale);
              router.refresh();
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
