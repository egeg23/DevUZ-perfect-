import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { caseBySlug, cases } from "@/content/cases";
import { getDictionary } from "@/content/dictionaries";
import { isLocale, locales, localeHref, t, type Locale } from "@/lib/i18n";
import { breadcrumbSchema, caseSchema, jsonLdGraph } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((locale) => cases.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = caseBySlug(slug);
  if (!isLocale(locale) || !item) return {};

  return buildMetadata({
    locale,
    path: `cases/${slug}`,
    title: `${item.name} — ${t(item.category, locale)}`,
    description: t(item.summary, locale),
  });
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const item = caseBySlug(slug);
  // Локаль неизвестна — это действительно «страницы нет».
  if (!isLocale(raw)) notFound();
  if (!item) {
    // А вот несуществующий slug при живой локали — почти всегда
    // устаревшая ссылка на переименованный или снятый материал.
    // Ведём человека в раздел на его языке: notFound() здесь
    // отрисоваться не может — html и body рисует layout внутри
    // [locale], и Next подставляет вместо страницы собственную
    // английскую заглушку без языка и без шапки.
    redirect(localeHref(raw as Locale, "cases"));
  }
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  const next = cases[(cases.findIndex((c) => c.slug === slug) + 1) % cases.length];

  return (
    <>
      <Container className="pt-36">
        <nav aria-label="breadcrumb" className="font-mono text-[0.72rem] text-faint">
          <Link href={localeHref(locale, "cases")} className="hover:text-green">
            {dict.nav.cases}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-muted">{item.name}</span>
        </nav>

        <span className="mt-8 inline-block rounded-md border border-line px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-green">
          {t(item.category, locale)}
        </span>

        <h1 className="mt-5 text-[clamp(2.2rem,5.4vw,3.8rem)] font-extrabold leading-[1.04]">
          {item.name}
        </h1>
        <p className="mt-5 max-w-2xl text-[1.12rem] leading-relaxed text-muted">
          {t(item.summary, locale)}
        </p>

        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green px-5 py-3 font-semibold text-ink transition-colors hover:bg-white"
          >
            {dict.cases.liveSite}
            <span aria-hidden="true">↗</span>
          </a>
        ) : null}

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {item.metrics.map((metric, i) => (
            <Reveal key={metric.value} delay={i * 70}>
              <div className="rounded-2xl border border-line bg-surface px-6 py-6">
                <p className="font-display text-3xl font-extrabold leading-none text-green">
                  {metric.value}
                </p>
                <p className="mt-3 text-[0.83rem] leading-snug text-muted">
                  {t(metric.label, locale)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold">{dict.cases.challenge}</h2>
            <p className="mt-5 whitespace-pre-line text-[1rem] leading-[1.75] text-muted">
              {t(item.description, locale)}
            </p>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-faint">
              {dict.cases.tech}
            </h2>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[0.7rem] text-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="mt-6 border-t border-line pt-5 font-mono text-[0.72rem] text-faint">
              {dict.cases.year}: {item.year}
            </p>
          </aside>
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <Link
            href={localeHref(locale, `cases/${next.slug}`)}
            className="group inline-flex items-center gap-3 text-[1.05rem]"
          >
            <span className="text-faint">{dict.cta.readMore}:</span>
            <span className="font-semibold text-green">{next.name}</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </Container>

      <ContactSection locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            caseSchema(item, locale),
            breadcrumbSchema([
              { name: dict.nav.cases, path: `${locale}/cases` },
              { name: item.name, path: `${locale}/cases/${slug}` },
            ]),
          ),
        }}
      />
    </>
  );
}
