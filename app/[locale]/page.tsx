import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompileScene } from "@/components/hero/compile-scene";
import { CalculatorSection } from "@/components/sections/calculator";
import { CasesSection } from "@/components/sections/cases";
import { ContactSection } from "@/components/sections/contact";
import { DevuzShowcase } from "@/components/sections/devuz-showcase";
import { FaqSection } from "@/components/sections/faq";
import { ProcessSection } from "@/components/sections/process";
import { ServicesSection } from "@/components/sections/services";
import { StackSection } from "@/components/sections/stack";
import { company } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { faqSchema, jsonLdGraph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return buildMetadata({
    locale,
    title: `${company.name} — ${t(company.tagline, locale)}`,
    description: t(company.description, locale),
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

  return (
    <>
      <CompileScene locale={locale} dict={dict} />
      <ServicesSection locale={locale} dict={dict} />
      <CalculatorSection locale={locale} dict={dict} />
      <DevuzShowcase locale={locale} dict={dict} />
      <CasesSection locale={locale} dict={dict} />
      <ProcessSection dict={dict} />
      <StackSection dict={dict} />
      <FaqSection dict={dict} />
      <ContactSection locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(faqSchema(dict.faq.items)) }}
      />
    </>
  );
}
