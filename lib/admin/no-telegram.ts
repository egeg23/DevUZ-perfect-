import { esc } from "@/lib/qualify/telegram";

/**
 * Утренняя строка менеджеру: письма, которым некуда уйти в Telegram.
 *
 * Пятничный замер 27.11.2026: за неделю письма подготовили 110 компаниям, а
 * ушло меньше трети. Все 94 «ждут руками» с одной причиной — «на этот номер
 * телеграма нет, остаётся WhatsApp или звонок» (`markUnreachable`): письмо
 * готово, а карточка молча лежит в «Холодных касаниях». Владелец: «Да».
 *
 * По будням с 10:00 до 12:00 по Ташкенту каждому, у кого за `NO_TG_DAYS` дня
 * есть такие карточки, — одна строка со списком (до `NO_TG_LIST`) и ссылкой
 * на карточку, где кнопки WhatsApp и «позвонить». Раз в день
 * (`no-tg:<день>` в team_news_sent), под галочкой «Порция дня». Без модели.
 */

export const NO_TG_HOUR = 10;
export const NO_TG_UNTIL = 12;
export const NO_TG_DAYS = 3;
export const NO_TG_LIST = 5;

export const noTgNewsKey = (day: string) => `no-tg:${day}`;

export type NoTgCard = { id: string; label: string };

export function noTgText(cards: readonly NoTgCard[], site: string): string {
  const list = cards
    .slice(0, NO_TG_LIST)
    .map((c) => `• <a href="${site}/admin/prospect?open=${encodeURIComponent(c.id)}">${esc(c.label)}</a>`)
    .join("\n");
  const rest = cards.length > NO_TG_LIST ? `\n…и ещё ${cards.length - NO_TG_LIST}` : "";
  return (
    `📞 <b>Письма ждут WhatsApp или звонка: ${cards.length}</b>\n` +
    `Письмо готово, но на номере нет Telegram, бот его не отправит. ` +
    `Откройте карточку: там кнопки WhatsApp и «позвонить», текст письма можно скопировать.\n\n` +
    `${list}${rest}`
  );
}

/** Будни, окно 10:00–12:00 по Ташкенту. */
export function noTgDue(weekday: number, hour: number): boolean {
  return weekday >= 1 && weekday <= 5 && hour >= NO_TG_HOUR && hour < NO_TG_UNTIL;
}
