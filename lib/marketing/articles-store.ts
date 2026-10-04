import type { Locale } from "@/lib/i18n";
import { serviceClient } from "@/lib/supabase";
import type { MarketingTopicKind } from "@/content/marketing-topics";

/**
 * Статьи о маркетинге из базы (`marketing_articles`, миграция 0081).
 *
 * Пишутся на русском и узбекском: это языки, на которых в Узбекистане ищут
 * маркетинг, и на них же написаны разборы. На остальных языках страница
 * «Маркетинг» есть, а блока статей на ней нет — перевод статьи на английский
 * без своего читателя только размножил бы похожие страницы в поиске.
 *
 * База недоступна — пустой список, а не ошибка: страница «Маркетинг»
 * должна открываться и без статей.
 */

export const ARTICLE_LOCALES = ["ru", "uz"] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

export function isArticleLocale(locale: Locale | string): locale is ArticleLocale {
  return (ARTICLE_LOCALES as readonly string[]).includes(locale);
}

export type ArticleText = {
  title: string;
  description: string;
  paragraphs: string[];
  tips: string[];
};

export type MarketingArticle = {
  slug: string;
  kind: MarketingTopicKind;
  topicKey: string;
  sourceUrl: string | null;
  publishedAt: string;
  text: ArticleText;
};

/** Путь статьи без домена. */
export function articleHref(locale: ArticleLocale, slug?: string): string {
  return slug ? `/${locale}/marketing/articles/${slug}` : `/${locale}/marketing#articles`;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];

export function parseText(value: unknown): ArticleText | null {
  const raw = (value ?? {}) as Record<string, unknown>;
  const text: ArticleText = {
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    paragraphs: strings(raw.paragraphs),
    tips: strings(raw.tips),
  };
  return text.title && text.paragraphs.length ? text : null;
}

type Row = {
  slug: string;
  kind: MarketingTopicKind;
  topic_key: string;
  source_url: string | null;
  published_at: string;
  ru: unknown;
  uz: unknown;
};

const COLUMNS = "slug, kind, topic_key, source_url, published_at, ru, uz";

function toArticle(row: Row, locale: ArticleLocale): MarketingArticle | null {
  const text = parseText(row[locale]);
  if (!text) return null;
  return {
    slug: row.slug,
    kind: row.kind,
    topicKey: row.topic_key,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    text,
  };
}

/** Опубликованные статьи, свежие первыми. */
export async function listArticles(locale: ArticleLocale, limit = 500): Promise<MarketingArticle[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("marketing_articles")
    .select(COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Row[]).map((row) => toArticle(row, locale)).filter((a): a is MarketingArticle => a !== null);
}

export async function articleBySlug(locale: ArticleLocale, slug: string): Promise<MarketingArticle | null> {
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return null;
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("marketing_articles")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return toArticle(data as Row, locale);
}

/** Темы, по которым статья уже есть — и опубликованная, и снятая. */
export async function writtenTopics(): Promise<Set<string> | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.from("marketing_articles").select("topic_key");
  if (error) return null;
  return new Set((data ?? []).map((row) => String(row.topic_key)));
}

export async function saveArticle(input: {
  topicKey: string;
  kind: MarketingTopicKind;
  slug: string;
  ru: ArticleText;
  uz: ArticleText;
  sourceUrl: string | null;
  model: string;
}): Promise<string | null> {
  const db = serviceClient();
  if (!db) return "база недоступна";
  const { error } = await db.from("marketing_articles").insert({
    topic_key: input.topicKey,
    kind: input.kind,
    slug: input.slug,
    ru: input.ru,
    uz: input.uz,
    source_url: input.sourceUrl,
    model: input.model,
  });
  return error ? error.message : null;
}
