/**
 * Рассылка в бот всей команде — правила (без базы и Telegram).
 *
 * Владелец, 13.10.2026: «запустить рассылку в бот с нашего сервиса для
 * всех (понадобится, чтобы руководитель оповещал через бот о созвонах, к
 * примеру)». Кто, кому, когда и как выглядит сообщение — здесь; доставка —
 * lib/admin/broadcast-store.ts, проходом свипа и сразу после отправки.
 */

import { ROLES, type Role } from "@/lib/admin/roles";
import { messageWindow, parseLocalInput } from "@/lib/admin/tasks";

export const BROADCAST_MAX = 2000;
/** Дальше недели вперёд — это опечатка в дате, а не созвон. */
export const SCHEDULE_MAX_DAYS = 7;
/** Не дошло за сутки после срока — сдаёмся: вчерашнее «созвон в 15:00» уже никому не нужно. */
export const GIVE_UP_H = 24;

/** Рассылают владелец и руководитель — роль, а не галочка: это голос студии в боте у каждого. */
export function sendsBroadcasts(role: Role): boolean {
  return role === "admin" || role === "head";
}

export type Audience = { kind: "all" } | { kind: "roles"; roles: readonly Role[] } | { kind: "pick"; ids: readonly string[] };

export type BroadcastPerson = { id: string; display_name: string; role: Role; telegram: boolean };

/**
 * Кому уйдёт: активные люди по выбору, без автора — он это написал. Без
 * Telegram человек в список попадает (его видно в предпросмотре), но
 * сообщения не получит: `reachable` считает только тех, кому бот может
 * написать.
 */
export function recipientsOf(audience: Audience, people: readonly BroadcastPerson[], authorId: string): BroadcastPerson[] {
  const others = people.filter((p) => p.id !== authorId);
  if (audience.kind === "all") return others;
  if (audience.kind === "roles") return others.filter((p) => audience.roles.includes(p.role));
  const picked = new Set(audience.ids);
  return others.filter((p) => picked.has(p.id));
}

export function reachable(people: readonly BroadcastPerson[]): BroadcastPerson[] {
  return people.filter((p) => p.telegram);
}

/** Строка формы — в выбор получателей; мусор — null. */
export function audienceFrom(kind: string, roles: readonly string[], ids: readonly string[]): Audience | null {
  if (kind === "all") return { kind: "all" };
  if (kind === "roles") {
    const clean = ROLES.filter((r) => roles.includes(r));
    return clean.length ? { kind: "roles", roles: clean } : null;
  }
  if (kind === "pick") {
    const clean = [...new Set(ids.filter((id) => /^[0-9a-f-]{36}$/.test(id)))];
    return clean.length ? { kind: "pick", ids: clean } : null;
  }
  return null;
}

export type TextProblem = "empty" | "long";

export function textProblem(text: string): TextProblem | null {
  const clean = text.trim();
  if (!clean) return "empty";
  if (clean.length > BROADCAST_MAX) return "long";
  return null;
}

/**
 * Сообщение в Telegram. Текст экранируется целиком (HTML Telegram): «<b>»
 * из формы приходит буквами, а не жирным. Ссылки Telegram подсвечивает сам —
 * адрес в тексте остаётся ссылкой.
 */
function esc(value: string): string {
  // Как esc в lib/qualify/telegram.ts — своя копия: этот файл читает и
  // форма в браузере, а модуль Telegram тянет за собой серверное.
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function broadcastMessage(author: string, text: string): string {
  return `📣 <b>${esc(author)}</b>\n\n${esc(text.trim())}`;
}

/** Можно ли слать сейчас: днём — всегда, ночью (23:00–07:00 по Ташкенту) — только с галочкой. */
export function sendableNow(now: Date, nightOk: boolean): boolean {
  return nightOk || messageWindow(now);
}

export type WhenProblem = "bad" | "past" | "far";

/** Когда уходит: «сейчас» или время по Ташкенту из формы. */
export function sendAtFrom(kind: string, local: string, now: Date): Date | WhenProblem {
  if (kind !== "at") return now;
  const at = parseLocalInput(local);
  if (!at) return "bad";
  // Минута на то, чтобы дочитать предпросмотр: «14:50», выбранное в 14:49, — не прошлое.
  if (at.getTime() < now.getTime() - 60_000) return "past";
  if (at.getTime() - now.getTime() > SCHEDULE_MAX_DAYS * 24 * 3600_000) return "far";
  return at;
}

export type BroadcastRow = {
  id: string;
  created_at: string;
  /** Сотрудникам или пользователям бота. */
  kind: "staff" | "users";
  /** Сегмент пользователей бота (lib/admin/bot-users.ts). */
  segment: string | null;
  /** Пользователи — chat id, замороженные при отправке. */
  chats: number[];
  author_id: string | null;
  text: string;
  audience: "all" | "roles" | "pick" | "users";
  roles: string[];
  recipients: string[];
  send_at: string;
  night_ok: boolean;
  cancelled_at: string | null;
  done_at: string | null;
};

export type BroadcastStatus = "scheduled" | "night" | "sending" | "done" | "cancelled";

export function statusOf(b: Pick<BroadcastRow, "send_at" | "night_ok" | "cancelled_at" | "done_at">, now: Date): BroadcastStatus {
  if (b.cancelled_at) return "cancelled";
  if (b.done_at) return "done";
  if (Date.parse(b.send_at) > now.getTime()) return "scheduled";
  if (!sendableNow(now, b.night_ok)) return "night";
  return "sending";
}

/** Отменить можно, пока не ушло никому: автор или владелец. */
export function canCancel(
  b: Pick<BroadcastRow, "author_id" | "send_at" | "night_ok" | "cancelled_at" | "done_at">,
  delivered: number,
  viewer: { id: string; role: Role },
  now: Date,
): boolean {
  const status = statusOf(b, now);
  if (status === "done" || status === "cancelled" || delivered > 0) return false;
  return viewer.role === "admin" || b.author_id === viewer.id;
}

/** Ключ отметок «ушло» в team_news_sent. */
export const broadcastKey = (id: string) => `broadcast:${id}`;

/**
 * «Повторить» прошлую рассылку: что подставить в форму. Получатели — те же
 * роли, люди или сегмент; число в предпросмотре считается заново по тем,
 * кто в команде сейчас.
 */
export function repeatOf(b: BroadcastRow): {
  id: string;
  target: "staff" | "users";
  text: string;
  kind: Audience["kind"];
  roles: Role[];
  picked: string[];
  segment: "all" | "partners" | "buyers" | "clients";
} {
  const segment = b.segment === "partners" || b.segment === "buyers" || b.segment === "clients" ? b.segment : "all";
  return {
    id: b.id,
    target: b.kind === "users" ? "users" : "staff",
    text: b.text,
    kind: b.audience === "roles" ? "roles" : b.audience === "pick" ? "pick" : "all",
    roles: ROLES.filter((r) => b.roles.includes(r)),
    picked: b.audience === "pick" ? [...b.recipients] : [],
    segment,
  };
}
