import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { ServicesSection } from "@/components/sections/services";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/content/dictionaries";
import { services } from "@/content/services";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { jsonLdGraph, serviceSchema } from "@/lib/schema";
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
    path: "services",
    title: dict.seo.services.title,
    description: dict.seo.services.description,
  });
}

export default async function ServicesPage({
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
      <Container className="pt-36">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}{dict.services.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.06]">
          {dict.services.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">
          {dict.services.description}
        </p>
      </Container>

      <ServicesSection locale={locale} dict={dict} />
      <ContactSection locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(...services.map((s) => serviceSchema(s, locale))),
        }}
      />
    </>
  );
}
