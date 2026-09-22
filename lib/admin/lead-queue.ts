import { periodStart, tashkentMidnight } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";

/**
 * Честная очередь на тёплые лиды — чистая арифметика, без базы.
 *
 * Владелец: «есть ушлый менеджер, который всех лидов берёт на себя, а в
 * холодную не работает вообще». Пока карточка уходила всей команде разом,
 * лид доставался тому, кто быстрее нажал, — то есть тому, кто ничем другим
 * не занят.
 *
 * Теперь новый лид предлагается одному — тому, у кого за месяц меньше всех, —
 * и только он может взять его в ближайшие полчаса. Не взял — следующему.
 * Круг пройден — лид открыт всем. Владелец в очереди не стоит и может взять
 * любой лид вне её.
 */

/** Сколько минут лид принадлежит тому, кому предложен. */
export const OFFER_MINUTES = 30;

/**
 * Кто стоит в очереди.
 *
 * Менеджеры и руководитель — так решил владелец: руководитель получает лиды
 * наравне со всеми. Сам владелец — вне очереди, с правом взять любой.
 */
export const QUEUE_ROLES = ["manager", "head"] as const satisfies readonly Role[];

export function inQueue(role: Role): boolean {
  return (QUEUE_ROLES as readonly Role[]).includes(role);
}

/** Начало текущего месяца по Ташкенту — с него считается, у кого сколько. */
export function monthStartOf(now: Date): Date {
  return tashkentMidnight(periodStart("month", now));
}

export type Candidate = {
  id: string;
  /** Взял лидов с начала месяца. */
  taken: number;
  /** Пропустил предложений с начала месяца: 30 минут вышли, а он не взял. */
  missed: number;
  /** Когда ему последний раз предлагали лид; null — ни разу. */
  lastOfferAt: string | null;
};

/**
 * Кому предложить лид.
 *
 * Считается сумма «взял + пропустил», а не одно «взял». Иначе тот, кто не
 * берёт ничего — в отпуске, болеет, просто не смотрит в телефон, — навсегда
 * оставался бы с наименьшим числом и получал каждый новый лид первым. Каждый
 * лид ждал бы его полчаса, прежде чем дойти до того, кто работает. Пропуск
 * засчитан как полученный шанс: очередь уравнивает шансы, а не результаты.
 *
 * При равенстве — тот, кому дольше не предлагали: иначе двое с одинаковым
 * счётом всегда решались бы в пользу одного и того же. Дальше — по id, чтобы
 * два прохода с одними данными давали один ответ.
 *
 * `skip` — кому этот лид уже предлагали: второй раз за круг его не дают.
 */
export function pickNext(candidates: readonly Candidate[], skip: ReadonlySet<string>): Candidate | null {
  const pool = candidates.filter((c) => !skip.has(c.id));
  pool.sort((a, b) => {
    const load = a.taken + a.missed - (b.taken + b.missed);
    if (load) return load;
    const at = a.lastOfferAt ? Date.parse(a.lastOfferAt) : -Infinity;
    const bt = b.lastOfferAt ? Date.parse(b.lastOfferAt) : -Infinity;
    if (at !== bt) return at < bt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return pool[0] ?? null;
}

export type Offer = {
  staffId: string;
  expiresAt: string;
  /** null — действует; иначе taken, expired или cancelled. */
  outcome: string | null;
};

export type TakeVerdict =
  | { ok: true }
  | {
      ok: false;
      /** Кому лид сейчас предложен; null — предложение истекло, свип ещё не передал. */
      holder: string | null;
      /** До какого времени. */
      until: string | null;
    };

/**
 * Можно ли человеку взять лида прямо сейчас.
 *
 * Лид, который очередь не проходил вовсе, — пришёл до неё, или очередь
 * некому было вести, — открыт как раньше. Лид в очереди берёт только тот,
 * кому он сейчас предложен, и только пока не вышли его полчаса.
 *
 * Истёкшее предложение, которое свип ещё не передал дальше, не принадлежит
 * никому: прежний шанс упущен, следующий ещё не выдан. Это до пяти минут —
 * столько между проходами свипа, — и отдать лид в эти минуты тому, кто
 * первым нажмёт, значило бы вернуть ровно то, от чего очередь и строилась.
 */
export function mayTake(input: {
  role: Role;
  staffId: string;
  offers: readonly Offer[];
  openedAt: string | null;
  now: Date;
}): TakeVerdict {
  if (input.role === "admin") return { ok: true };
  if (!input.offers.length || input.openedAt) return { ok: true };

  const open = input.offers.find((o) => o.outcome === null) ?? null;
  const live = open && Date.parse(open.expiresAt) > input.now.getTime();
  if (open && live && open.staffId === input.staffId) return { ok: true };

  return { ok: false, holder: live ? open.staffId : null, until: live ? open.expiresAt : null };
}

/**
 * Экранирование под parse_mode HTML.
 *
 * Своё, а не из lib/qualify/telegram: тот тянет за собой базу и адрес сайта,
 * а этот модуль нарочно ничего не знает ни о том, ни о другом — его
 * проверяют тестами без окружения.
 */
function html(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Время по Ташкенту — «14:35». */
export function clock(at: string | Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof at === "string" ? new Date(at) : at);
}

/**
 * Шапки карточки: тому, чей лид, и тому, кто смотрит со стороны.
 *
 * Собраны здесь, а не в местах отправки: шлют их двое — приход лида и свип,
 * передающий его дальше, — и две формулировки одного события разошлись бы.
 */
export function offerHeading(until: string): string {
  return `⏳ <b>Лид ваш на ${OFFER_MINUTES} минут — до ${clock(until)}.</b> Не возьмёте — он уйдёт следующему по очереди.`;
}

export function watchHeading(holder: string, until: string): string {
  return `👁 В очереди у <b>${html(holder)}</b> до ${clock(until)}. Вы вне очереди — можете взять сами.`;
}

export const OPEN_HEADING = "🔓 <b>Никто из очереди не взял — лид открыт всем.</b> Берёт первый, кто нажмёт.";

export function missedNotice(label: string): string {
  return `⌛ ${OFFER_MINUTES} минут на лид «${html(label)}» вышли — он передан следующему по очереди.`;
}
