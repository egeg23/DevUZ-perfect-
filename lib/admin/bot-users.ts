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
