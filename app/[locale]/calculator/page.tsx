import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PriceCalculator } from "@/components/calculator/price-calculator";
import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
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
    path: "calculator",
    title: dict.calculator.title,
    description: dict.calculator.description,
  });
}

export default async function CalculatorPage({
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
      <Container className="pb-24 pt-36">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}{dict.calculator.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.06]">
          {dict.calculator.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">
          {dict.calculator.description}
        </p>

        <div className="mt-14">
          <PriceCalculator locale={locale} dict={dict} />
        </div>
      </Container>

      <ContactSection locale={locale} dict={dict} />
    </>
  );
}
