import { createHash } from "node:crypto";

import type { RazborFinding, RazborItem } from "@/content/razbor/items";
import { razborBySlug as staticBySlug, razborsFor as staticFor } from "@/content/razbor/items";
import type { RazborLocale } from "@/lib/razbor/model";
import { serviceClient } from "@/lib/supabase";

/**
 * Разборы из базы.
 *
 * Таблица `razbors` описана в 0021 и с тех пор не использовалась ни одной
 * строкой кода: страницы читали пустой массив из `content/razbor/items.ts`,
 * а ночная задача, которая должна была его наполнять, работать не могла.
 * Отсюда раздел, пустой с самого начала.
 *
 * Теперь источников два, и это осознанно. База — для того, что пишет
 * ночная смена: статья выходит без выкатки, а до публикации её читает
 * человек. Файл остаётся запасным путём: если базы нет, раздел показывает
 * то, что лежит в репозитории, а не пятисотую ошибку.
 *
 * Одна строка базы — это ДВА разбора, русский и узбекский. Они не перевод
 * друг друга: по-русски ищут «интернет-магазин под ключ Ташкент», а
 * по-узбекски «internet do'kon yaratish narxi», и это разные страницы под
 * разные запросы. Связаны они только полем `alt` — для hreflang.
 */

/** Структура статьи: то, что страница показывает блоками, а не сплошняком. */
export type RazborArticle = {
  title: string;
  description: string;
  label: string;
  query: string;
  intro: string[];
  findings: RazborFinding[];
  outcome: string[];
  price: string;
};

const OTHER: Record<RazborLocale, RazborLocale> = { ru: "uz", uz: "ru" };

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : [];

const findings = (value: unknown): RazborFinding[] =>
  Array.isArray(value)
    ? value
        .map((f) => f as { title?: unknown; impact?: unknown; fix?: unknown })
        .map((f) => ({ title: String(f.title ?? ""), impact: String(f.impact ?? ""), fix: String(f.fix ?? "") }))
        .filter((f) => f.title)
    : [];

/**
 * Полоса потерь из базы.
 *
 * Пара чисел или ничего. Одно число, три числа, строки вместо чисел — это
 * не «почти пара», а испорченная запись: показать из неё половину значило бы
 * поставить на страницу цифру, которой никто не считал.
 */
export function lostBand(value: unknown): readonly [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lo, hi] = value.map(Number);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  return [lo, hi];
}

export function toItem(row: Record<string, unknown>, locale: RazborLocale): RazborItem | null {
  const article = row[`article_${locale}`] as Record<string, unknown> | null;
  const slug = String(row[`slug_${locale}`] ?? "");
  if (!article || !slug) return null;

  const otherSlug = String(row[`slug_${OTHER[locale]}`] ?? "");

  return {
    slug,
    locale,
    alt: otherSlug ? { locale: OTHER[locale], slug: otherSlug } : null,
    niche: String(row.category ?? ""),
    city: String(row.city ?? ""),
    publishedAt: String(row.published_at ?? row.created_at ?? "").slice(0, 10),
    shotTakenAt: String(row.shot_taken_at ?? row.created_at ?? "").slice(0, 10),
    title: String(article.title ?? row[`title_${locale}`] ?? ""),
    description: String(article.description ?? row[`description_${locale}`] ?? ""),
    label: String(article.label ?? row[`label_${locale}`] ?? ""),
    query: String(article.query ?? row[`query_${locale}`] ?? ""),
    shots: {
      beforeDesktop: String(row.shot_before ?? ""),
      beforeMobile: String(row.shot_before_mobile ?? ""),
      afterDesktop: String(row.shot_after ?? ""),
      afterMobile: String(row.shot_after_mobile ?? ""),
    },
    intro: strings(article.intro),
    findings: findings(article.findings),
    outcome: strings(article.outcome),
    price: String(article.price ?? ""),
    lostPer100: lostBand(row.lost_per_100),
  };
}

const COLUMNS =
  "category, city, country, published_at, created_at, shot_taken_at, shot_before, shot_before_mobile, " +
  "shot_after, shot_after_mobile, slug_ru, slug_uz, title_ru, title_uz, description_ru, description_uz, " +
  "label_ru, label_uz, query_ru, query_uz, article_ru, article_uz, lost_per_100";

/**
 * Опубликованные разборы на языке — свежие первыми.
 *
 * База недоступна — отдаём то, что лежит в репозитории. Раздел, упавший
 * вместе с базой, теряет ровно тот трафик из поиска, ради которого он и
 * написан.
 */
export async function listRazbors(locale: RazborLocale): Promise<RazborItem[]> {
  const db = serviceClient();
  if (!db) return staticFor(locale);

  const { data, error } = await db
    .from("razbors")
    .select(COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("разборы: не прочитались", error.message);
    return staticFor(locale);
  }

  const fromDb = (data ?? [])
    .map((row) => toItem(row as unknown as Record<string, unknown>, locale))
    .filter((item): item is RazborItem => item !== null);

  return [...fromDb, ...staticFor(locale)].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function razborBySlug(locale: RazborLocale, slug: string): Promise<RazborItem | null> {
  const fromFile = staticBySlug(locale, slug);
  if (fromFile) return fromFile;

  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("razbors")
    .select(COLUMNS)
    .eq("status", "published")
    .eq(`slug_${locale}`, slug)
    .maybeSingle();

  return data ? toItem(data as unknown as Record<string, unknown>, locale) : null;
}

/** Соседние разборы той же ниши — перелинковка внизу страницы. */
export async function siblings(item: RazborItem, limit = 3): Promise<RazborItem[]> {
  const all = await listRazbors(item.locale);
  return all.filter((other) => other.slug !== item.slug && other.niche === item.niche).slice(0, limit);
}

export type RazborLink = { slug: string; title: string; href: string };

/** Разборы по нишам — для блока «в вашей нише» под отчётом аудитора. */
export async function razborsByNiche(
  locale: RazborLocale,
  perNiche = 3,
): Promise<Record<string, RazborLink[]>> {
  const out: Record<string, RazborLink[]> = {};
  for (const item of await listRazbors(locale)) {
    const list = (out[item.niche] ??= []);
    if (list.length >= perNiche) continue;
    list.push({ slug: item.slug, title: item.title, href: `/${locale}/razbor/${item.slug}` });
  }
  return out;
}

// ── Сторона черновиков: то, что пишет ночная смена и читает человек ──────

/**
 * Отпечаток адреса.
 *
 * По нему ищутся дубли, не читая сам адрес. Один сайт разбираем один раз:
 * без этого ночная задача вернётся к нему через неделю и напишет второй
 * разбор — и мы получим две почти одинаковые страницы, то есть сами себе
 * конкурента. Уникальный индекс стоит в базе, здесь — то же число, чтобы
 * не идти за отказом вставки.
 */
export function sourceHash(url: string): string {
  const clean = url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return createHash("sha256").update(clean).digest("hex");
}

export type RazborDraft = {
  category: string;
  city: string;
  country: "UZ" | "KZ" | "KG";
  sourceUrl: string;
  slugRu: string;
  slugUz: string;
  ru: RazborArticle;
  uz: RazborArticle;
  report: unknown;
  lostPer100: readonly [number, number] | null;
  notes?: string;
};

/**
 * Какие сайты уже разбирали — в любом статусе.
 *
 * Отклонённые считаются тоже: сайт, который смена забраковала, не должен
 * возвращаться к ней каждую ночь. Причина отказа хранится там же.
 */
export async function coveredHashes(): Promise<Set<string>> {
  const db = serviceClient();
  if (!db) return new Set();
  const { data } = await db.from("razbors").select("source_hash").limit(2000);
  return new Set((data ?? []).map((row) => String(row.source_hash)));
}

/**
 * Черновик ложится сразу «на проверку», а не «в черновики».
 *
 * Разницы для базы нет, для человека — есть: `review` означает «работа
 * закончена, ждёт глаз», и смена, оставившая после себя `draft`, выглядела
 * бы как смена, которая чего-то не доделала.
 */
export async function saveDraft(draft: RazborDraft): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("razbors")
    .insert({
      status: "review",
      category: draft.category,
      city: draft.city,
      country: draft.country,
      source_url: draft.sourceUrl,
      source_hash: sourceHash(draft.sourceUrl),
      label_ru: draft.ru.label,
      label_uz: draft.uz.label,
      query_ru: draft.ru.query,
      query_uz: draft.uz.query,
      slug_ru: draft.slugRu,
      slug_uz: draft.slugUz,
      report: draft.report,
      title_ru: draft.ru.title,
      title_uz: draft.uz.title,
      description_ru: draft.ru.description,
      description_uz: draft.uz.description,
      article_ru: draft.ru,
      article_uz: draft.uz,
      lost_per_100: draft.lostPer100,
      notes: draft.notes ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Дубль по адресу или по запросу — не авария: смена наткнулась на то,
    // что уже разбирали, и это нормальный исход перебора.
    console.error("разборы: черновик не лёг", error.message);
    return null;
  }
  return data ? String(data.id) : null;
}

export type ReviewRow = {
  id: string;
  created_at: string;
  status: string;
  category: string;
  city: string;
  sourceUrl: string;
  slugRu: string;
  slugUz: string;
  ru: RazborArticle | null;
  uz: RazborArticle | null;
  lostPer100: readonly [number, number] | null;
  notes: string | null;
};

/** Что ждёт человека: сначала непроверенное, потом остальное. */
export async function forReview(limit = 30): Promise<ReviewRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("razbors")
    .select(
      "id, created_at, status, category, city, source_url, slug_ru, slug_uz, article_ru, article_uz, lost_per_100, notes",
    )
    .in("status", ["draft", "review"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    status: String(row.status),
    category: String(row.category),
    city: String(row.city),
    sourceUrl: String(row.source_url),
    slugRu: String(row.slug_ru),
    slugUz: String(row.slug_uz),
    ru: (row.article_ru as RazborArticle | null) ?? null,
    uz: (row.article_uz as RazborArticle | null) ?? null,
    lostPer100: lostBand(row.lost_per_100),
    notes: (row.notes as string | null) ?? null,
  }));
}

export type PublishResult = { ok: true } | { ok: false; why: string };

/**
 * Публикация — только с обеими статьями.
 *
 * Разбор на одном языке — это половина страницы под hreflang, ведущая на
 * несуществующую вторую. Пустить такое в поиск хуже, чем не публиковать:
 * Google запомнит битую пару, а исправлять её придётся дольше, чем ждать.
 */
export async function publish(id: string): Promise<PublishResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const { data } = await db
    .from("razbors")
    .select("article_ru, article_uz, slug_ru, slug_uz")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { ok: false, why: "Разбора уже нет." };
  if (!data.article_ru || !data.article_uz) {
    return { ok: false, why: "Нет статьи на одном из языков — публиковать половину нельзя." };
  }

  const { error } = await db
    .from("razbors")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { ok: false, why: "Не записалось." } : { ok: true };
}

/** Отказ хранится с причиной: иначе смена вернётся к этому сайту снова. */
export async function reject(id: string, reason: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("razbors")
    .update({ status: "rejected", notes: reason.slice(0, 2000) || "без причины" })
    .eq("id", id);
}
