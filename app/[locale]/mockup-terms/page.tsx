import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocument } from "@/components/legal/document";
import { MOCKUP_TERMS_PATH, mockupTerms } from "@/content/mockup-terms";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const doc = mockupTerms[locale];

  return buildMetadata({
    locale,
    path: MOCKUP_TERMS_PATH,
    title: doc.title,
    description: doc.intro.slice(0, 160),
  });
}

export default async function MockupTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return <LegalDocument doc={mockupTerms[locale]} locale={locale} />;
}
