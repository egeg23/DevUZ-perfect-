import { createHash, randomBytes } from "node:crypto";

import { AGES, SCHOOL } from "@/content/clients/maximova/facts";

import { open } from "@/lib/clients/maximova/db";

/**
 * Заявки, пользователи и вход — всё, что сайт Дарьи хранит о людях.
 *
 * Правило одно: храним минимум. У заявки — имя родителя, контакт, язык,
 * возраст и формат. Имени ребёнка, даты рождения, школы здесь нет: для
 * записи на пробное они не нужны, а каждый лишний столбец — лишние
 * персональные данные несовершеннолетнего.
 */

export const FORMATS = ["В группе", "Индивидуально"] as const;

export type BookingInput = {
  language: string;
  age: string;
  format: string;
  parentName: string;
  contact: string;
  preferredTime?: string;
  comment?: string;
  consent: boolean;
};

export type Booking = {
  id: number;
  createdAt: string;
  language: string;
  age: string;
  format: string;
  parentName: string;
  contact: string;
  preferredTime: string;
  comment: string;
  telegramId: number | null;
  status: "new" | "contacted";
};

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

/**
 * Проверка заявки. Возвращает либо чистые данные, либо ошибки по полям —
 * чтобы форма показала каждую рядом со своим полем, а не списком сверху.
 */
export function validateBooking(
  raw: Record<string, unknown>,
): { ok: true; value: Required<BookingInput> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const language = clean(raw.language, 40);
  const age = clean(raw.age, 20);
  const format = clean(raw.format, 40);
  const parentName = clean(raw.parentName, 80);
  const contact = clean(raw.contact, 64);
  const preferredTime = clean(raw.preferredTime, 120);
  const comment = clean(raw.comment, 500);

  if (!SCHOOL.languages.some((l) => l === language)) errors.language = "Выберите язык";
  if (!AGES.some((a) => a.range === age)) errors.age = "Выберите возраст";
  if (!FORMATS.some((f) => f === format)) errors.format = "Выберите формат";
  if (parentName.length < 2) errors.parentName = "Как к вам обращаться?";

  // Телефон (10–15 цифр) или ник в Telegram — то, по чему Дарья ответит.
  const digits = contact.replace(/\D/g, "");
  const isPhone = digits.length >= 10 && digits.length <= 15 && /^[+\d\s()-]+$/.test(contact);
  const isNick = /^@?[A-Za-z0-9_]{5,32}$/.test(contact);
  if (!isPhone && !isNick) errors.contact = "Телефон или ник в Telegram — чтобы Дарья могла ответить";

  if (raw.consent !== true && raw.consent !== "on" && raw.consent !== "true") {
    errors.consent = "Без согласия на обработку данных заявку принять нельзя";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { language, age, format, parentName, contact, preferredTime, comment, consent: true },
  };
}

type Row = Record<string, unknown>;

const toBooking = (r: Row): Booking => ({
  id: Number(r.id),
  createdAt: String(r.created_at),
  language: String(r.language),
  age: String(r.age),
  format: String(r.format),
  parentName: String(r.parent_name),
  contact: String(r.contact),
  preferredTime: String(r.preferred_time),
  comment: String(r.comment),
  telegramId: r.telegram_id == null ? null : Number(r.telegram_id),
  status: r.status === "contacted" ? "contacted" : "new",
});

export function saveBooking(input: Required<BookingInput>, telegramId: number | null, now = new Date()): Booking {
  const db = open();
  const result = db
    .prepare(
      `insert into bookings (created_at, language, age, format, parent_name, contact, preferred_time, comment, telegram_id)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      now.toISOString(),
      input.language,
      input.age,
      input.format,
      input.parentName,
      input.contact,
      input.preferredTime,
      input.comment,
      telegramId,
    );
  return toBooking(db.prepare("select * from bookings where id = ?").get(Number(result.lastInsertRowid)) as Row);
}

export function markNotified(id: number) {
  open().prepare("update bookings set notified = 1 where id = ?").run(id);
}

export function listBookings(limit = 50): Booking[] {
  return (open().prepare("select * from bookings order by id desc limit ?").all(limit) as Row[]).map(toBooking);
}

export function bookingsOf(telegramId: number): Booking[] {
  return (
    open().prepare("select * from bookings where telegram_id = ? order by id desc limit 20").all(telegramId) as Row[]
  ).map(toBooking);
}

export function setBookingStatus(id: number, status: Booking["status"]) {
  open().prepare("update bookings set status = ? where id = ?").run(status, id);
}

// ─── Вход через Telegram ──────────────────────────────────────────────────

/** Сколько живёт ссылка на вход: хватит открыть Telegram и нажать «Старт». */
export const LOGIN_TTL_MS = 10 * 60 * 1000;
/** Сколько живёт сессия кабинета. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const token = (bytes: number) => randomBytes(bytes).toString("base64url");

export type Viewer = {
  telegramId: number;
  firstName: string;
  lastName: string;
  username: string;
  role: "parent" | "admin";
};

/**
 * Начать вход: токен уходит в ссылку на бота, а nonce — в куку браузера.
 * Подтвердить вход может только тот, кто нажал «Старт» в Telegram, а
 * забрать сессию — только браузер, начавший вход: чужая пересланная ссылка
 * не пустит в кабинет того, кто её переслал.
 */
export function startLogin(consent: boolean, now = Date.now()) {
  const db = open();
  db.prepare("delete from login_tokens where created_at < ?").run(now - LOGIN_TTL_MS * 6);
  const loginToken = token(16);
  const nonce = token(24);
  db.prepare("insert into login_tokens (token, nonce_hash, consent, created_at) values (?, ?, ?, ?)").run(
    loginToken,
    hash(nonce),
    consent ? 1 : 0,
    now,
  );
  return { loginToken, nonce };
}

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

/**
 * Бот получил /start login_<токен>. Токен свежий и не использован —
 * запоминаем, кто подтвердил, и заводим пользователя, если его ещё нет.
 */
export function confirmLogin(
  loginToken: string,
  user: TelegramUser,
  admins: number[],
  now = Date.now(),
): "ok" | "expired" | "unknown" {
  const db = open();
  const row = db.prepare("select * from login_tokens where token = ?").get(loginToken) as Row | undefined;
  if (!row) return "unknown";
  if (Number(row.created_at) < now - LOGIN_TTL_MS || row.used_at != null) return "expired";

  const iso = new Date(now).toISOString();
  const role = admins.includes(user.id) ? "admin" : "parent";
  const existing = db.prepare("select telegram_id from users where telegram_id = ?").get(user.id);
  if (existing) {
    db.prepare(
      "update users set first_name = ?, last_name = ?, username = ?, role = ?, last_login_at = ? where telegram_id = ?",
    ).run(user.first_name ?? "", user.last_name ?? "", user.username ?? "", role, iso, user.id);
  } else {
    // Согласие дано на сайте, до перехода в бота, и хранится при токене.
    if (!Number(row.consent)) return "unknown";
    db.prepare(
      `insert into users (telegram_id, first_name, last_name, username, role, consent_at, created_at, last_login_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(user.id, user.first_name ?? "", user.last_name ?? "", user.username ?? "", role, iso, iso, iso);
  }
  db.prepare("update login_tokens set telegram_id = ?, confirmed_at = ? where token = ?").run(user.id, now, loginToken);
  return "ok";
}

/**
 * Браузер спрашивает, подтверждён ли вход. Подтверждён и nonce совпал —
 * токен гасится и выдаётся сессия (сырой ключ — в куку, хэш — в базу).
 */
export function pollLogin(
  loginToken: string,
  nonce: string,
  now = Date.now(),
): { status: "waiting" | "expired" } | { status: "ok"; session: string } {
  const db = open();
  const row = db.prepare("select * from login_tokens where token = ?").get(loginToken) as Row | undefined;
  if (!row || row.nonce_hash !== hash(nonce)) return { status: "expired" };
  if (row.used_at != null || Number(row.created_at) < now - LOGIN_TTL_MS) return { status: "expired" };
  if (row.confirmed_at == null) return { status: "waiting" };

  const session = token(32);
  db.prepare("update login_tokens set used_at = ? where token = ?").run(now, loginToken);
  db.prepare("insert into sessions (id_hash, telegram_id, created_at, expires_at) values (?, ?, ?, ?)").run(
    hash(session),
    Number(row.telegram_id),
    now,
    now + SESSION_TTL_MS,
  );
  return { status: "ok", session };
}

export function viewerBySession(session: string | undefined, now = Date.now()): Viewer | null {
  if (!session) return null;
  const row = open()
    .prepare(
      `select u.* from sessions s join users u on u.telegram_id = s.telegram_id
       where s.id_hash = ? and s.expires_at > ?`,
    )
    .get(hash(session), now) as Row | undefined;
  if (!row) return null;
  return {
    telegramId: Number(row.telegram_id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    username: String(row.username),
    role: row.role === "admin" ? "admin" : "parent",
  };
}

export function endSession(session: string | undefined) {
  if (session) open().prepare("delete from sessions where id_hash = ?").run(hash(session));
}

export function countUsers(): number {
  return Number((open().prepare("select count(*) as n from users").get() as Row).n);
}
