import { WORKDAYS, tashkentHour } from "@/lib/admin/portion";
import { IDLE_DAYS, TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Порядок в лидах: «в работе» без движения — бот добивается решения.
 *
 * Владелец, 13.10.2026, «Делаем»: лидов «в работе» 434, ни один за 30 дней
 * не отмечен «выиграли»; проекты с менеджерами почти не связаны. И
 * 14.10.2026: «По всем лидам, которые в работе и без движения, — пусть
 * менеджеров заёбывает бот, чтобы они поменяли статус… они висят, а
 * менеджеры в бесконечном потоке просто забывают о них».
 *
 * Одного давления мало: люди начнут жать «Ещё в работе» не глядя. Поэтому:
 *
 * - По рабочим дням дважды — в 10:00 и в 16:00 — каждому все его лиды «в
 *   работе» без движения 7+ дней, на которые он ещё не ответил: сводка и
 *   под ней лиды порциями до BATCH, у каждого «🏆 / ❌ / ⏳». Повторяет, пока
 *   не ответит.
 * - «⏳ Ещё в работе» — не отсрочка «на глаз»: бот спрашивает, когда
 *   следующий шаг с клиентом (завтра / через 3 дня / через неделю), и
 *   ставит задачу «Связаться: …» на этот срок. До срока лид не спрашивается.
 *   Третий раз подряд «ещё в работе» без смены статуса — у лида остаются
 *   только «выиграли» и «проиграли», руководителю — строка.
 * - Не отвечает боту два рабочих дня — руководителю строка в день.
 * - 21+ день без движения и три дня без ответа — «проиграли» сам, с
 *   пометкой (обратимо в карточке).
 *
 * Здесь — чистые правила; база и Telegram — lib/admin/lead-tidy-store.ts.
 */

/** Когда бот спрашивает: в 10:00 и в 16:00 по Ташкенту. */
export const TIDY_SLOTS = [10, 16] as const;
export type TidySlot = (typeof TIDY_SLOTS)[number];
/** Позже — уже конец рабочего дня: не досылаем. */
export const TIDY_LATEST_HOUR = 18;
export const TIDY_HOUR = TIDY_SLOTS[0];
/** Без движения — столько дней; одно число с «Главной» и командой за неделю (IDLE_DAYS). */
export const STALE_DAYS = IDLE_DAYS;
export const AUTO_LOST_DAYS = 21;
/** Лидов в одном сообщении: больше — порциями, чтобы не засыпать чат. */
export const BATCH = 8;
/** Третье «ещё в работе» подряд — последнее: дальше только «выиграли» / «проиграли». */
export const WAIT_LIMIT = 3;
/** Сколько рабочих дней без ответа боту — и руководитель узнаёт. */
export const SILENT_WORKDAYS = 2;
/**
 * Сколько ждать ответа на вопрос, прежде чем закрыть лид самим: вопрос в
 * пятницу, а в понедельник лид уже «проиграли» — нечестно.
 */
export const ANSWER_GRACE_DAYS = 3;

const DAY = 86_400_000;

/** Какой сейчас заход: 10:00–15:59 — утренний, 16:00–17:59 — вечерний. */
export function tidySlot(now: Date): TidySlot | null {
  const h = tashkentHour(now);
  if (h >= TIDY_SLOTS[1] && h < TIDY_LATEST_HOUR) return TIDY_SLOTS[1];
  if (h >= TIDY_SLOTS[0] && h < TIDY_SLOTS[1]) return TIDY_SLOTS[0];
  return null;
}

export function tidyWindow(now: Date): boolean {
  return tidySlot(now) !== null;
}

export type IdleLead = {
  id: string;
  label: string;
  ownerId: string;
  /** Последнее движение: взят, переписка, действие по лиду (не «ещё в работе»). */
  movedAt: string;
  /** До какого срока не спрашивать (задача «Связаться»); null — нет. */
  snoozedUntil: string | null;
  /** Когда бот последний раз спросил; null — не спрашивал. */
  askedAt: string | null;
  /** Когда бот спросил впервые и ответа с тех пор нет; null — ответил или не спрашивал. */
  firstAskedAt?: string | null;
  /** Сколько раз подряд «ещё в работе» без смены статуса. */
  waitStreak?: number;
};

export function idleDays(movedAt: string, now: Date): number {
  return Math.floor((now.getTime() - Date.parse(movedAt)) / DAY);
}

/** Без движения 7+ дней — «висит». Это же число — в вечернем отчёте. */
export function stale(lead: Pick<IdleLead, "movedAt">, now: Date): boolean {
  return idleDays(lead.movedAt, now) >= STALE_DAYS;
}

/** Спросить: висит и не отложен задачей. Отвеченный (сменил статус) сюда не попадает. */
export function askable(lead: IdleLead, now: Date): boolean {
  if (!stale(lead, now)) return false;
  if (lead.snoozedUntil && Date.parse(lead.snoozedUntil) > now.getTime()) return false;
  return true;
}

/** Все, кого спросить, — у каждого человека, самые старые первыми. */
export function pickToAsk(leads: readonly IdleLead[], now: Date): Map<string, IdleLead[]> {
  const out = new Map<string, IdleLead[]>();
  const sorted = leads
    .filter((l) => askable(l, now))
    .sort((a, b) => Date.parse(a.movedAt) - Date.parse(b.movedAt) || (a.id < b.id ? -1 : 1));
  for (const lead of sorted) out.set(lead.ownerId, [...(out.get(lead.ownerId) ?? []), lead]);
  return out;
}

/** Порции по BATCH. */
export function batches<T>(items: readonly T[], size: number = BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Можно ли ещё раз «ещё в работе»: третий раз — последний. */
export function canWait(lead: Pick<IdleLead, "waitStreak">): boolean {
  return (lead.waitStreak ?? 0) < WAIT_LIMIT;
}

/** «2026-10-14» по Ташкенту. */
function tashkentDay(ms: number): string {
  return new Date(ms + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

function isWorkdayDate(day: string): boolean {
  return (WORKDAYS as readonly number[]).includes(new Date(`${day}T00:00:00Z`).getUTCDay());
}

/**
 * Сколько полных рабочих дней прошло без ответа: от дня первого вопроса
 * включительно до вчера. Спросили в понедельник, молчит понедельник и
 * вторник — в среду это два.
 */
export function silentWorkdays(firstAskedAt: string | null | undefined, now: Date): number {
  if (!firstAskedAt) return 0;
  const today = tashkentDay(now.getTime());
  let day = tashkentDay(Date.parse(firstAskedAt));
  let n = 0;
  for (let guard = 0; day < today && guard < 400; guard++) {
    if (isWorkdayDate(day)) n += 1;
    day = new Date(Date.parse(`${day}T00:00:00Z`) + DAY).toISOString().slice(0, 10);
  }
  return n;
}

/** Не отвечает боту по лиду два рабочих дня. */
export function silentToBot(lead: IdleLead, now: Date): boolean {
  return askable(lead, now) && silentWorkdays(lead.firstAskedAt, now) >= SILENT_WORKDAYS;
}

/** Без ответа боту — спрошен и не ответил (для «Главной»). */
export function unanswered(lead: IdleLead, now: Date): boolean {
  return askable(lead, now) && Boolean(lead.firstAskedAt);
}

/**
 * Закрыть самим: 21+ день без движения, бот спрашивал, а ответа нет —
 * с первого вопроса без ответа прошло ANSWER_GRACE_DAYS. Отложенный
 * задачей не закрывается, пока срок задачи не прошёл. Не спрашивали (нет
 * Telegram, бот молчал) — не закрываем: человек не успел ответить.
 */
export function autoLose(lead: IdleLead, now: Date): boolean {
  if (idleDays(lead.movedAt, now) < AUTO_LOST_DAYS) return false;
  if (lead.snoozedUntil && Date.parse(lead.snoozedUntil) > now.getTime()) return false;
  const first = lead.firstAskedAt ?? null;
  if (!first) return false;
  const asked = Date.parse(first);
  if (asked < Date.parse(lead.movedAt)) return false;
  return now.getTime() - asked >= ANSWER_GRACE_DAYS * DAY;
}

/* ── Следующий шаг по «ещё в работе» ──────────────────────────────────────── */

export const TERMS = { w1: 1, w3: 3, w7: 7 } as const;
export type Term = keyof typeof TERMS;

export const TERM_BUTTONS: Record<Term, string> = {
  w1: "Завтра",
  w3: "Через 3 дня",
  w7: "Через неделю",
};

/** Срок задачи: через N дней в 10:00 по Ташкенту; суббота и воскресенье — на понедельник. */
export function dueFor(term: Term, now: Date): Date {
  let day = tashkentDay(now.getTime() + TERMS[term] * DAY);
  while (!isWorkdayDate(day)) day = new Date(Date.parse(`${day}T00:00:00Z`) + DAY).toISOString().slice(0, 10);
  return new Date(Date.parse(`${day}T10:00:00Z`) - TASHKENT_OFFSET_MS);
}

export function taskTitle(label: string): string {
  return `Связаться: ${label}`.slice(0, 200);
}

export function taskBody(cardUrl: string): string {
  return `Следующий шаг с клиентом — вы отметили лид «ещё в работе». После разговора смените статус лида в карточке: ${cardUrl}`;
}

/* ── Кнопки ─────────────────────────────────────────────────────────────── */

export const TIDY_CALLBACK = "lt";
export type TidyAnswer = "won" | "lost" | "wait" | Term;

export function tidyCallback(answer: TidyAnswer, leadId: string): string {
  return `${TIDY_CALLBACK}:${answer}:${leadId}`;
}

const ANSWERS: readonly string[] = ["won", "lost", "wait", ...Object.keys(TERMS)];

export function parseTidyCallback(parts: readonly string[]): { answer: TidyAnswer; leadId: string } | null {
  if (parts[0] !== TIDY_CALLBACK) return null;
  const answer = parts[1] ?? "";
  const leadId = parts[2] ?? "";
  if (!ANSWERS.includes(answer)) return null;
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  return { answer: answer as TidyAnswer, leadId };
}

export function isTerm(answer: TidyAnswer): answer is Term {
  return answer in TERMS;
}

/** Полные названия — так кнопки названы в инструкции и объявлениях. */
export const TIDY_BUTTONS = {
  won: "🏆 Выиграли",
  lost: "❌ Проиграли",
  wait: "⏳ Ещё в работе",
} as const;

const ICON = { won: "🏆", lost: "❌", wait: "⏳" } as const;

export type TidyButton = { text: string; callback_data: string };

/** Кнопки одной порции: ряд на лид — «🏆 1», «❌ 1», «⏳ 1» (у отложившего трижды — без ⏳). */
export function batchRows(leads: readonly IdleLead[], from = 1): TidyButton[][] {
  return leads.map((lead, i) => {
    const n = from + i;
    const answers = canWait(lead) ? (["won", "lost", "wait"] as const) : (["won", "lost"] as const);
    return answers.map((a) => ({ text: `${ICON[a]} ${n}`, callback_data: tidyCallback(a, lead.id) }));
  });
}

/** Что стало после нажатия — надпись вместо ряда кнопок лида. */
export function doneLabel(answer: "won" | "lost" | "wait", n: number | null): string {
  const what = answer === "won" ? "🏆 выиграли" : answer === "lost" ? "❌ проиграли" : "⏳ когда следующий шаг? — ниже";
  return n ? `${n} · ${what}` : what;
}

/**
 * Перестроить клавиатуру после нажатия: ряд этого лида — одной надписью,
 * остальные — как были. Клавиатура приходит из самого нажатия (Telegram
 * присылает её вместе с сообщением).
 */
export function afterPress(
  keyboard: readonly (readonly { text: string; callback_data?: string }[])[],
  leadId: string,
  answer: "won" | "lost" | "wait",
): TidyButton[][] {
  return keyboard.map((row) => {
    const hit = row.some((b) => (b.callback_data ?? "").endsWith(`:${leadId}`));
    if (!hit) return row.map((b) => ({ text: b.text, callback_data: b.callback_data ?? "noop" }));
    const n = Number(/(\d+)\s*$/.exec(row[0]?.text ?? "")?.[1] ?? 0) || null;
    return [{ text: doneLabel(answer, n), callback_data: "noop" }];
  });
}

/* ── Тексты (бот команде пишет по-русски) ───────────────────────────────── */

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function days(n: number): string {
  return `${n} ${plural(n, "день", "дня", "дней")}`;
}

/** Сводка перед порциями. */
export function tidySummary(count: number, slot: TidySlot): string {
  const head =
    slot === TIDY_SLOTS[0]
      ? `🗂 У вас ${count} ${plural(count, "лид", "лида", "лидов")} «в работе» без движения 7+ дней.`
      : `🗂 Напоминаю: ${count} ${plural(count, "лид", "лида", "лидов")} «в работе» всё ещё без ответа.`;
  return `${head} Отметьте по каждому, чем кончилось: 🏆 выиграли, ❌ проиграли или ⏳ ещё в работе — тогда спрошу, когда следующий шаг, и поставлю задачу. Отмеченные больше не придут; неотмеченные пришлю снова в 10:00 и в 16:00.`;
}

/** Одна порция: строки «1. Ромашка — 9 дней». Подписи уже экранированы и со ссылками. */
export function batchText(
  rows: readonly { label: string; movedAt: string; waitStreak?: number }[],
  now: Date,
  part: number,
  parts: number,
  from = 1,
): string {
  const head = parts > 1 ? `Часть ${part} из ${parts}:` : "";
  const lines = rows.map((r, i) => {
    const d = idleDays(r.movedAt, now);
    const warn =
      d >= AUTO_LOST_DAYS - STALE_DAYS ? ` · без ответа через ${days(Math.max(1, AUTO_LOST_DAYS - d))} уйдёт в «проиграли»` : "";
    const last = (r.waitStreak ?? 0) >= WAIT_LIMIT ? " · откладывали трижды — только 🏆 или ❌" : "";
    return `<b>${from + i}.</b> ${r.label} — ${days(d)}${warn}${last}`;
  });
  return [head, ...lines].filter(Boolean).join("\n");
}

/** Вопрос после «⏳». Подпись экранирована. */
export function whenText(label: string): string {
  return `⏳ «${label}» ещё в работе. Когда следующий шаг с клиентом? Поставлю вам задачу «Связаться» на этот день, до него про лид не спрошу.`;
}

/** После выбора срока. */
export function taskSetText(label: string, due: Date): string {
  const d = new Date(due.getTime() + TASHKENT_OFFSET_MS);
  const when = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `✅ Задача «Связаться: ${label}» — на ${when}, 10:00. После разговора смените статус лида.`;
}

export const WON_HINT =
  "🏆 Поздравляем! Заведите проект по этому лиду — так продажа запишется на вас и попадёт в ваши начисления.";

export const NO_MORE_WAIT = "Этот лид откладывали трижды — теперь только «выиграли» или «проиграли»";

/** Руководителю: третий раз откладывает. Имя и подпись экранированы. */
export function thirdWaitNotice(name: string, label: string): string {
  return `⏳ ${name} третий раз откладывает лид «${label}» без смены статуса. Стоит разобрать вместе: живой ли клиент.`;
}

/** Руководителю: не отвечает боту. Имя экранировано. */
export function botSilenceNotice(name: string, n: number): string {
  return `📵 ${name}: ${n} ${plural(n, "лид", "лида", "лидов")} без ответа боту — ${SILENT_WORKDAYS} рабочих дня не отмечает, чем кончилось.`;
}

/** Строка руководителю: какие лиды ушли в «проиграли» сами. Имена экранированы. */
export function autoLostNotice(byPerson: ReadonlyMap<string, number>): string | null {
  if (!byPerson.size) return null;
  const list = [...byPerson.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
    .map(([name, n]) => `${name} — ${n}`)
    .join(", ");
  return `🗂 Лиды без движения ${AUTO_LOST_DAYS}+ день и без ответа на вопрос бота ушли в «проиграли»: ${list}. Вернуть можно в карточке лида.`;
}
