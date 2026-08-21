import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseCard } from "@/components/sections/cases";
import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cases } from "@/content/cases";
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
    path: "cases",
    title: dict.cases.title,
    description: dict.cases.description,
  });
}

export default async function CasesPage({
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
      <Container className="pb-20 pt-36">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}{dict.cases.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.06]">
          {dict.cases.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">
          {dict.cases.description}
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item, i) => (
            <Reveal key={item.slug} delay={i * 60} className="h-full">
              <CaseCard item={item} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </div>
      </Container>

      <ContactSection locale={locale} dict={dict} />
    </>
  );
}
