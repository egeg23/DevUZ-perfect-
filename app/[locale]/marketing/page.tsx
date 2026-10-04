import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingCalculator } from "@/components/marketing/marketing-calculator";
import { ContactSection } from "@/components/sections/contact";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDictionary } from "@/content/dictionaries";
import { MARKETING_PATH, channels, marketingCopy, projects } from "@/content/marketing";
import { isLocale, localeHref, t, type Locale } from "@/lib/i18n";
import { articleHref, isArticleLocale, listArticles, type MarketingArticle } from "@/lib/marketing/articles-store";
import { priceText } from "@/lib/marketing/estimate";
import { breadcrumbSchema, faqSchema, jsonLdGraph } from "@/lib/schema";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

/**
 * Раздел «Маркетинг»: предложение, калькулятор, цены, вопросы и статьи.
 *
 * Страница на всех шести языках, статьи под ней — только на русском и
 * узбекском (см. lib/marketing/articles-store.ts). Статьи приходят из базы
 * два раза в день, поэтому страница пересобирается сама раз в десять минут,
 * даже если сброс кэша из свипа не дойдёт.
 */
export const revalidate = 600;

/** Сколько статей показывать карточками; остальные — списком ссылок. */
const CARDS = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = marketingCopy[locale];
  return buildMetadata({
    locale,
    path: MARKETING_PATH,
    title: copy.seoTitle,
    description: copy.seoDescription,
  });
}

function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = marketingCopy[locale];
  const dict = getDictionary(locale);
  const articles = isArticleLocale(locale) ? await listArticles(locale) : [];

  const smm = channels.find((c) => c.id === "smm");
  const target = channels.find((c) => c.id === "target");
  const faq = copy.faq.map((item) => ({
    q: item.q,
    a: item.a
      .replace("{smm}", smm ? priceText(smm.monthly, locale) : "")
      .replace("{target}", target ? priceText(target.monthly, locale) : ""),
  }));

  const pageUrl = absoluteUrl(`${locale}/${MARKETING_PATH}`);
  const service = {
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: copy.kicker,
    description: copy.seoDescription,
    serviceType: "Digital marketing",
    provider: { "@id": absoluteUrl("#organization") },
    areaServed: { "@type": "Country", name: "Uzbekistan" },
    url: pageUrl,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: copy.servicesTitle,
      itemListElement: [...channels, ...projects].map((item) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: t(item.title, locale), description: t(item.note, locale) },
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "UZS",
          ...("monthly" in item
            ? { minPrice: item.monthly, unitText: "MON" }
            : { minPrice: item.price, ...(item.perHour ? { unitText: "HUR" } : {}) }),
        },
      })),
    },
  };

  return (
    <>
      {/* ── Первый экран ─────────────────────────────────────────────────── */}
      <Container className="pb-16 pt-36">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}
          {copy.kicker}
        </p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.06]">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">{copy.lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#calculator"
            className="rounded-xl bg-green px-5 py-3 font-semibold text-ink transition-colors hover:bg-white"
          >
            {copy.ctaCalc}
          </a>
          <Link
            href={localeHref(locale, "contact")}
            className="rounded-xl border border-line px-5 py-3 font-semibold transition-colors hover:border-green hover:text-green"
          >
            {copy.ctaDiscuss}
          </Link>
        </div>

        {/* ── Предложение: сайт + маркетинг ─────────────────────────────── */}
        <Reveal className="mt-14">
          <div className="rounded-2xl border border-green/40 bg-gradient-to-br from-green/[0.12] to-surface p-6 md:p-10">
            <p className="inline-block rounded-full border border-green/40 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-green">
              {copy.utp.badge}
            </p>
            <h2 className="mt-5 max-w-3xl text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight">
              {copy.utp.title}
            </h2>
            <p className="mt-4 max-w-3xl text-[1rem] leading-relaxed text-muted">{copy.utp.text}</p>
            <p className="mt-4 max-w-3xl text-[0.82rem] leading-relaxed text-faint">{copy.utp.fine}</p>
          </div>
        </Reveal>
      </Container>

      {/* ── Почему у нас ─────────────────────────────────────────────────── */}
      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.kicker} title={copy.whyTitle} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.why.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="h-full rounded-2xl border border-line bg-surface p-6">
                  <h3 className="text-[1.05rem] font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Калькулятор ──────────────────────────────────────────────────── */}
      <section id="calculator" className="border-t border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.calc.kicker} title={copy.calc.title} description={copy.calc.lead} />
          <Reveal className="mt-12">
            <MarketingCalculator locale={locale} copy={copy} />
          </Reveal>
        </Container>
      </section>

      {/* ── Услуги и цены ────────────────────────────────────────────────── */}
      <section id="prices" className="border-t border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.kicker} title={copy.servicesTitle} description={copy.servicesLead} />

          <div className="mt-12 overflow-hidden rounded-2xl border border-line">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="grid grid-cols-2 gap-3 border-b border-line bg-surface px-5 py-5 last:border-b-0 md:grid-cols-[1fr_11rem_11rem] md:items-center md:px-6"
              >
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-[1rem] font-semibold">{t(channel.title, locale)}</h3>
                  <p className="mt-1 text-[0.84rem] leading-snug text-muted">{t(channel.note, locale)}</p>
                  {channel.ads ? (
                    <p className="mt-1 text-[0.78rem] text-faint">{copy.plusCommission}</p>
                  ) : null}
                </div>
                <dl className="contents">
                  <div>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">{copy.monthlyCol}</dt>
                    <dd className="mt-1 font-mono text-[0.9rem] text-green">
                      {channel.from ? `${copy.from} ` : ""}
                      {priceText(channel.monthly, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">{copy.firstCol}</dt>
                    <dd className="mt-1 font-mono text-[0.9rem]">{priceText(channel.first, locale)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <h3 className="mt-14 text-[1.4rem] font-bold">{copy.projectsTitle}</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-line bg-surface p-5">
                <h4 className="font-semibold">{t(project.title, locale)}</h4>
                <p className="mt-1.5 text-[0.84rem] leading-snug text-muted">{t(project.note, locale)}</p>
                <p className="mt-3 font-mono text-[0.88rem] text-green">
                  {project.from ? `${copy.from} ` : ""}
                  {priceText(project.price, locale)}
                  {project.perHour ? ` ${copy.perHour}` : ""}
                </p>
                {project.perHour ? null : (
                  <p className="mt-1 font-mono text-[0.72rem] text-faint">{t(project.term, locale)}</p>
                )}
              </div>
            ))}
          </div>

          <ul className="mt-8 space-y-2 text-[0.9rem] text-muted">
            {copy.budgetBased.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden="true" className="text-green">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-[0.8rem] leading-relaxed text-faint">{copy.vatNote}</p>
        </Container>
      </section>

      {/* ── Как начинаем ─────────────────────────────────────────────────── */}
      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.kicker} title={copy.processTitle} />
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {copy.process.map((step, i) => (
              <li key={step.when} className="rounded-2xl border border-line bg-surface p-5">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-green">
                  {String(i + 1).padStart(2, "0")} · {step.when}
                </p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-muted">{step.what}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── Вопросы ──────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-line py-20 md:py-28">
        <Container>
          <SectionHeading kicker={copy.kicker} title={copy.faqTitle} />
          <div className="mt-10 max-w-3xl">
            {faq.map((item) => (
              <details key={item.q} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[1.02rem] font-medium marker:hidden">
                  <span className="flex-1">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-green transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-[0.94rem] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Статьи ───────────────────────────────────────────────────────── */}
      {isArticleLocale(locale) && articles.length ? (
        <ArticlesBlock locale={locale} articles={articles} title={copy.articlesTitle} lead={copy.articlesLead} readMore={copy.readMore} kicker={copy.kicker} />
      ) : null}

      <ContactSection locale={locale} dict={dict} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            service,
            faqSchema(faq),
            breadcrumbSchema([
              { name: copy.home, path: locale },
              { name: copy.kicker, path: `${locale}/${MARKETING_PATH}` },
            ]),
          ),
        }}
      />
    </>
  );
}

function ArticlesBlock({
  locale,
  articles,
  title,
  lead,
  readMore,
  kicker,
}: {
  locale: "ru" | "uz";
  articles: MarketingArticle[];
  title: string;
  lead: string;
  readMore: string;
  kicker: string;
}) {
  const cards = articles.slice(0, CARDS);
  const rest = articles.slice(CARDS);
  return (
    <section id="articles" className="border-t border-line py-20 md:py-28">
      <Container>
        <SectionHeading kicker={kicker} title={title} description={lead} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((article) => (
            <article key={article.slug} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-faint">
                <time dateTime={article.publishedAt}>{day(article.publishedAt)}</time>
              </p>
              <h3 className="mt-3 text-[1.02rem] font-semibold leading-snug">
                <Link href={articleHref(locale, article.slug)} className="transition-colors hover:text-green">
                  {article.text.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-muted">{article.text.description}</p>
              <Link
                href={articleHref(locale, article.slug)}
                className="mt-4 text-[0.84rem] text-green underline underline-offset-4 transition-colors hover:text-white"
                aria-label={`${readMore}: ${article.text.title}`}
              >
                {readMore} →
              </Link>
            </article>
          ))}
        </div>
        {rest.length ? (
          <ul className="mt-10 grid gap-x-8 gap-y-2 md:grid-cols-2">
            {rest.map((article) => (
              <li key={article.slug}>
                <Link
                  href={articleHref(locale, article.slug)}
                  className="text-[0.88rem] text-muted transition-colors hover:text-green"
                >
                  {article.text.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}
