import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { MARKETING_PATH, marketingCopy } from "@/content/marketing";
import { isLocale } from "@/lib/i18n";
import {
  ARTICLE_LOCALES,
  articleBySlug,
  articleHref,
  isArticleLocale,
  listArticles,
} from "@/lib/marketing/articles-store";
import { breadcrumbSchema, jsonLdGraph } from "@/lib/schema";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

/**
 * Статья о маркетинге: /{ru|uz}/marketing/articles/{адрес}.
 *
 * Статьи выходят из свипа без выкатки, поэтому адреса, известные на сборке,
 * собираются заранее, а новые открываются по первому запросу; `revalidate`
 * обновляет страницу сама, если сброс кэша не дошёл.
 *
 * На других языках статьи нет — переключатель языка ведёт оттуда на
 * страницу «Маркетинг» этого языка, а не на 404.
 */
export const revalidate = 600;

export async function generateStaticParams() {
  const lists = await Promise.all(
    ARTICLE_LOCALES.map(async (locale) =>
      (await listArticles(locale)).map((article) => ({ locale: locale as string, slug: article.slug })),
    ),
  );
  return lists.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isArticleLocale(locale)) return {};
  const article = await articleBySlug(locale, slug);
  if (!article) return {};

  const path = `${MARKETING_PATH}/articles/${slug}`;
  return buildMetadata({
    locale,
    path,
    title: `${article.text.title} — DevUz Studio`,
    description: article.text.description,
    // Статья есть ровно на двух языках и под одним адресом.
    alternates: { ru: path, uz: path },
  });
}

function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function MarketingArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (isLocale(raw) && !isArticleLocale(raw)) redirect(`/${raw}/${MARKETING_PATH}`);
  if (!isLocale(raw) || !isArticleLocale(raw)) notFound();
  const locale = raw;
  const article = await articleBySlug(locale, slug);
  if (!article) notFound();

  const copy = marketingCopy[locale];
  const others = (await listArticles(locale, 7)).filter((a) => a.slug !== article.slug).slice(0, 6);
  const url = absoluteUrl(articleHref(locale, article.slug));

  return (
    <Container className="pb-24 pt-36">
      <nav aria-label="breadcrumb" className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
        <Link href={`/${locale}`} className="transition-colors hover:text-green">
          {copy.home}
        </Link>
        {" / "}
        <Link href={`/${locale}/${MARKETING_PATH}`} className="transition-colors hover:text-green">
          {copy.kicker}
        </Link>
      </nav>

      <article className="mt-8 max-w-3xl">
        <h1 className="text-[clamp(2rem,4.4vw,3rem)] font-bold leading-[1.1]">{article.text.title}</h1>
        <p className="mt-4 font-mono text-[0.72rem] text-faint">
          <time dateTime={article.publishedAt}>{day(article.publishedAt)}</time>
        </p>

        <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-muted">
          {article.text.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {article.text.tips.length ? (
          <section className="mt-10 rounded-2xl border border-line bg-surface px-6 py-5">
            <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-green">{copy.tipsTitle}</h2>
            <ul className="mt-4 space-y-2.5">
              {article.text.tips.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-[0.95rem] leading-snug text-muted">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-green">
                    ✓
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {article.sourceUrl ? (
          <p className="mt-6 text-[0.8rem] text-faint">
            {copy.sourceLabel}:{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-4 transition-colors hover:text-green"
            >
              Wikipedia
            </a>
          </p>
        ) : null}
      </article>

      <section className="mt-12 max-w-3xl rounded-2xl border border-green/30 bg-green/5 px-6 py-6">
        <p className="inline-block rounded-full border border-green/40 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-green">
          {copy.utp.badge}
        </p>
        <h2 className="mt-4 text-[1.3rem] font-semibold leading-snug">{copy.articleCtaTitle}</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{copy.utp.title}. {copy.articleCtaText}</p>
        <Link
          href={`/${locale}/${MARKETING_PATH}#calculator`}
          className="mt-5 inline-block rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
        >
          {copy.articleCtaButton}
        </Link>
      </section>

      {others.length ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">{copy.articlesTitle}</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={articleHref(locale, other.slug)} className="text-sm text-muted transition-colors hover:text-green">
                  {other.text.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={articleHref(locale)}
            className="mt-5 inline-block text-sm text-green underline underline-offset-4 transition-colors hover:text-white"
          >
            {copy.allArticles}
          </Link>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            {
              "@type": "Article",
              headline: article.text.title,
              description: article.text.description,
              datePublished: article.publishedAt,
              inLanguage: locale,
              author: { "@id": absoluteUrl("#organization") },
              publisher: { "@id": absoluteUrl("#organization") },
              mainEntityOfPage: url,
              ...(article.sourceUrl ? { citation: article.sourceUrl } : {}),
            },
            breadcrumbSchema([
              { name: copy.home, path: locale },
              { name: copy.kicker, path: `${locale}/${MARKETING_PATH}` },
              { name: article.text.title, path: articleHref(locale, article.slug) },
            ]),
          ),
        }}
      />
    </Container>
  );
}
