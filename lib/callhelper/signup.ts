import { randomBytes } from "node:crypto";

import { innValid, type TrialVerdict } from "@/lib/callhelper/trial";

/**
 * DevUz CallHelper — регистрация колл-центра без владельца (владелец,
 * 26.11.2026: «Делай пока все остальное»). Здесь только разбор и тексты,
 * без базы и сети; база и бот — signup-store.ts.
 *
 * Путь: форма на странице продукта (компания, ИНН, имя) → ссылка в бота
 * студии → человек делится своим номером кнопкой Telegram (так номер и
 * Telegram подтверждены без SMS) → правила пробного (trial.ts) → ключ
 * приходит в тот же чат один раз.
 */

/** `t.me/<бот>?start=ch<токен>`: токен из 24 знаков. */
export const SIGNUP_START = "ch";
const TOKEN = /^[a-z0-9]{24}$/;

export function newSignupToken(): string {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (const b of randomBytes(24)) out += abc[b % abc.length];
  return out;
}

/** Токен из payload `/start`, если это регистрация CallHelper. */
export function signupTokenOf(payload: string | null | undefined): string | null {
  const p = String(payload ?? "").trim();
  if (!p.startsWith(SIGNUP_START)) return null;
  const token = p.slice(SIGNUP_START.length);
  return TOKEN.test(token) ? token : null;
}

/** Сколько живёт незаконченная регистрация. */
export const SIGNUP_TTL_MS = 30 * 60 * 1000;
/** С одного адреса и на всех за сутки: форма открыта всем. */
export const SIGNUP_IP_LIMIT = 5;
export const SIGNUP_DAY_CAP = 60;

export type SignupForm = { company: string; inn: string; name: string };
export type SignupError = "company" | "inn" | "consent";

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Поля формы. Согласие с офертой и обработкой данных обязательно и заранее не отмечено. */
export function parseSignup(raw: unknown): { ok: true; form: SignupForm } | { ok: false; error: SignupError } {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const company = clean(b.company, 160);
  if (company.length < 2) return { ok: false, error: "company" };
  const inn = clean(b.inn, 20).replace(/\D/g, "");
  if (!innValid(inn)) return { ok: false, error: "inn" };
  if (b.consent !== true) return { ok: false, error: "consent" };
  return { ok: true, form: { company, inn, name: clean(b.name, 80) } };
}

/** Незаконченная регистрация, как она лежит в базе. */
export type Pending = SignupForm & { token: string; ipHash: string; device: string; at: number; chat?: number };

export function readPending(payload: unknown): Pending | null {
  const p = (payload && typeof payload === "object" ? payload : null) as Record<string, unknown> | null;
  if (!p || typeof p.token !== "string" || !TOKEN.test(p.token)) return null;
  const at = Number(p.at);
  if (!Number.isFinite(at)) return null;
  return {
    token: p.token,
    company: clean(p.company, 160),
    inn: clean(p.inn, 12),
    name: clean(p.name, 80),
    ipHash: clean(p.ipHash, 64),
    device: clean(p.device, 64),
    at,
    chat: Number.isFinite(Number(p.chat)) && Number(p.chat) ? Number(p.chat) : undefined,
  };
}

export const pendingAlive = (p: Pending, now: number) => now - p.at < SIGNUP_TTL_MS;

/** Тексты бота. По-русски: продукт только русский. HTML Telegram. */
export const SIGNUP_BOT = {
  ask: (company: string) =>
    `Регистрация в DevUz CallHelper: <b>${company}</b>.\n\nОсталось подтвердить номер телефона. Нажмите кнопку внизу: Telegram передаст нам ваш номер, вводить его не нужно.`,
  button: "📱 Подтвердить мой номер",
  stale: "Ссылка регистрации устарела. Заполните форму на странице CallHelper ещё раз, это минута.",
  closed: "Регистрация в CallHelper пока закрыта. Оставьте контакт в листе ожидания на сайте, напишем первыми.",
  foreign: "Нужен ваш собственный номер. Нажмите кнопку «📱 Подтвердить мой номер» внизу, а не отправляйте контакт из списка.",
  failed: "Не получилось завести доступ. Попробуйте ещё раз через минуту или напишите нам сюда.",
  done: (key: string, days: number, minutes: number, extUrl: string, cabinetUrl: string) =>
    [
      "Готово, доступ открыт.",
      "",
      `Ваш ключ (показываем один раз, сохраните):\n<code>${key}</code>`,
      "",
      `Пробный период: ${days} дня и ${minutes} минут разговора. Отсчёт начнётся с первого звонка.`,
      "",
      `1. Поставьте расширение для Chrome: ${extUrl}`,
      `2. Сценарии и итоги звонков: ${cabinetUrl}`,
      "",
      "Ключ никому не пересылайте: по нему идут ваши минуты.",
    ].join("\n"),
  refused: (reason: Exclude<TrialVerdict, { ok: true }>["reason"]) =>
    ({
      inn: "ИНН не прошёл проверку. Заполните форму на сайте ещё раз.",
      phone: "Telegram не передал номер. Нажмите кнопку «📱 Подтвердить мой номер» ещё раз.",
      used: "Эта компания, номер или Telegram уже пользовались пробным периодом. Напишите сюда, подключим тариф.",
      device: "С этого устройства недавно уже брали пробный период. Напишите сюда, подключим тариф.",
      ip: "Из вашей сети недавно уже брали пробный период. Напишите сюда, подключим тариф.",
    })[reason],
} as const;
