import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GlassHome } from "@/components/home/glass-home";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { faqSchema, jsonLdGraph } from "@/lib/schema";
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
    title: dict.seo.home.title,
    description: dict.seo.home.description,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  // Главная «Стекло» (владелец, 06.11.2026: «Давай начнем с главной»): первый
  // экран с ИИ-сотрудником, «Делали для», работы, продукты, прототип за 12
  // часов с заявкой и вопросы. Прежние блоки главной живут на своих
  // страницах: услуги, калькулятор, маркетинг, кейсы, DevUz Box.
  return (
    <>
      <GlassHome locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(dict.faq.items)) }}
      />
    </>
  );
}
