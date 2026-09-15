/**
 * Разбор: из отчёта аудита — заготовка статьи.
 *
 * Здесь нет ни запросов, ни записи в базу — только правила, по которым
 * решается, стоит ли писать разбор, под какой запрос он пойдёт, как
 * называется страница и какие находки в неё попадут. Всё чистое, поэтому
 * закрывается тестами целиком, а именно эти правила и стоит закрыть: их
 * применяет ночная задача, и человека, который заметил бы ошибку, рядом
 * нет.
 *
 * Правило, из которого растёт остальное: страница отвечает на запрос
 * будущего клиента, а не рассказывает про чужой сайт. Разобранный сайт —
 * повод и иллюстрация, и по имени он не называется.
 */
import type { AuditReport, Finding } from "@/lib/audit/checks";
import { latin } from "@/lib/audit/pitch";
import type { City, Niche } from "@/content/razbor/catalog";

export type RazborLocale = "ru" | "uz";

/* ── Адрес страницы ─────────────────────────────────────────────────────── */

/**
 * Строка → кусок адреса.
 *
 * Кириллица переводится в латиницу тем же словарём, что и в холодных
 * касаниях, — чтобы имя студии и адреса страниц читались одинаково.
 * Узбекские апострофы (`o'`, `g'`) в адресе убираются совсем: в ссылке они
 * превращаются в `%27`, и адрес перестаёт выглядеть адресом.
 */
export function slugify(text: string): string {
  return latin(text)
    .toLowerCase()
    .replace(/['’ʻ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── Запрос и заголовок ─────────────────────────────────────────────────── */

/**
 * Главный запрос страницы. Один — не список синонимов.
 *
 * Русская и узбекская версии — разные запросы, а не перевод одного. По-русски
 * ищут «сайт для стоматологии в Ташкенте», по-узбекски — «stomatologiya
 * uchun sayt Toshkentda». Переведённый запрос даёт текст, которого никто не
 * набирает.
 */
export function queryFor(niche: Niche, city: City, locale: RazborLocale): string {
  return locale === "ru"
    ? `сайт для ${niche.ruGen} в ${city.ruIn}`
    : `${niche.uz} uchun sayt ${city.uzIn}`;
}

/**
 * Адрес страницы: короткий, транслитом, с ядром запроса.
 *
 * Без дат и номеров. Дата в адресе состарит страницу через год, хотя
 * содержание останется верным, — и переименовать её потом будет стоить
 * редиректа и просадки.
 */
export function slugFor(niche: Niche, city: City, locale: RazborLocale): string {
  return locale === "ru"
    ? slugify(`sayt dlya ${niche.ruGen} ${city.ru}`)
    : slugify(`${niche.uz} uchun sayt ${city.uz}`);
}

/**
 * Как разобранный бизнес назван в тексте.
 *
 * Имени компании здесь нет и не будет: разбор публикуется анонимно. Платформа
 * добавляется, когда известна, — она делает подпись конкретной, не выдавая
 * владельца: сайтов на WordPress в любом городе тысячи.
 */
export function labelFor(
  niche: Niche,
  city: City,
  facts: AuditReport["facts"],
  locale: RazborLocale,
): string {
  const base = locale === "ru" ? `${niche.ruLabel} в ${city.ruIn}` : `${city.uzIn} ${niche.uzLabel}`;
  if (!facts.platform) return base;
  return locale === "ru" ? `${base}, сайт на ${facts.platform}` : `${base}, sayt ${facts.platform} asosida`;
}

/* ── Стоит ли вообще писать ─────────────────────────────────────────────── */

/** Сколько находок должно быть, чтобы разбор был разбором, а не заметкой. */
export const MIN_FINDINGS = 3;
/** Сколько попадёт в статью. Больше — читатель бросает на середине. */
export const MAX_FINDINGS = 8;

export type Verdict =
  | { ok: true }
  /**
   * `unreachable` — сайт не открылся. Разбирать нечего: снимка «как есть»
   * не будет, а статья про чёрный экран никому не нужна.
   *
   * `thin` — находок меньше трёх. Разбор из двух пунктов читается как
   * придирка и портит впечатление о студии сильнее, чем помогает.
   *
   * `too_good` — сайт нормальный. Это не повод его ругать: выдуманная
   * проблема видна читателю сразу, и доверие к остальным разборам падает.
   */
  | { ok: false; why: "unreachable" | "thin" | "too_good" };

export function worthWriting(report: AuditReport): Verdict {
  const dead = report.findings.some((f) => f.code === "unreachable" || f.code === "http_error");
  if (dead) return { ok: false, why: "unreachable" };

  if (report.findings.length < MIN_FINDINGS) return { ok: false, why: "thin" };

  const critical = report.findings.filter((f) => f.severity === "critical").length;
  const major = report.findings.filter((f) => f.severity === "major").length;
  // Одно серьёзное или два заметных — иначе на снимке «как есть» не видно
  // ничего плохого, и сравнение «было — стало» не работает.
  if (critical === 0 && major < 2) return { ok: false, why: "too_good" };

  return { ok: true };
}

/**
 * Какие находки попадут в статью и в каком порядке.
 *
 * Сначала всё серьёзное — целиком, даже если его больше предела: обрезать
 * критичную находку ради ровного числа значит умолчать о том, из-за чего
 * сайт и теряет клиентов. Остальное добирается по убыванию тяжести до
 * предела.
 */
const WEIGHT: Record<Finding["severity"], number> = { critical: 0, major: 1, minor: 2 };

export function pickFindings(report: AuditReport): Finding[] {
  const critical = report.findings.filter((f) => f.severity === "critical");
  const rest = report.findings
    .filter((f) => f.severity !== "critical")
    .sort((a, b) => WEIGHT[a.severity] - WEIGHT[b.severity]);

  return [...critical, ...rest].slice(0, Math.max(MAX_FINDINGS, critical.length));
}
