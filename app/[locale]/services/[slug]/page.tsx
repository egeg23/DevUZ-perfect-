import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { getDictionary } from "@/content/dictionaries";
import { serviceBySlug, services } from "@/content/services";
import { isLocale, locales, localeHref, t, tList, type Locale } from "@/lib/i18n";
import { breadcrumbSchema, jsonLdGraph, serviceSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    services.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = serviceBySlug(slug);
  if (!isLocale(locale) || !service) return {};

  return buildMetadata({
    locale,
    path: `services/${slug}`,
    title: t(service.seoTitle, locale),
    description: t(service.seoDescription, locale),
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const service = serviceBySlug(slug);
  // Локаль неизвестна — это действительно «страницы нет».
  if (!isLocale(raw)) notFound();
  if (!service) {
    // А вот несуществующий slug при живой локали — почти всегда
    // устаревшая ссылка на переименованный или снятый материал.
    // Ведём человека в раздел на его языке: notFound() здесь
    // отрисоваться не может — html и body рисует layout внутри
    // [locale], и Next подставляет вместо страницы собственную
    // английскую заглушку без языка и без шапки.
    redirect(localeHref(raw as Locale, "services"));
  }
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  const others = services.filter((s) => s.slug !== slug);

  return (
    <>
      <Container className="pt-36">
        <nav aria-label="breadcrumb" className="font-mono text-[0.72rem] text-faint">
          <Link href={localeHref(locale, "services")} className="hover:text-green">
            {dict.nav.services}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-muted">{t(service.title, locale)}</span>
        </nav>

        <div className="mt-8 flex items-start gap-5">
          <span className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green/25 bg-green/10 text-green">
            <Icon name={service.icon} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-[clamp(2rem,4.6vw,3.3rem)] font-extrabold leading-[1.06]">
              {t(service.title, locale)}
            </h1>
            <p className="mt-3 text-[1.05rem] text-green">{t(service.tagline, locale)}</p>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-[1.02rem] leading-relaxed text-muted">
          {t(service.description, locale)}
        </p>

        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 rounded-2xl border border-line bg-surface px-7 py-6">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">
              {dict.services.from}
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold text-green">
              ${service.priceFromUsd.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">
              {dict.services.weeks}
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold">
              {service.weeksFrom}–{service.weeksTo}
            </p>
          </div>
          <div className="min-w-[14rem] flex-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-faint">
              {dict.services.stack}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {service.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-line px-2 py-1 font-mono text-[0.65rem] text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-16 text-2xl font-bold">{dict.services.included}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {tList(service.bullets, locale).map((bullet, i) => (
            <Reveal as="li" key={bullet} delay={i * 60}>
              <div className="flex gap-3 rounded-xl border border-line bg-surface px-5 py-4">
                <span aria-hidden="true" className="mt-0.5 text-green">
                  ✓
                </span>
                <span className="text-[0.94rem] leading-relaxed text-muted">{bullet}</span>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="mt-16 flex flex-wrap gap-2 border-t border-line pt-8">
          {others.map((other) => (
            <Link
              key={other.slug}
              href={localeHref(locale, `services/${other.slug}`)}
              className="rounded-xl border border-line px-4 py-2.5 text-[0.88rem] text-muted transition-colors hover:border-green/40 hover:text-text"
            >
              {t(other.title, locale)}
            </Link>
          ))}
        </div>
      </Container>

      <ContactSection locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            serviceSchema(service, locale),
            breadcrumbSchema([
              { name: dict.nav.services, path: `${locale}/services` },
              { name: t(service.title, locale), path: `${locale}/services/${slug}` },
            ]),
          ),
        }}
      />
    </>
  );
}
