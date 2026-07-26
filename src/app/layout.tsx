import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { clientEnv } from "@/lib/env/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
    // No og:image yet — no branded 1200x630 asset exists in this repo
    // (see docs/OPEN_RISKS.md). Title + description alone is a real
    // improvement over an unstyled raw-link preview when shared (e.g. via
    // WhatsApp, common in the DACH market) and doesn't invent visual assets.
    openGraph: {
      title,
      description: dict.home.description,
      url: "/",
      siteName: dict.brand.name,
      locale: locale === "de" ? "de_CH" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
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
        <SiteHeader dict={dict} locale={locale} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter dict={dict} />
      </body>
    </html>
  );
}
