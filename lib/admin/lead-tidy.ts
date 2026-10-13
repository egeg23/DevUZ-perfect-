import { tashkentHour } from "@/lib/admin/portion";

/**
 * Порядок в лидах: «в работе» без движения — спросить, чем кончилось.
 *
 * Владелец, 13.10.2026, «Делаем»: лидов «в работе» 434, ни один за 30 дней
 * не отмечен «выиграли»; проекты с менеджерами почти не связаны — продажи
 * по людям не посчитать. Статус никто не меняет, потому что за это ничего
 * не бывает и никто не спрашивает. Теперь спрашивает бот.
 *
 * - Каждый рабочий день в 10:00 — человеку до трёх его самых старых лидов
 *   «в работе» без движения 7+ дней (нет переписки, смены статуса и других
 *   действий по лиду) с кнопками «🏆 Выиграли», «❌ Проиграли»,
 *   «⏳ Ещё в работе» (откладывает вопрос на 7 дней).
 * - Без движения 21+ день и без ответа на вопрос бота — лид сам уходит в
 *   «проиграли» с пометкой (обратимо в карточке), руководителю строка.
 * - «Выиграли» — подсказка завести проект; проект из лида ведёт тот, у кого
 *   лид (lib/admin/projects.ts).
 *
 * Здесь — чистые правила; база и Telegram — lib/admin/lead-tidy-store.ts.
 */

export const TIDY_HOUR = 10;
/** До какого часа досылать вопрос, если в 10:00 молчала связь. */
export const TIDY_LATEST_HOUR = 18;
export const STALE_DAYS = 7;
export const AUTO_LOST_DAYS = 21;
export const SNOOZE_DAYS = 7;
export const PER_PERSON = 3;
/**
 * Сколько ждать ответа на вопрос, прежде чем закрыть лид самим: вопрос в
 * пятницу, а в понедельник лид уже «проиграли» — нечестно.
 */
export const ANSWER_GRACE_DAYS = 3;

const DAY = 86_400_000;

export function tidyWindow(now: Date): boolean {
  const h = tashkentHour(now);
  return h >= TIDY_HOUR && h < TIDY_LATEST_HOUR;
}

export type IdleLead = {
  id: string;
  label: string;
  ownerId: string;
  /** Последнее движение: взят, переписка, действие по лиду, «ещё в работе». */
  movedAt: string;
  /** Отложен «⏳ Ещё в работе» до; null — нет. */
  snoozedUntil: string | null;
  /** Когда бот последний раз спросил; null — не спрашивал. */
  askedAt: string | null;
};

export function idleDays(movedAt: string, now: Date): number {
  return Math.floor((now.getTime() - Date.parse(movedAt)) / DAY);
}

/** Без движения 7+ дней — «висит». Это же число — в вечернем отчёте. */
export function stale(lead: Pick<IdleLead, "movedAt">, now: Date): boolean {
  return idleDays(lead.movedAt, now) >= STALE_DAYS;
}

/** Спросить сегодня: висит, не отложен, сегодня ещё не спрашивали. */
export function askable(lead: IdleLead, now: Date, todayStart: Date): boolean {
  if (!stale(lead, now)) return false;
  if (lead.snoozedUntil && Date.parse(lead.snoozedUntil) > now.getTime()) return false;
  if (lead.askedAt && Date.parse(lead.askedAt) >= todayStart.getTime()) return false;
  return true;
}

/** До трёх самых старых по движению — у каждого человека. */
export function pickToAsk(leads: readonly IdleLead[], now: Date, todayStart: Date): Map<string, IdleLead[]> {
  const out = new Map<string, IdleLead[]>();
  const sorted = leads
    .filter((l) => askable(l, now, todayStart))
    .sort((a, b) => Date.parse(a.movedAt) - Date.parse(b.movedAt) || (a.id < b.id ? -1 : 1));
  for (const lead of sorted) {
    const mine = out.get(lead.ownerId) ?? [];
    if (mine.length < PER_PERSON) out.set(lead.ownerId, [...mine, lead]);
  }
  return out;
}

/**
 * Закрыть самим: 21+ день без движения, бот спрашивал, а ответа нет —
 * спросили после последнего движения и с тех пор прошло ANSWER_GRACE_DAYS.
 * Отложенный «ещё в работе» не закрывается, пока не кончилась отсрочка.
 * Не спрашивали (нет Telegram, бот молчал) — не закрываем: человек не
 * успел ответить.
 */
export function autoLose(lead: IdleLead, now: Date): boolean {
  if (idleDays(lead.movedAt, now) < AUTO_LOST_DAYS) return false;
  if (lead.snoozedUntil && Date.parse(lead.snoozedUntil) > now.getTime()) return false;
  if (!lead.askedAt) return false;
  const asked = Date.parse(lead.askedAt);
  if (asked < Date.parse(lead.movedAt)) return false;
  return now.getTime() - asked >= ANSWER_GRACE_DAYS * DAY;
}

/* ── Кнопки ─────────────────────────────────────────────────────────────── */

export const TIDY_CALLBACK = "lt";
export type TidyAnswer = "won" | "lost" | "wait";

export function tidyCallback(answer: TidyAnswer, leadId: string): string {
  return `${TIDY_CALLBACK}:${answer}:${leadId}`;
}

export function parseTidyCallback(parts: readonly string[]): { answer: TidyAnswer; leadId: string } | null {
  if (parts[0] !== TIDY_CALLBACK) return null;
  const answer = parts[1];
  const leadId = parts[2] ?? "";
  if (answer !== "won" && answer !== "lost" && answer !== "wait") return null;
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  return { answer, leadId };
}

export const TIDY_BUTTONS: Record<TidyAnswer, string> = {
  won: "🏆 Выиграли",
  lost: "❌ Проиграли",
  wait: "⏳ Ещё в работе",
};

/** Что стало после нажатия — надпись вместо кнопок. */
export const TIDY_DONE: Record<TidyAnswer, string> = {
  won: "🏆 Отмечен «выиграли»",
  lost: "❌ Отмечен «проиграли»",
  wait: `⏳ Ещё в работе — спрошу через ${SNOOZE_DAYS} дней`,
};

/* ── Тексты (бот команде пишет по-русски) ───────────────────────────────── */

function days(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

/** Шапка утреннего вопроса. */
export function tidyIntro(count: number): string {
  return count === 1
    ? "🗂 Лид «в работе» давно без движения. Чем кончилось? Нажмите под ним — это пара секунд."
    : `🗂 ${count} лида «в работе» давно без движения. Чем кончилось? Нажмите под каждым — это пара секунд.`;
}

/** Строка про один лид. Подпись уже экранирована. */
export function tidyItem(label: string, movedAt: string, now: Date): string {
  const d = idleDays(movedAt, now);
  const warn = d >= AUTO_LOST_DAYS - STALE_DAYS ? ` Без ответа через ${days(Math.max(1, AUTO_LOST_DAYS - d))} уйдёт в «проиграли».` : "";
  return `<b>${label}</b> — без движения ${days(d)}.${warn}`;
}

export const WON_HINT =
  "🏆 Поздравляем! Заведите проект по этому лиду — так продажа запишется на вас и попадёт в ваши начисления.";

/** Строка руководителю: какие лиды ушли в «проиграли» сами. Имена экранированы. */
export function autoLostNotice(byPerson: ReadonlyMap<string, number>): string | null {
  if (!byPerson.size) return null;
  const list = [...byPerson.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
    .map(([name, n]) => `${name} — ${n}`)
    .join(", ");
  return `🗂 Лиды без движения ${AUTO_LOST_DAYS}+ день и без ответа на вопрос бота ушли в «проиграли»: ${list}. Вернуть можно в карточке лида.`;
}
