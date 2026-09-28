/**
 * Промо-материалы партнёров — то, что считается без базы.
 *
 * Отдельно от lib/partners/promo.ts, потому что эти правила нужны и форме
 * загрузки в браузере: какой файл примут, до какого размера, как назвать.
 * Модуль с клиентом Supabase в браузер не тянется.
 */

/** Приватный бакет: превью и скачивание — по подписанным ссылкам. */
export const PROMO_BUCKET = "partner-promo";

/**
 * Предел файла — 50 МБ. Это потолок загрузки одним запросом в Supabase и
 * лимит бакета (0066_partner_promo.sql): больше хранилище не примет, и
 * форма говорит об этом до загрузки, а не после минуты ожидания.
 */
export const PROMO_MAX_BYTES = 50 * 1024 * 1024;

/** Какие файлы принимаем — и с каким расширением их сохраняем. */
export const PROMO_MIME: Readonly<Record<string, string>> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const PROMO_LOCALES = ["all", "ru", "uz", "en", "zh"] as const;
export type PromoLocale = (typeof PROMO_LOCALES)[number];

export const isPromoLocale = (value: string): value is PromoLocale =>
  (PROMO_LOCALES as readonly string[]).includes(value);

export const PROMO_LOCALE_TITLE: Record<PromoLocale, string> = {
  all: "без слов",
  ru: "русский",
  uz: "узбекский",
  en: "английский",
  zh: "китайский",
};

export type PromoKind = "video" | "image";

export function promoKind(mime: string): PromoKind {
  return mime.startsWith("video/") ? "video" : "image";
}

/**
 * Форма кадра: вертикальный — под Reels, Shorts, TikTok и сторис;
 * квадрат — под ленту; горизонтальный — под YouTube и сайт.
 */
export type PromoShape = "vertical" | "square" | "horizontal";

export function promoShape(width: number | null, height: number | null): PromoShape | null {
  if (!width || !height) return null;
  const ratio = width / height;
  if (ratio < 0.9) return "vertical";
  if (ratio > 1.1) return "horizontal";
  return "square";
}

/**
 * Путь нового файла: «2026/09/<uuid>.mp4». Имя придумываем сами, а не
 * берём у загрузившего: имя файла с телефона — «IMG_4411 (2).MOV» с
 * пробелами и скобками, а хранилищу нужен путь без сюрпризов.
 */
export function promoPath(mime: string, id: string, now: Date = new Date()): string | null {
  const ext = PROMO_MIME[mime];
  if (!ext || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}/${month}/${id}.${ext}`;
}

/** Путь, который выдала promoPath, — и никакой другой: регистрировать чужие объекты бакета нельзя. */
export function isPromoPath(path: string): boolean {
  return /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(mp4|mov|webm|png|jpg|webp|gif)$/.test(path);
}

/**
 * Подпись к посту со ссылкой партнёра.
 *
 * Владелец пишет подпись один раз на всех: `{link}` в ней становится
 * короткой ссылкой каждого партнёра. Забыл `{link}` — ссылка встаёт
 * последней строкой: пост без ссылки партнёру ничего не приносит. Подписи
 * нет вовсе — партнёр получает подпись по умолчанию на своём языке.
 */
export function promoCaption(caption: string | null, fallback: (link: string) => string, link: string): string {
  const own = caption?.trim();
  if (!own) return fallback(link);
  return own.includes("{link}") ? own.replaceAll("{link}", link) : `${own}\n\n${link}`;
}

/**
 * Сначала — материалы на языке партнёра и без слов, потом остальные; внутри
 * группы порядок сохраняется (новые сверху). Скрывать чужие языки не нужно:
 * партнёр из Ташкента выкладывает и русский, и узбекский ролик.
 */
export function promoForLocale<T extends { locale: string }>(items: readonly T[], locale: string): T[] {
  const own = (item: T) => item.locale === locale || item.locale === "all";
  return [...items.filter(own), ...items.filter((item) => !own(item))];
}

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/**
 * Имя скачанного файла: «devuz-promo-rolik-1a2b3c.mp4». Латиницей: имя
 * по-русски в заголовке Content-Disposition часть телефонов показывает
 * кракозябрами, а в галерее ищут по «devuz».
 */
export function promoFileName(title: string, id: string, mime: string): string {
  const slug = title
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  const ext = PROMO_MIME[mime] ?? "bin";
  return `devuz-${slug ? `${slug}-` : ""}${id.replace(/-/g, "").slice(0, 6)}.${ext}`;
}

/** «12,1 МБ» по-русски и по-узбекски, «12.1 MB» — по-английски и по-китайски. */
export function promoSize(bytes: number | null, unit: string, comma = true): string {
  if (!bytes) return "";
  const mb = (bytes / 1024 / 1024).toFixed(1);
  return `${comma ? mb.replace(".", ",") : mb} ${unit}`;
}
