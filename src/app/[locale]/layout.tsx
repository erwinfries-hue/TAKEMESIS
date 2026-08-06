import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

/**
 * Pass-through layout — the root layout (src/app/layout.tsx) already owns
 * <html>/<body>; this only exists to reject an invalid locale segment
 * (e.g. /xx/topics) with a real 404 instead of silently rendering default
 * content at every arbitrary prefix, which would otherwise create
 * unbounded duplicate-content URLs.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return children;
}
