/**
 * Колокольчик в шапке панели — что бот писал мне, с отметкой «сделано».
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». У них в шапке колокольчик: всё, что пришло человеку,
 * лежит списком, и пройденное отмечают. У нас то же жило только в Telegram:
 * карточка лида, «Ваш лид ответил», задача, порядок в лидах — уехало вверх
 * по чату, и что сделано, а что нет, помнил только человек.
 *
 * Источник один — сообщения бота сотруднику (lib/admin/push-mirror.ts, то же
 * место, что пуш): новое сообщение сотруднику попадает в колокольчик само.
 * Здесь — без базы: текст строки и куда ведёт нажатие. Строки —
 * lib/admin/bell-store.ts.
 */
import { plainText, pushHref, type PushButton } from "@/lib/admin/push";

/** Сколько дней колокольчик показывает: старше — уже не «что пришло». */
export const BELL_DAYS = 14;
/** Сколько дней строки лежат в базе (чистит свип). */
export const BELL_KEEP_DAYS = 30;
/** Сколько строк в списке за раз. */
export const BELL_LIST = 30;

const TITLE_MAX = 140;
const BODY_MAX = 700;

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Строка колокольчика из сообщения бота: заголовок — первая непустая строка,
 * текст — остальное с переносами (в отличие от пуша, тут его читают), куда
 * ведёт — как у пуша (`pushHref`): кнопка в панель, задача, ссылка в тексте,
 * иначе «Главная».
 */
export function bellRow(
  html: string,
  rows: readonly (readonly PushButton[])[],
  site: string,
): { title: string; body: string; href: string } {
  const lines = plainText(html)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim());
  const first = lines.findIndex(Boolean);
  const title = clip(first >= 0 ? lines[first] : "DevUz", TITLE_MAX);
  const body = clip(
    lines
      .slice(first + 1)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    BODY_MAX,
  );
  return { title, body, href: pushHref(html, rows, site) };
}

/**
 * Что в колокольчик не идёт: ссылка входа — одноразовый вход, ему не место
 * в списке; код входа в приложение сюда и не заходит (`mirror: false`).
 */
export function skipsBell(html: string): boolean {
  return /\/admin\/login\?t=/.test(html);
}
