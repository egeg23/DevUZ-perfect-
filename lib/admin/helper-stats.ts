/**
 * Сколько вопросов помощнику в боте задал каждый — владельцу и руководителю
 * раз в день.
 *
 * Владелец, 23.10.2026: «Каждый день мне и Александру выводи дополнительную
 * статистику коротко: кто > сколько запросов сделал в боте о помощи».
 *
 * Счёт — строка на человека в день в `stats_snapshots`
 * (`helper-asks:<день>:<id>`), а не журнал: журнал читают отчёты
 * активности и «Главная», и вопросы помощнику раздули бы там «действия».
 * Здесь — правила без базы; запись и рассылка — helper-stats-store.ts.
 */

export const HELPER_ASKS_PREFIX = "helper-asks:";

/** С этого часа по Ташкенту — сводка за день; до 21:00 (ночью бот молчит). */
export const HELPER_STATS_HOUR = 18;

export function askKey(day: string, staffId: string): string {
  return `${HELPER_ASKS_PREFIX}${day}:${staffId}`;
}

/** Отметка «сводку получил» в team_news_sent. */
export function statsNewsKey(day: string): string {
  return `helper-stats:${day}`;
}

export type AskRow = { name: string; count: number };

/** Коротко: «Имя — N» по убыванию, итог. Имена уже экранированы. */
export function helperStatsText(day: string, rows: readonly AskRow[]): string {
  const date = day.split("-").reverse().join(".");
  const asked = rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
  if (!asked.length) return `🤖 <b>Помощник в боте · ${date}</b>\nВопросов не было.`;
  const total = asked.reduce((s, r) => s + r.count, 0);
  return [
    `🤖 <b>Помощник в боте · ${date}</b>`,
    ...asked.map((r) => `${r.name} — ${r.count}`),
    `Всего: ${total}`,
  ].join("\n");
}
