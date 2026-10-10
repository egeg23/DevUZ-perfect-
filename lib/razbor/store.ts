import { createHash } from "node:crypto";

import type { RazborFinding, RazborItem, RazborShot } from "@/content/razbor/items";
import { razborBySlug as staticBySlug, razborsFor as staticFor } from "@/content/razbor/items";
import type { Niche } from "@/content/razbor/catalog";
import type { RazborLocale, RazborReadLocale } from "@/lib/razbor/model";
import { parseNiche } from "@/lib/razbor/niche-words";
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
 * разные запросы. Связаны они только полем `alts` — для hreflang.
 *
 * Ещё две версии — английская и польская (с 10.10.2026): их пишет сервер
 * сам из опубликованной русской (lib/razbor/foreign.ts), в той же строке, в
 * `slug_en`/`article_en` и `slug_pl`/`article_pl`. Пока версии нет, страницы
 * на этом языке у разбора нет.
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

/** Все языки, на которых строку можно прочитать, — в порядке ссылок. */
const READ: readonly RazborReadLocale[] = ["ru", "uz", "en", "pl"];

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : [];

const findings = (value: unknown): RazborFinding[] =>
  Array.isArray(value)
    ? value
        .map((f) => f as { code?: unknown; title?: unknown; impact?: unknown; fix?: unknown })
        .map((f) => ({
          // Код нужен, чтобы подставить снимок того места, о котором
          // находка. Его может не быть: статьи, написанные до появления
          // снимков, кода не несут — и это не повод их прятать.
          ...(f.code ? { code: String(f.code) } : {}),
          title: String(f.title ?? ""),
          impact: String(f.impact ?? ""),
          fix: String(f.fix ?? ""),
        }))
        .filter((f) => f.title)
    : [];

/**
 * Бакет со снимками разборов — публичный, и это не упущение.
 *
 * Снимок «как есть» на нём уже анонимный: имя и логотип затёрты плашками
 * при съёмке. Он же и есть половина ценности страницы — Google Картинки
 * приводят на разборы отдельный трафик, а картинка за подписанной ссылкой
 * в поиск не попадает вовсе.
 */
export const SHOT_BUCKET = "razbor";

/**
 * Путь в бакете → адрес картинки.
 *
 * Строка, уже похожая на адрес (`/razbor/...` из репозитория или полный
 * `https://`), возвращается как есть: снимки старых разборов лежат в
 * `public/`, и переносить их только ради единообразия значило бы ломать
 * страницы, которые уже в поиске.
 */
export function shotUrl(value: unknown): string {
  const path = String(value ?? "").trim();
  if (!path) return "";
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/+$/, "")}/storage/v1/object/public/${SHOT_BUCKET}/${path}` : "";
}

/**
 * Снимки находок: код → картинка с размерами.
 *
 * Испорченная запись отбрасывается молча. Снимок без размеров рисовать
 * нечем: высота выреза у каждого своя, и подставленные наугад числа
 * растянули бы картинку — на странице, где картинка и есть доказательство.
 */
function findingShots(value: unknown): Record<string, RazborShot> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const out: Record<string, RazborShot> = {};
  for (const [code, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const shot = raw as { path?: unknown; width?: unknown; height?: unknown };
    const src = shotUrl(shot.path);
    const width = Number(shot.width);
    const height = Number(shot.height);
    if (!src || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;
    out[code] = { src, width, height };
  }
  return out;
}

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

export function toItem(row: Record<string, unknown>, locale: RazborReadLocale): RazborItem | null {
  const article = row[`article_${locale}`] as Record<string, unknown> | null;
  const slug = String(row[`slug_${locale}`] ?? "");
  if (!article || !slug) return null;

  return {
    slug,
    locale,
    alts: versionsOf(row).filter((v) => v.locale !== locale),
    niche: String(row.category ?? ""),
    city: String(row.city ?? ""),
    publishedAt: String(row.published_at ?? row.created_at ?? "").slice(0, 10),
    shotTakenAt: String(row.shot_taken_at ?? row.created_at ?? "").slice(0, 10),
    title: String(article.title ?? row[`title_${locale}`] ?? ""),
    description: String(article.description ?? row[`description_${locale}`] ?? ""),
    label: String(article.label ?? row[`label_${locale}`] ?? ""),
    query: String(article.query ?? row[`query_${locale}`] ?? ""),
    shots: {
      beforeDesktop: shotUrl(row.shot_before),
      beforeMobile: shotUrl(row.shot_before_mobile),
      afterDesktop: shotUrl(row.shot_after),
      afterMobile: shotUrl(row.shot_after_mobile),
      findings: findingShots(row.shot_findings),
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
  "shot_after, shot_after_mobile, shot_findings, slug_ru, slug_uz, title_ru, title_uz, description_ru, description_uz, " +
  "label_ru, label_uz, query_ru, query_uz, article_ru, article_uz, slug_en, article_en, slug_pl, article_pl, lost_per_100";

/**
 * Версии разбора, которые открываются: адрес есть и статья на этом языке
 * есть. Английский или польский адрес без статьи (статью сбросили правкой
 * и ещё не перевели заново) — не версия: страница по нему пока не откроется.
 */
function versionsOf(row: Record<string, unknown>): { locale: RazborReadLocale; slug: string }[] {
  return READ.flatMap((locale) => {
    const slug = String(row[`slug_${locale}`] ?? "");
    return slug && row[`article_${locale}`] ? [{ locale, slug }] : [];
  });
}

/**
 * Опубликованные разборы на языке — свежие первыми.
 *
 * База недоступна — отдаём то, что лежит в репозитории. Раздел, упавший
 * вместе с базой, теряет ровно тот трафик из поиска, ради которого он и
 * написан.
 */
export async function listRazbors(locale: RazborReadLocale): Promise<RazborItem[]> {
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

export async function razborBySlug(locale: RazborReadLocale, slug: string): Promise<RazborItem | null> {
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

/**
 * Тот же разбор на всех языках — по адресу на любом из них.
 *
 * Переключатель языка меняет только начало адреса: с /ru/razbor/sayt-dlya-…
 * он ведёт на /en/razbor/sayt-dlya-…, а у английской и польской версий
 * свои адреса.
 * По нему страница находит строку и ведёт туда, где разбор на нужном языке
 * действительно есть.
 */
export async function razborVersions(slug: string): Promise<Partial<Record<RazborReadLocale, string>> | null> {
  const db = serviceClient();
  if (!db || !/^[a-z0-9-]{1,200}$/.test(slug)) return null;

  const { data } = await db
    .from("razbors")
    .select("slug_ru, slug_uz, slug_en, slug_pl, article_ru, article_uz, article_en, article_pl")
    .eq("status", "published")
    .or(`slug_ru.eq.${slug},slug_uz.eq.${slug},slug_en.eq.${slug},slug_pl.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return Object.fromEntries(versionsOf(data as unknown as Record<string, unknown>).map((v) => [v.locale, v.slug]));
}

/** Соседние разборы той же ниши — перелинковка внизу страницы. */
export async function siblings(item: RazborItem, limit = 3): Promise<RazborItem[]> {
  const all = await listRazbors(item.locale);
  return all.filter((other) => other.slug !== item.slug && other.niche === item.niche).slice(0, limit);
}

export type RazborLink = { slug: string; title: string; href: string };

/** Разборы по нишам — для блока «в вашей нише» под отчётом аудитора. */
export async function razborsByNiche(
  locale: RazborReadLocale,
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

/**
 * Формы слова ниши, которой нет в каталоге.
 *
 * Лежат в строке своего разбора, а не в общем каталоге: каталог — это
 * решение студии о том, какие ниши она ведёт, и пополнять его должна рука,
 * а не ночная задача. Строке же они нужны, чтобы второй сайт в той же нише
 * взял те же слова: две наши страницы под «сайт для автошколы» и «сайт для
 * автошкол» — это случай, когда Google не может выбрать и не показывает ни
 * одну.
 */
export async function storedNiche(key: string): Promise<Niche | null> {
  const db = serviceClient();
  if (!db || !key) return null;

  const { data } = await db
    .from("razbors")
    .select("niche_words")
    .eq("category", key)
    .not("niche_words", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.niche_words ? parseNiche(data.niche_words) : null;
}

export type RazborDraft = {
  category: string;
  /** Формы слова ниши — только для ниш вне каталога. */
  nicheWords: Niche | null;
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
      niche_words: draft.nicheWords,
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
  publishedAt: string | null;
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
  /**
   * Сколько снимков у разбора: общих и по находкам.
   *
   * Проверяющему это первое, на что смотреть. Разбор без снимков — это
   * список претензий без доказательств, и выпускать такой под именем студии
   * нельзя; панель говорит об этом прямо, а не оставляет заметить самому.
   */
  shots: { before: boolean; after: boolean; findings: number };
  /**
   * Коды находок, которые аудит действительно вынес по этому сайту.
   *
   * Заполняется только при чтении одной строки — для страницы правки.
   * Списку на сто разборов отчёты аудита не нужны, а весят они больше всего
   * остального вместе взятого.
   *
   * Нужны затем, чтобы привязать снимок к находке, переписанной руками. И
   * выбирать можно только из них: разрешить любой код значило бы разрешить
   * поставить под находкой снимок места, о котором аудит ничего не говорил.
   */
  auditCodes: string[];
};

const ROW_COLUMNS =
  "id, created_at, published_at, status, category, city, source_url, slug_ru, slug_uz, " +
  "article_ru, article_uz, lost_per_100, notes, shot_before, shot_after, shot_findings";

function auditCodes(report: unknown): string[] {
  const findings = (report as { findings?: unknown } | null)?.findings;
  if (!Array.isArray(findings)) return [];
  return Array.from(
    new Set(findings.map((f) => String((f as { code?: unknown })?.code ?? "")).filter(Boolean)),
  );
}

function toRow(row: Record<string, unknown>): ReviewRow {
  const shots = row.shot_findings;
  return {
    auditCodes: auditCodes(row.report),
    id: String(row.id),
    created_at: String(row.created_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
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
    shots: {
      before: Boolean(row.shot_before),
      after: Boolean(row.shot_after),
      findings: shots && typeof shots === "object" && !Array.isArray(shots) ? Object.keys(shots).length : 0,
    },
  };
}

/** Что ждёт человека: сначала непроверенное, потом остальное. */
export async function forReview(limit = 30): Promise<ReviewRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("razbors")
    .select(ROW_COLUMNS)
    .in("status", ["draft", "review"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => toRow(row as unknown as Record<string, unknown>));
}

/**
 * История: что уже вышло и что забраковали.
 *
 * Без неё панель отвечала только на вопрос «что мне сейчас проверить», а на
 * вопрос «что вообще стоит на сайте» — нет; и чтобы снять с публикации
 * вчерашний разбор, приходилось идти в базу руками.
 *
 * Опубликованные сортируются по дате публикации, отклонённые — по дате
 * создания: у них даты публикации нет, и общий `order` поставил бы их
 * вперемешку в непредсказуемом порядке.
 */
export async function history(limit = 100): Promise<ReviewRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("razbors")
    .select(ROW_COLUMNS)
    .in("status", ["published", "rejected"])
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []).map((row) => toRow(row as unknown as Record<string, unknown>));
  const key = (row: ReviewRow) => row.publishedAt ?? row.created_at;
  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "published" ? -1 : 1;
    return key(b).localeCompare(key(a));
  });
}

/** Один разбор целиком — для страницы правки. Здесь и отчёт аудита. */
export async function razborById(id: string): Promise<ReviewRow | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("razbors")
    .select(`${ROW_COLUMNS}, report`)
    .eq("id", id)
    .maybeSingle();
  return data ? toRow(data as unknown as Record<string, unknown>) : null;
}

/**
 * Адреса разбора на обоих языках.
 *
 * Возвращаются из каждого действия, которое меняет содержание: страницы
 * раздела кэшируются, и без точных адресов их нечем сбросить. Кнопка,
 * которая записала строку в базу, но не сбросила кэш, для человека
 * выглядит ровно как кнопка, которая ничего не сделала, — так и было.
 */
/** `en` и `pl` — только если у разбора есть такой адрес (lib/razbor/foreign.ts). */
export type RazborPaths = { ru: string; uz: string; en: string | null; pl: string | null };

/**
 * Почему не вышло — кодом: текст на языке панели подбирает страница
 * (content/admin-panel/razbor.ts). `half` — нет статьи на одном из языков,
 * публиковать половину нельзя. В `detail` — только ответ базы.
 */
export type RazborFailure = { ok: false; why: "offline" | "gone" | "half" | "failed"; detail?: string };

export type PublishResult = { ok: true; paths: RazborPaths } | RazborFailure;

const pathsOf = (row: { slug_ru?: unknown; slug_uz?: unknown; slug_en?: unknown; slug_pl?: unknown }): RazborPaths => ({
  ru: `/ru/razbor/${String(row.slug_ru ?? "")}`,
  uz: `/uz/razbor/${String(row.slug_uz ?? "")}`,
  en: row.slug_en ? `/en/razbor/${String(row.slug_en)}` : null,
  pl: row.slug_pl ? `/pl/razbor/${String(row.slug_pl)}` : null,
});

/**
 * Публикация — только с обеими статьями.
 *
 * Разбор на одном языке — это половина страницы под hreflang, ведущая на
 * несуществующую вторую. Пустить такое в поиск хуже, чем не публиковать:
 * Google запомнит битую пару, а исправлять её придётся дольше, чем ждать.
 *
 * Снимков публикация не требует. Требовала бы — и кнопка молча отказывала
 * бы ровно тем разборам, которые ночная смена приносит первыми: съёмка идёт
 * отдельным проходом и может отстать на несколько часов. Вместо запрета
 * панель говорит проверяющему, что снимков нет, а страница показывает
 * статью без них и подберёт их, как только они появятся.
 */
export async function publish(id: string): Promise<PublishResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "offline" };

  const { data } = await db
    .from("razbors")
    .select("article_ru, article_uz, slug_ru, slug_uz, slug_en, slug_pl")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { ok: false, why: "gone" };
  if (!data.article_ru || !data.article_uz) {
    // Нет статьи на одном из языков — публиковать половину нельзя.
    return { ok: false, why: "half" };
  }

  const { error } = await db
    .from("razbors")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { ok: false, why: "failed" } : { ok: true, paths: pathsOf(data) };
}

/**
 * Снять с публикации — не то же самое, что удалить.
 *
 * Страница уходит с сайта, строка остаётся: отпечаток адреса продолжает
 * держать сайт разобранным, и ночная смена не напишет про него второй раз.
 * Статус — `review`, а не `draft`: текст никуда не делся, он снова ждёт
 * решения.
 */
export async function unpublish(id: string): Promise<RazborPaths | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db.from("razbors").select("slug_ru, slug_uz, slug_en, slug_pl").eq("id", id).maybeSingle();
  if (!data) return null;

  await db.from("razbors").update({ status: "review", published_at: null }).eq("id", id);
  return pathsOf(data);
}

/**
 * Удаление — насовсем, вместе с отпечатком адреса.
 *
 * Значит, ночная смена однажды принесёт этот сайт снова. Это осознанно:
 * удаляют разбор тогда, когда он неверен, а неверный разбор — повод
 * написать заново, а не повод занести сайт в чёрный список навсегда. Кому
 * нужно «больше никогда» — тому нужен отказ с причиной, не удаление.
 */
export async function remove(id: string): Promise<RazborPaths | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db.from("razbors").select("slug_ru, slug_uz, slug_en, slug_pl").eq("id", id).maybeSingle();
  if (!data) return null;

  await db.from("razbors").delete().eq("id", id);
  return pathsOf(data);
}

export type SaveResult = { ok: true; paths: RazborPaths } | RazborFailure;

/**
 * Правка статьи руками.
 *
 * Меняется только текст — ни адрес, ни ниша, ни город. Адрес
 * опубликованного разбора уже стоит в поиске и в карте сайта; переименовать
 * его тихо значит потерять позицию и получить битую ссылку у всех, кто
 * успел сослаться.
 *
 * Код находки — то, что привязывает к ней снимок места на сайте, — приходит
 * из формы списком и уже сверен со списком известных. Находка без кода
 * остаётся без снимка: это честнее, чем подставить ей чужой.
 */
export async function saveArticles(
  id: string,
  next: { ru: RazborArticle; uz: RazborArticle },
): Promise<SaveResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "offline" };

  const { data } = await db.from("razbors").select("slug_ru, slug_uz, slug_en, slug_pl").eq("id", id).maybeSingle();
  if (!data) return { ok: false, why: "gone" };

  const { error } = await db
    .from("razbors")
    .update({
      article_ru: next.ru,
      article_uz: next.uz,
      title_ru: next.ru.title,
      title_uz: next.uz.title,
      description_ru: next.ru.description,
      description_uz: next.uz.description,
      label_ru: next.ru.label,
      label_uz: next.uz.label,
      // Английская и польская версии написаны с прежнего русского текста:
      // после правки они устарели. Адреса остаются теми же (они уже в
      // поиске), статьи сервер напишет заново со следующего свипа.
      article_en: null,
      en_tried_at: null,
      article_pl: null,
      pl_tried_at: null,
    })
    .eq("id", id);

  return error ? { ok: false, why: "failed", detail: error.message } : { ok: true, paths: pathsOf(data) };
}

/** Отказ хранится с причиной: иначе смена вернётся к этому сайту снова. */
export async function reject(id: string, reason: string): Promise<RazborPaths | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db.from("razbors").select("slug_ru, slug_uz, slug_en, slug_pl").eq("id", id).maybeSingle();
  if (!data) return null;

  await db
    .from("razbors")
    .update({ status: "rejected", notes: reason.slice(0, 2000) || "без причины" })
    .eq("id", id);
  return pathsOf(data);
}
