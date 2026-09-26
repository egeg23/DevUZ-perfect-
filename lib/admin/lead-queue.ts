import { TASHKENT_OFFSET_MS, periodStart, tashkentMidnight } from "@/lib/admin/pulse";
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

/**
 * Рабочие часы по Ташкенту: с 08:00 до 18:00.
 *
 * Владелец: «вне рабочих часов, с 18:00 до 08:00, правило получаса не
 * действует». Ночью предлагать лид по очереди некому: полчаса у каждого
 * спящего — это три с половиной часа, за которые клиент напишет в другую
 * студию. Ночной лид открыт всем в очереди, а от того, чтобы его забрал один
 * неспящий, держит потолок равной доли — см. `withinShare`.
 */
export const WORK_FROM_HOUR = 8;
export const WORK_TO_HOUR = 18;

export function isWorkingHours(now: Date): boolean {
  // Ташкент живёт по UTC+5 круглый год, без перевода часов, — сдвига
  // достаточно, и часовой пояс из системы машины сюда не просачивается.
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  return hour >= WORK_FROM_HOUR && hour < WORK_TO_HOUR;
}

/** Сколько взято за месяц: у этого человека, у всех вместе и сколько всех. */
export type Share = { mine: number; total: number; people: number };

/**
 * Не больше, чем при равном распределении между всеми.
 *
 * С этим лидом за месяц будет взято `total + 1`. Поровну на всех — это
 * `ceil((total + 1) / people)` на человека, и тот, у кого с этим лидом
 * выйдет больше, его не берёт: он для тех, у кого меньше.
 *
 * Считается «взял», а не «взял + пропустил», как в дневной очереди: потолок
 * держит от того, чтобы один забрал себе всё, а пропущенный днём лид ничего
 * себе не забирал. Иначе тот, кто днём был занят холодными касаниями и
 * пропустил предложение, ночью не мог бы взять ни одного — то есть очередь
 * наказывала бы ровно ту работу, ради которой строилась.
 */
export function withinShare(s: Share): boolean {
  if (s.people <= 0) return true;
  return s.mine + 1 <= Math.ceil((s.total + 1) / s.people);
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
      /** queued — лид сейчас у другого; share — своя равная доля уже взята. */
      reason: "queued" | "share";
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
  /**
   * Ночной лид — пришёл или открылся с 18:00 до 08:00. Для него передаётся
   * счёт за месяц: взять его может любой, но не больше равной доли.
   */
  share?: Share | null;
}): TakeVerdict {
  if (input.role === "admin") return { ok: true };
  if (input.share) {
    return withinShare(input.share) ? { ok: true } : { ok: false, reason: "share", holder: null, until: null };
  }
  if (!input.offers.length || input.openedAt) return { ok: true };

  const open = input.offers.find((o) => o.outcome === null) ?? null;
  const live = open && Date.parse(open.expiresAt) > input.now.getTime();
  if (open && live && open.staffId === input.staffId) return { ok: true };

  return { ok: false, reason: "queued", holder: live ? open.staffId : null, until: live ? open.expiresAt : null };
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

export const NIGHT_HEADING =
  "🌙 <b>Нерабочее время — лид открыт всем в очереди.</b> Взять можно, но не больше равной доли за месяц.";

export const OPEN_HEADING = "🔓 <b>Никто из очереди не взял — лид открыт всем.</b> Берёт первый, кто нажмёт.";

/**
 * Потерянная карточка: лид открыт, но его карточка не дошла ни до кого.
 *
 * 25 сентября в 23:55 пришёл горячий лид с формы, а Telegram с сервера
 * был недоступен (умер прокси). Лид открылся всем по ночному правилу, но
 * карточку не получил никто — и он сутки пролежал ничьим. Свип теперь
 * досылает такие карточки, когда связь возвращается.
 *
 * Потерянной считаем карточку лида, который:
 * - не взят и не назначен;
 * - уже выпущен в очередь (иначе это не наш случай);
 * - выпущен больше LOST_GRACE_MINUTES назад — свежая карточка может быть
 *   ещё в пути;
 * - пришёл не раньше LOST_WINDOW_HOURS назад — старше этого досылать поздно,
 *   а записи о доставке у самых старых лидов могло и не быть;
 * - ни одной доставленной копии (lead_notices пуст).
 */
export const LOST_WINDOW_HOURS = 72;
export const LOST_GRACE_MINUTES = 15;

export function isLostCard(
  lead: {
    status: string | null;
    assignedStaffId: string | null;
    queueOpenedAt: string | null;
    createdAt: string;
    notices: number;
  },
  now: Date,
): boolean {
  if (lead.status !== "new" || lead.assignedStaffId) return false;
  if (!lead.queueOpenedAt || lead.notices > 0) return false;
  const opened = new Date(lead.queueOpenedAt).getTime();
  const created = new Date(lead.createdAt).getTime();
  if (now.getTime() - opened < LOST_GRACE_MINUTES * 60_000) return false;
  return now.getTime() - created <= LOST_WINDOW_HOURS * 3_600_000;
}

/** Шапка досланной карточки: откуда она через столько часов. */
export function lostHeading(createdAt: string): string {
  const when = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
  return `⚠️ <b>Досылка: карточка не дошла из-за сбоя связи.</b> Лид пришёл ${when} и до сих пор ничей.`;
}

export function missedNotice(label: string): string {
  return `⌛ ${OFFER_MINUTES} минут на лид «${html(label)}» вышли — он передан следующему по очереди.`;
}
