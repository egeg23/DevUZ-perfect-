import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteAudit } from "@/components/audit/site-audit";
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
    path: "audit",
    title: dict.seo.audit.title,
    description: dict.seo.audit.description,
  });
}

export default async function AuditPage({
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
        <h1 className="max-w-3xl text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.1]">
          {dict.audit.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{dict.audit.lead}</p>

        <div className="mt-12">
          <SiteAudit dict={dict} />
        </div>
      </Container>

      <ContactSection dict={dict} locale={locale} />
    </>
  );
}
