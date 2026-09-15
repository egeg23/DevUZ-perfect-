import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { razborCopy } from "@/content/razbor/page-copy";
import { razborBySlug, razbors, siblings } from "@/content/razbor/items";
import { isLocale } from "@/lib/i18n";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { isRazborLocale, localeHref } from "@/lib/razbor/routing";
import { serviceFor } from "@/lib/razbor/service-link";

export const dynamicParams = false;

export function generateStaticParams() {
  return razbors.map((item) => ({ locale: item.locale, slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isRazborLocale(locale)) return {};
  const item = razborBySlug(locale, slug);
  if (!item) return {};

  return buildMetadata({
    locale,
    path: `razbor/${slug}`,
    title: item.title,
    description: item.description,
  });
}

function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function RazborPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw) || !isRazborLocale(raw)) notFound();
  const locale = raw;
  const item = razborBySlug(locale, slug);
  if (!item) notFound();

  const copy = razborCopy[locale];
  const near = siblings(item);
  const service = serviceFor(item.niche);

  return (
    <Container className="pb-24 pt-36">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
        {"// "}{item.label}
      </p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {item.title}
      </h1>

      <div className="mt-10 max-w-3xl space-y-4 text-lg leading-relaxed text-muted">
        {item.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {/* ── Как есть ─────────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {copy.before}
        </h2>
        <Shot
          desktop={item.shots.beforeDesktop}
          mobile={item.shots.beforeMobile}
          alt={`${copy.before}: ${item.label}`}
        />
        <p className="mt-3 text-xs text-faint">
          {copy.shotOn} {day(item.shotTakenAt)}
        </p>
      </section>

      {/* ── Находки ──────────────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">{copy.whatBreaks}</h2>
        <div className="mt-6 flex flex-col gap-6">
          {item.findings.map((finding) => (
            <article key={finding.title} className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="text-lg font-semibold leading-snug">{finding.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="text-faint">{copy.whatItCosts}. </span>
                {finding.impact}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <span className="text-green">{copy.howWeFix}. </span>
                {finding.fix}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Как сделали бы мы ────────────────────────────────────────── */}
      <section className="mt-14">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-green">
          {copy.after}
        </h2>
        <Shot
          desktop={item.shots.afterDesktop}
          mobile={item.shots.afterMobile}
          alt={`${copy.after}: ${item.label}`}
        />
      </section>

      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">{copy.outcome}</h2>
        <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted">
          {item.outcome.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mt-10 max-w-3xl rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
          {copy.price}
        </h2>
        <p className="mt-2 text-lg leading-relaxed">{item.price}</p>
        {/* Ссылка на профильную услугу — единственная продающая ссылка
            внутри статьи. Стоит у цены, а не в конце: человек, дочитавший
            до суммы, уже прикидывает бюджет, и именно здесь ему нужен
            переход, а не ещё один призыв проверить свой сайт. */}
        <Link
          href={`/${locale}/services/${service}`}
          className="mt-4 inline-block text-sm text-green underline underline-offset-4 transition-colors hover:text-white"
        >
          {copy.serviceLink}
        </Link>
      </section>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-faint">{copy.anonymous}</p>

      <section className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-green/30 bg-green/5 px-6 py-5">
        <p className="flex-1 text-lg font-semibold">{copy.cta}</p>
        <Link
          href={`/${locale}/audit`}
          className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
        >
          {copy.ctaButton}
        </Link>
      </section>

      {near.length ? (
        <section className="mt-14">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            {copy.more}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {near.map((other) => (
              <li key={other.slug}>
                <Link
                  href={localeHref(locale, other.slug)}
                  className="text-sm text-muted transition-colors hover:text-green"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Хлебные крошки отдельным блоком, а не полем внутри Article:
          Google читает BreadcrumbList как самостоятельную сущность и
          показывает путь вместо голого адреса в строке результата. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: copy.title,
                item: `${siteUrl}${localeHref(locale)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: item.title,
                item: `${siteUrl}${localeHref(locale, item.slug)}`,
              },
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: item.description,
            datePublished: item.publishedAt,
            inLanguage: locale,
            author: { "@type": "Organization", name: "DevUz Studio", url: siteUrl },
            publisher: { "@type": "Organization", name: "DevUz Studio", url: siteUrl },
            image: [`${siteUrl}${item.shots.beforeDesktop}`, `${siteUrl}${item.shots.afterDesktop}`],
            mainEntityOfPage: `${siteUrl}${localeHref(locale, item.slug)}`,
          }),
        }}
      />
    </Container>
  );
}

/**
 * Пара снимков: широкий и телефонный.
 *
 * Размеры проставлены явно — без них страница дёргается при загрузке, и
 * это видит Google в метрике сдвига макета. Телефонный снимок не
 * декоративный: почти в каждом разборе есть находка про телефон, и без
 * него сравнение «было — стало» её не показывает.
 */
function Shot({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
      <Image
        src={desktop}
        alt={alt}
        width={1440}
        height={900}
        className="w-full rounded-xl border border-line"
      />
      <Image
        src={mobile}
        alt={`${alt} — ${"390"}px`}
        width={390}
        height={844}
        className="mx-auto w-40 rounded-xl border border-line sm:w-32"
      />
    </div>
  );
}
