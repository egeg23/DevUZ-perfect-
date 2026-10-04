import { HOURLY_CAP } from "@/lib/admin/outreach";

/**
 * Рабочие аккаунты Telegram — чистая часть: ключи, фильтры, проверки
 * ввода. База — в work-accounts-store, вход и отправка — в скауте.
 *
 * Владелец, 02.10.2026: «У нас дополнительно будет 2 аккаунта, которые я бы
 * хотел подвязать для связи с клиентами».
 *
 * Зачем больше одного. Предел «два первых письма в час» — про аккаунт, а не
 * про студию: Telegram ограничивает номер, который пишет незнакомым, и
 * ограничивает целиком. Три аккаунта — втрое больше касаний при том же
 * риске для каждого, а ограничение одного не останавливает остальных.
 *
 * Главный аккаунт (SCOUT_SESSION) остаётся как был: он же читает чаты.
 * Дополнительные только пишут и ведут переписку. Разговор живёт на том
 * аккаунте, с которого ушло первое письмо (prospects.sent_via): ответ
 * клиенту с другого номера — это незнакомый человек, влезший в чужую
 * переписку.
 */

/** Ключ главного аккаунта — того, что в SCOUT_SESSION. */
export const MAIN_ACCOUNT = "main";

/**
 * Сколько письмо может висеть «взятым» одним аккаунтом.
 *
 * Аккаунт берёт письмо из очереди, прежде чем спросить Telegram, кто это, и
 * отправить. Если скаут упал посередине, отметка не снимется сама — через
 * десять минут письмо снова свободно. Отправка с разбором адресата занимает
 * секунды, так что двойной отправки этот срок не открывает.
 */
export const DISPATCH_STALE_MS = 10 * 60_000;

/** Сколько ждать после PEER_FLOOD или FLOOD_WAIT на дополнительном аккаунте. */
export const FLOOD_PAUSE_MS = 24 * 60 * 60_000;

/**
 * Предел первых писем в час для дополнительного аккаунта: от 1 до 3.
 *
 * Новый аккаунт сразу получает 3 — как главный (владелец, 04.10.2026: «3
 * сообщения новым пользователям в час»). Свежий номер Telegram ограничивает
 * быстрее, поэтому предел можно опустить до 1–2 в карточке аккаунта на
 * первую неделю — решает тот, кто его подключил.
 */
export const MAX_ACCOUNT_CAP = 3;
export const NEW_ACCOUNT_CAP = 3;

/**
 * Может ли аккаунт взять письмо этого сотрудника.
 *
 * Владелец, 04.10.2026: «добавлять, какие менеджеры работают на этом
 * аккаунте; один и тот же менеджер может работать более чем на одном».
 * Письмо уходит с аккаунта, на котором работает тот, кто его поставил.
 * Сотрудник ни к одному аккаунту не привязан — его письма берёт любой, как
 * было до привязки: иначе новый менеджер не смог бы написать никому, пока
 * его не отметят.
 */
export function mayTake(account: string, assigned: ReadonlySet<string> | undefined): boolean {
  return !assigned?.size || assigned.has(account);
}

export type AccountStatus =
  | "code_requested"
  | "awaiting_code"
  | "code_submitted"
  | "awaiting_password"
  | "password_submitted"
  | "active"
  | "paused"
  | "failed"
  | "removed";

/** Шаги входа, которые делает скаут: панель только кладёт ввод. */
export const LOGIN_STEPS: readonly AccountStatus[] = ["code_requested", "code_submitted", "password_submitted"];

export type WorkAccount = {
  id: string;
  created_at: string;
  label: string;
  phone: string;
  status: AccountStatus;
  login_error: string | null;
  tg_username: string | null;
  tg_name: string | null;
  hourly_cap: number;
  flood_until: string | null;
  flood_note: string | null;
  activated_at: string | null;
  seen_at: string | null;
};

/** Имена секретов в хранилище: сессия, сессия на время входа, пароль на минуту. */
export const sessionSecret = (id: string) => `TG_SESSION_${id.replace(/-/g, "")}`;
export const loginSecret = (id: string) => `TG_LOGIN_${id.replace(/-/g, "")}`;
export const passwordSecret = (id: string) => `TG_PASSWORD_${id.replace(/-/g, "")}`;

/**
 * Чьё это письмо — по prospects.sent_via.
 *
 * Пусто — письма, ушедшие до того, как аккаунтов стало несколько: их
 * отправлял главный.
 */
export function accountOf(sentVia: string | null | undefined): string {
  return sentVia?.trim() || MAIN_ACCOUNT;
}

/**
 * Номер для входа: +998… и только цифры.
 *
 * Telegram примет и без плюса, но в панели номер читает человек, и «998901234567»
 * без плюса и пробелов путают с номером заявки.
 */
export function loginPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  // Узбекский номер без кода страны: 90 123 45 67.
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}

/** Код из Telegram — 5 или 6 цифр; пробелы и дефисы, которые ставят при наборе, убираем. */
export function loginCode(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, "");
  return /^\d{5,6}$/.test(digits) ? digits : null;
}

/** Номер в панели — без середины: целиком он нужен только Telegram. */
export function maskedPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 7) return phone;
  return `+${digits.slice(0, 5)}•••${digits.slice(-2)}`;
}

/** Может ли аккаунт сейчас писать первые письма. */
export function canSend(account: Pick<WorkAccount, "status" | "flood_until">, now = Date.now()): boolean {
  if (account.status !== "active") return false;
  return !account.flood_until || Date.parse(account.flood_until) <= now;
}

/** На связи ли скаут этим аккаунтом: отметка свежее трёх минут. */
export function online(account: Pick<WorkAccount, "seen_at">, now = Date.now()): boolean {
  return Boolean(account.seen_at && now - Date.parse(account.seen_at) < 3 * 60_000);
}

/**
 * Сколько первых писем в час уходит со всех аккаунтов вместе.
 *
 * Главный — всегда HOURLY_CAP: его состояние панель не видит, а остановленный
 * он сам снимает очередь. Дополнительные — по своему пределу, если сейчас
 * могут писать.
 */
export function hourlyCapacity(accounts: readonly Pick<WorkAccount, "status" | "flood_until" | "hourly_cap">[], now = Date.now()): number {
  return HOURLY_CAP + accounts.filter((a) => canSend(a, now)).reduce((sum, a) => sum + a.hourly_cap, 0);
}

/**
 * Ошибки входа Telegram — кодом, текст на языке панели (content/admin-panel/accounts.ts).
 * Всё, чего нет в списке, — «other» с исходным текстом рядом.
 */
export const LOGIN_ERRORS = [
  "phone_invalid",
  "phone_banned",
  "code_invalid",
  "code_expired",
  "password_invalid",
  "flood",
  "other",
] as const;
export type LoginError = (typeof LOGIN_ERRORS)[number];

export function loginErrorOf(message: string): LoginError {
  if (/PHONE_NUMBER_INVALID|PHONE_NUMBER_UNOCCUPIED/i.test(message)) return "phone_invalid";
  if (/PHONE_NUMBER_BANNED|USER_DEACTIVATED/i.test(message)) return "phone_banned";
  if (/PHONE_CODE_INVALID|PHONE_CODE_EMPTY/i.test(message)) return "code_invalid";
  if (/PHONE_CODE_EXPIRED|SESSION_EXPIRED/i.test(message)) return "code_expired";
  if (/PASSWORD_HASH_INVALID/i.test(message)) return "password_invalid";
  if (/FLOOD/i.test(message)) return "flood";
  return "other";
}
