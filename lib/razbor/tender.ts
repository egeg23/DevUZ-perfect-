import { services } from "@/content/services";
import { TENDER_TOPICS, type TenderTopic } from "@/content/razbor/tenders";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { MAX_FINDINGS, type RazborLocale } from "@/lib/razbor/model";
import { unsupportedNumbers, type ArticleProblem } from "@/lib/razbor/shift";
import type { RazborArticle } from "@/lib/razbor/store";

/**
 * Тендерный разбор недели — то, что считается без базы и без модели.
 *
 * Владелец, 28.09: «1 статья в неделю с разбором должна писаться в общем
 * пуле вкладки „Разборы“» — про тендеры и госконтракты. Лежит в той же
 * таблице и проходит тот же путь, что и разбор сайта: смена кладёт на
 * проверку, публикует человек. Отличает его ниша: TENDER_NICHE.
 */

/** Ниша тендерных разборов. Разборы одной ниши ссылаются друг на друга. */
export const TENDER_NICHE = "it-tendery";

/** Услуга, которую продаёт тендерный разбор (content/services.ts). */
export const TENDER_SERVICE = "it-tenders";

/** Имя смены в shift_reports и daily_claims — своё, не «razbor». */
export const TENDER_SHIFT = "razbor-tender";

/**
 * Во сколько по Ташкенту неделя может начаться. Через полчаса после
 * ежедневной смены: две смены с моделью в одну минуту — лишняя нагрузка на
 * один и тот же ключ.
 */
export const TENDER_AT = "08:33";

export const isTender = (niche: string) => niche === TENDER_NICHE;

/** Понедельник ташкентской недели, в которой лежит `now`: «2026-09-28». */
export function tashkentWeek(now: Date): string {
  const t = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const sinceMonday = (t.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - sinceMonday))
    .toISOString()
    .slice(0, 10);
}

/**
 * Пора ли писать.
 *
 * Раз в неделю — в любой её день, а не только в понедельник: если в
 * понедельник сервер лежал, статья выйдет во вторник, а не через неделю.
 * И не раньше назначенного часа того дня, когда свип её заметил.
 */
export function tenderDue(now: Date, lastRunAt: string | null): boolean {
  if (lastRunAt && tashkentWeek(new Date(lastRunAt)) === tashkentWeek(now)) return false;
  const t = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const [h, m] = TENDER_AT.split(":").map(Number);
  return t.getUTCHours() * 60 + t.getUTCMinutes() >= h * 60 + m;
}

/**
 * Служебный адрес темы — для уникального отпечатка в `razbors.source_hash`.
 *
 * Наружу не отдаётся, как и адрес разобранного сайта. По нему смена узнаёт,
 * что тема уже разобрана — в любом статусе, включая отклонённый: тему,
 * которую владелец забраковал, смена не пишет второй раз.
 */
export function tenderSource(key: string): string {
  return `https://devuz.studio/ru/services/${TENDER_SERVICE}#${key}`;
}

/** Первая тема, которой ещё нет в базе. `null` — темы кончились. */
export function nextTopic(
  covered: (source: string) => boolean,
  topics: readonly TenderTopic[] = TENDER_TOPICS,
): TenderTopic | null {
  return topics.find((topic) => !covered(tenderSource(topic.key))) ?? null;
}

/**
 * Цена в статье — из той же услуги, что и на сайте, строкой. ТЗ считается
 * вилкой «от», а разработка на субподряде — по объёму контракта: одной
 * цифрой её не назвать, и выдумывать её модель не должна.
 */
export function tenderPrice(locale: RazborLocale): string {
  const service = services.find((s) => s.slug === TENDER_SERVICE);
  if (!service) return "";
  const { priceFromUsd: p, weeksFrom: a, weeksTo: b } = service;
  return locale === "ru"
    ? `Техническое задание — от $${p}, ${a}–${b} недели. Разработка на субподряде — по объёму контракта, оценка до подачи заявки.`
    : `Texnik topshiriq — $${p} dan, ${a}–${b} hafta. Subpudratda ishlab chiqish — shartnoma hajmiga qarab, baho ariza topshirishdan oldin.`;
}

/**
 * Что даёт модели право назвать число: бриф темы, цена и номера стандартов,
 * которые в ТЗ называют по имени. Сумм контрактов, сроков закупок и
 * номеров статей законов у неё нет — значит, и в тексте им не место.
 */
export function tenderPool(topic: TenderTopic, locale: RazborLocale): string {
  return `${topic.brief} ${tenderPrice(locale)} ГОСТ 34 34.602 ISO/IEC 25010 BPMN 2.0`;
}

/** Проверка тендерной статьи машиной — те же правила, что у разбора сайта. */
export function tenderProblems(article: RazborArticle, pool: string): ArticleProblem[] {
  const out: ArticleProblem[] = [];
  const text = [
    article.title,
    article.description,
    ...article.intro,
    ...article.findings.flatMap((f) => [f.title, f.impact, f.fix]),
    ...article.outcome,
  ].join("\n");

  if (!article.title.trim() || !article.intro.length) {
    out.push({ code: "empty", text: "Нет заголовка или вступления." });
  }
  if (article.findings.length < 3) {
    out.push({ code: "thin", text: "Меньше трёх пунктов — это заметка, а не разбор." });
  }
  if (article.findings.length > MAX_FINDINGS) {
    out.push({ code: "long", text: `Больше ${MAX_FINDINGS} пунктов — разбор превращается в справочник.` });
  }
  const invented = unsupportedNumbers(text, pool);
  if (invented.length) {
    out.push({ code: "invented", text: `Числа, которых нет в брифе и в цене: ${invented.join(", ")}.` });
  }
  if (/\d+\s*%/.test(text)) {
    out.push({ code: "percent", text: "В тексте есть процент — ни экономии, ни прироста разбор не обещает." });
  }
  return out;
}
