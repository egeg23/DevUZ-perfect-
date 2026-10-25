/**
 * «Лиды» доской: колонки — ступени продажи, карточка — компания.
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Kommo и Pipedrive»:
 * «Погнали по порядку». У них сделки лежат доской по этапам, и на каждом
 * этапе видно, что бот сделает сам. У нас ступени считались (lib/admin/
 * sales-stages.ts), но работать по ним можно было только из карточки.
 *
 * Здесь — без базы: в какую колонку компания, кому какая доска и что можно
 * отметить из колонки. Ступени — те же сделки, что на «Главной» и в
 * «Ступенях продажи» (`loadDeals`): одно правило, одни числа.
 */
import { STAGES, type Deal, type Stage } from "@/lib/admin/sales-stages";

/**
 * Колонки доски. «Написали» — это ещё не разговор: такие компании живут в
 * «Холодных касаниях», на доске их нет, в шапке — только их число.
 */
export const BOARD_STAGES = ["replied", "interest", "mockup", "shown", "priced", "paid"] as const satisfies readonly Stage[];
export type BoardStage = (typeof BOARD_STAGES)[number];

/**
 * Что человек отмечает сам — переносом карточки или кнопкой. «Макет» база
 * узнаёт по ссылке, ушедшей клиенту, «оплату» — по первому платежу проекта:
 * руками их не поставить, иначе ступени перестанут быть правдой.
 */
export const MARKABLE: readonly BoardStage[] = ["interest", "shown", "priced"];

/** Самая дальняя ступень, до которой дошла компания. */
export function stageOf(deal: Pick<Deal, "at">): Stage | null {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) if (deal.at[STAGES[i]]) return STAGES[i];
  return null;
}

/** Колонка доски; null — компания ещё не ответила, ей место в «Холодных касаниях». */
export function columnOf(deal: Pick<Deal, "at">): BoardStage | null {
  const stage = stageOf(deal);
  return stage && (BOARD_STAGES as readonly string[]).includes(stage) ? (stage as BoardStage) : null;
}

export type BoardCard = { deal: Deal; column: BoardStage; since: string };
export type Board = { columns: Record<BoardStage, BoardCard[]>; written: number };

/**
 * Чья доска. Менеджер — свои компании (`ownerId`, как «Мои ступени» на
 * «Главной»), руководитель и владелец — все, с тем же «Чьи», что у списка:
 * «свободные», «мои» или человек.
 */
export function boardOf(
  deals: readonly Deal[],
  viewer: { id: string; everyone: boolean },
  filter: { owner?: string | null; q?: string | null } = {},
): Board {
  const owner = viewer.everyone ? (filter.owner ?? "") : "mine";
  const q = (filter.q ?? "").trim().toLowerCase();
  const columns = Object.fromEntries(BOARD_STAGES.map((s) => [s, [] as BoardCard[]])) as Record<BoardStage, BoardCard[]>;
  let written = 0;
  for (const deal of deals) {
    if (owner === "mine" && deal.ownerId !== viewer.id) continue;
    if (owner === "free" && deal.ownerId) continue;
    if (owner && owner !== "mine" && owner !== "free" && deal.ownerId !== owner) continue;
    if (q && !deal.label.toLowerCase().includes(q)) continue;
    const column = columnOf(deal);
    if (!column) {
      if (deal.at.written) written += 1;
      continue;
    }
    columns[column].push({ deal, column, since: deal.at[column] as string });
  }
  // Свежее сверху: колонка — очередь «что сейчас происходит».
  for (const s of BOARD_STAGES) columns[s].sort((a, b) => Date.parse(b.since) - Date.parse(a.since));
  return { columns, written };
}

/** Какие отметки можно сделать с карточки: только те, что впереди, и только ручные. */
export function nextMarks(column: BoardStage): BoardStage[] {
  const at = BOARD_STAGES.indexOf(column);
  return MARKABLE.filter((s) => BOARD_STAGES.indexOf(s) > at);
}

/** Сколько дней компания стоит в колонке — то, по чему видно «застряла». */
export function daysIn(since: string, now: number): number {
  const ms = Date.parse(since);
  return Number.isNaN(ms) ? 0 : Math.max(0, Math.floor((now - ms) / 86_400_000));
}
