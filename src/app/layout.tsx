import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { clientEnv } from "@/lib/env/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const OG_LOCALE: Record<Locale, string> = { de: "de_CH", en: "en_US", fr: "fr_CH" };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const title = `${dict.brand.name} — ${dict.brand.claim}`;

  return {
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_BASE_URL),
    title,
    description: dict.home.description,
    alternates: { canonical: "/" },
    // og:image is auto-injected by Next.js from app/opengraph-image.tsx
    // (file-convention metadata) — no need to reference it here.
    openGraph: {
      title,
      description: dict.home.description,
      url: "/",
      siteName: dict.brand.name,
      locale: OG_LOCALE[locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dict.home.description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-neutral-50 text-brand-neutral-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          {dict.nav.skipToContent}
        </a>
        <SiteHeader dict={dict} locale={locale} />
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter dict={dict} />
      </body>
    </html>
  );
}
