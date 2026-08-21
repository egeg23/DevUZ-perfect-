import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return buildMetadata({
    locale,
    path: "contact",
    title: dict.nav.contacts,
    description: dict.contact.description,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  // Заголовок первого уровня живёт в секции контактов, поэтому здесь только
  // отступ под шапку — дублировать h1 на странице нельзя.
  return (
    <div className="pt-20">
      <ContactSection locale={locale} dict={dict} />
    </div>
  );
}
