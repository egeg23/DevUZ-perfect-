import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { hreflang, isLocale, locales, t, type Locale } from "@/lib/i18n";
import { jsonLdGraph, organizationSchema, websiteSchema } from "@/lib/schema";
import { siteUrl } from "@/lib/seo";

// Шрифты самохостятся Next'ом: ни одного обращения к fonts.googleapis.com
// в рантайме, поэтому нет ни лишнего DNS-резолва, ни риска CLS от подмены.
const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#05070B",
  colorScheme: "dark",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${company.name} — ${t(company.tagline, locale)}`,
      template: `%s — ${company.name}`,
    },
    description: t(company.description, locale),
    applicationName: company.name,
    authors: [{ name: company.name, url: siteUrl }],
    creator: company.name,
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  return (
    <html lang={hreflang[locale]} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-green focus:px-4 focus:py-2 focus:text-ink"
        >
          {dict.skipToContent}
        </a>
        <Header locale={locale} dict={dict} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} />
        <script
          type="application/ld+json"
          // Разметка собрана на сервере из наших же данных — внешнего ввода
          // здесь нет, поэтому вставка безопасна.
          dangerouslySetInnerHTML={{
            __html: jsonLdGraph(organizationSchema(locale), websiteSchema(locale)),
          }}
        />
      </body>
    </html>
  );
}
