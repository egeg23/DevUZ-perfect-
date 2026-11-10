/**
 * Пользователи бота студии и рассылка им — правила (без базы и Telegram).
 *
 * Владелец, 13.10.2026: «это именно рассылка своего текста через бот
 * сотрудникам или пользователям, раздели их». Пользователь бота — тот, кто
 * сам написал боту в личку (таблица bot_users): клиенты и лиды из чата,
 * партнёры, покупатели магазина. Сотрудники сюда не попадают — им рассылка
 * «Сотрудникам» (lib/admin/broadcast.ts).
 *
 * Модели здесь нет и быть не должно: свой текст → база → свип → Telegram
 * Bot API. Модель недоступна — рассылка работает как обычно (держит
 * tests/hq-bot-users.test.ts).
 */

export const SEGMENTS = ["all", "partners", "buyers", "clients"] as const;
export type Segment = (typeof SEGMENTS)[number];

export function isSegment(value: unknown): value is Segment {
  return typeof value === "string" && (SEGMENTS as readonly string[]).includes(value);
}

/**
 * Лимит Telegram — около 30 сообщений в секунду на бота; держим 25 с
 * запасом. Между сообщениями — пауза, за проход — не больше PASS_CAP:
 * остальное дошлёт следующий проход свипа через пять минут.
 */
export const PER_SECOND = 25;
export const GAP_MS = Math.ceil(1000 / PER_SECOND);
export const PASS_CAP = 600;
/** Не дошло трижды (не 403, а сбой) — больше не пробуем. */
export const MAX_ATTEMPTS = 3;

export type BotUser = {
  chat_id: number;
  username: string | null;
  first_name: string | null;
  blocked_at: string | null;
  /** Первый раз написал боту или нажал «Start». */
  first_at?: string | null;
  /** Последний раз писал или нажимал кнопку. */
  last_at?: string | null;
};

export type Marks = {
  /** chat id сотрудников — их в списке нет никогда. */
  staff: ReadonlySet<number>;
  /** chat id активных партнёров. */
  partners: ReadonlySet<number>;
  /** chat id покупателей магазина (orders.buyer_chat_id). */
  buyers: ReadonlySet<number>;
};

/** Сегменты, в которые попадает человек: партнёр, покупатель или «клиенты» — все остальные. */
export function segmentsOf(chat: number, marks: Marks): Segment[] {
  const out: Segment[] = ["all"];
  if (marks.partners.has(chat)) out.push("partners");
  if (marks.buyers.has(chat)) out.push("buyers");
  if (!marks.partners.has(chat) && !marks.buyers.has(chat)) out.push("clients");
  return out;
}

/** Кому можно писать: не сотрудник, не заблокировал бота. */
export function audienceOf(users: readonly BotUser[], marks: Marks, segment: Segment): BotUser[] {
  return users.filter((u) => !u.blocked_at && !marks.staff.has(u.chat_id) && segmentsOf(u.chat_id, marks).includes(segment));
}

/** Сколько в каждом сегменте — для чипов и предпросмотра. */
export function segmentCounts(users: readonly BotUser[], marks: Marks): Record<Segment, number> {
  const out = { all: 0, partners: 0, buyers: 0, clients: 0 } as Record<Segment, number>;
  for (const s of SEGMENTS) out[s] = audienceOf(users, marks, s).length;
  return out;
}

/**
 * Подписчики бота на «Главной» (владелец, 25.10.2026: «Выведи мне и
 * руководителям количество подписчиков в боте со статистикой 24 часа / 7
 * дней / месяц… Как посмотреть сколько пользователей не понимаю»).
 */
export const SUB_WINDOWS = [
  { key: "day", ms: 24 * 60 * 60_000 },
  { key: "week", ms: 7 * 24 * 60 * 60_000 },
  { key: "month", ms: 30 * 24 * 60 * 60_000 },
] as const;
export type SubWindow = (typeof SUB_WINDOWS)[number]["key"];

export type BotSubs = {
  /** Сейчас в боте: писали сами, не заблокировали, не сотрудники — те, кому дойдёт рассылка «Всем». */
  total: number;
  /** Заблокировали бота — это видно только по отказу Telegram на рассылку. */
  blocked: number;
  /** Новые в окне и в таком же окне перед ним — чтобы было с чем сравнить. */
  fresh: Record<SubWindow, { now: number; prev: number }>;
  /** Были в боте в окне: писали или нажимали кнопки. */
  active: Record<SubWindow, number>;
  /**
   * Подписались сегодня — с полуночи по Ташкенту, и за весь вчерашний день
   * (владелец, 10.11.2026: «выведи для меня и руководителей сколько
   * подписалось на бота нашего за сегодня»).
   */
  today: { now: number; yesterday: number; active: number };
};

const DAY_MS = 24 * 60 * 60_000;
const TASHKENT_MS = 5 * 60 * 60_000;

/** Полночь сегодняшнего дня по Ташкенту — моментом времени. */
export function tashkentDayStart(now: Date): number {
  return Math.floor((now.getTime() + TASHKENT_MS) / DAY_MS) * DAY_MS - TASHKENT_MS;
}

/** Счёт подписчиков правилами, без базы: сотрудники не считаются нигде. */
export function botSubs(users: readonly BotUser[], marks: Marks, now: Date): BotSubs {
  const at = now.getTime();
  const people = users.filter((u) => !marks.staff.has(u.chat_id));
  const time = (iso: string | null | undefined) => (iso ? Date.parse(iso) : Number.NaN);
  const fresh = {} as BotSubs["fresh"];
  const active = {} as BotSubs["active"];
  for (const { key, ms } of SUB_WINDOWS) {
    let current = 0;
    let before = 0;
    let seen = 0;
    for (const u of people) {
      const first = time(u.first_at);
      if (first > at - ms && first <= at) current += 1;
      else if (first > at - 2 * ms && first <= at - ms) before += 1;
      if (time(u.last_at) > at - ms) seen += 1;
    }
    fresh[key] = { now: current, prev: before };
    active[key] = seen;
  }
  const blocked = people.filter((u) => u.blocked_at).length;
  const start = tashkentDayStart(now);
  const today = { now: 0, yesterday: 0, active: 0 };
  for (const u of people) {
    const first = time(u.first_at);
    if (first >= start && first <= at) today.now += 1;
    else if (first >= start - DAY_MS && first < start) today.yesterday += 1;
    if (time(u.last_at) >= start) today.active += 1;
  }
  return { total: people.length - blocked, blocked, fresh, active, today };
}

/** С этого часа по Ташкенту — сводка подписчиков за день; до 21:00 (ночью бот молчит). */
export const SUBS_REPORT_HOUR = 20;

/** Отметка «сводку получил» в team_news_sent. */
export function subsNewsKey(day: string): string {
  return `bot-subs:${day}`;
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/**
 * Сводка подписчиков владельцу и руководителю раз в день (владелец,
 * 10.11.2026: «Мне отчет по подписчикам и Александру раз в день
 * присылай»). Те же числа, что «Подписчики бота» на «Главной».
 */
export function subsReportText(day: string, subs: BotSubs): string {
  const date = day.split("-").reverse().join(".");
  const diff = subs.today.now - subs.today.yesterday;
  return [
    `👥 <b>Подписчики бота · ${date}</b>`,
    `Подписались сегодня: <b>${subs.today.now}</b> (вчера ${subs.today.yesterday}, ${signed(diff)})`,
    `Были в боте сегодня: ${subs.today.active}`,
    `Новые за 7 дней: ${subs.fresh.week.now} (неделей раньше ${subs.fresh.week.prev})`,
    `Новые за 30 дней: ${subs.fresh.month.now}`,
    `Сейчас в боте: <b>${subs.total}</b>${subs.blocked ? ` · заблокировали: ${subs.blocked}` : ""}`,
  ].join("\n");
}

/**
 * Ответ на рассылку — с её текстом (владелец, 25.10.2026, на «бот подхватит
 * дальнейшее общение с теми, кто продолжит диалог?» — «Делай»). Рассылка
 * уходит мимо переписки бота, и на «Да» после «Хотите бесплатный макет?»
 * модель видела одно «Да» и знакомилась заново. Теперь последняя дошедшая
 * рассылка за BROADCAST_CONTEXT_MS встаёт в переписку репликой студии перед
 * ответом клиента.
 */
export const BROADCAST_CONTEXT_MS = 3 * 24 * 60 * 60_000;

/** Что модели сказать о вставленной рассылке — одной строкой в заметке канала. */
export const BROADCAST_NOTE =
  "Последней репликой от нас в переписке стоит рассылка студии всем подписчикам бота. Клиент отвечает на неё: продолжай с неё, не знакомься заново и не переспрашивай то, что в ней уже сказано.";

/**
 * Текст рассылки, который надо вставить в переписку перед ответом клиента,
 * или null: рассылки не было, она старше трёх дней, уже стоит в переписке
 * или разговор после неё уже шёл (`sessionAt` — когда переписка бота
 * менялась последний раз).
 */
export function broadcastTurn(
  transcript: readonly { role: string; content: string }[],
  sessionAt: number | null,
  last: { text: string; at: string } | null,
  now: number,
): string | null {
  if (!last) return null;
  const at = Date.parse(last.at);
  const text = last.text.trim();
  if (!text || !Number.isFinite(at) || now - at > BROADCAST_CONTEXT_MS) return null;
  if (transcript.some((m) => m.role === "assistant" && m.content.trim() === text)) return null;
  if (transcript.length && sessionAt !== null && sessionAt > at) return null;
  return text;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Сообщение пользователю — ровно свой текст, экранированный (HTML
 * Telegram). Без подписи сотрудника: клиенту пишет студия, а не человек
 * из панели. Ссылки Telegram подсвечивает сам.
 */
export function userMessage(text: string): string {
  return esc(text.trim());
}

export type UserOutcome = "sending" | "sent" | "failed" | "blocked";

export type UserTally = { sent: number; failed: number; blocked: number; pending: number };

/** Итог рассылки пользователям по строкам доставки. */
export function tallyOf(total: number, rows: readonly { status: UserOutcome; attempts: number }[]): UserTally {
  const sent = rows.filter((r) => r.status === "sent").length;
  const blocked = rows.filter((r) => r.status === "blocked").length;
  const failed = rows.filter((r) => r.status === "failed" && r.attempts >= MAX_ATTEMPTS).length;
  return { sent, blocked, failed, pending: Math.max(0, total - sent - blocked - failed) };
}
