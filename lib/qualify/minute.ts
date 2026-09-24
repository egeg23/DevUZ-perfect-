import { createHmac, timingSafeEqual } from "node:crypto";

import { isLocale, type Locale } from "@/lib/i18n";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Минута на скидку.
 *
 * Владелец: «60 секунд на то, чтобы написать нашему ассистенту на сайте или
 * в Telegram. Тогда скидка 30% закрепляется за человеком. По окончании
 * таймера остаётся только механика ответа за 20 секунд».
 *
 * Как это устроено:
 *
 * 1. Человек впервые открывает сайт — сервер выдаёт подписанное «окно»
 *    (`mn_…`): время выдачи и подпись. Браузер запоминает его и ведёт
 *    отсчёт. Перезагрузка страницы минуту не перезапускает — окно одно на
 *    браузер.
 * 2. Первое сообщение ассистенту приносит окно обратно. Сервер проверяет
 *    подпись и время и выдаёт «закрепление» (`mc_…`) — тоже подписанное.
 *    Оно и есть скидка: браузер хранит его и предъявляет в каждом следующем
 *    разговоре, хоть через неделю.
 * 3. В Telegram окно едет в ссылке `?start=mn_…`. Бот проверяет его, и
 *    закрепление ложится в базу за чатом — сессии бота живут в памяти и
 *    теряются при выкатке, а скидка теряться не должна.
 *
 * Подпись — чтобы «скидка моя» нельзя было написать себе самому: время
 * проверяет сервер, а не браузер. Поддельное окно не пройдёт, настоящее
 * после минуты — тоже.
 *
 * Длина минуты — `FIRST_MINUTE_SECONDS` (60 по умолчанию, 0 выключает):
 * доля скидок — решение про деньги, как и `PROMISE_MISS_EVERY`.
 */

export const MINUTE_PREFIX = "mn_";
const CLAIM_PREFIX = "mc_";

/** Сеть и часы: запрос, отправленный на последней секунде, приходит чуть позже. */
export const SITE_GRACE_MS = 5_000;
/**
 * Telegram ещё нужно открыть: человек нажал ссылку на 55-й секунде, а
 * «Старт» в приложении — на 70-й. Нажатие ссылки и есть его «написал», и
 * наказывать за медленный телефон нечестно.
 */
export const TELEGRAM_GRACE_MS = 30_000;

/** Закрепление живёт год: скидка «на первый проект», а проект редко начинается в тот же день. */
const CLAIM_TTL_MS = 365 * 24 * 3600_000;

export function minuteSeconds(): number {
  const raw = process.env.FIRST_MINUTE_SECONDS?.trim();
  if (!raw) return 60;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 60;
  return Math.min(Math.floor(n), 600);
}

/** Ключ подписи — из .env или из хранилища секретов. Нет ключа — нет и минуты. */
export function minuteKey(): Promise<string | null> {
  return appSecret("DISCOUNT_SIGNING_SECRET");
}

function mac(key: string, kind: "window" | "claim", at: number): string {
  // 80 бит подписи: подбирать их перебором через rate limit — дольше, чем
  // жить закреплению.
  return createHmac("sha256", key).update(`devuz:minute:${kind}:${at}`).digest("hex").slice(0, 20);
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Время из токена, если подпись наша; иначе null. */
function openToken(token: unknown, prefix: string, kind: "window" | "claim", key: string): number | null {
  if (typeof token !== "string" || token.length > 64 || !token.startsWith(prefix)) return null;
  const [rawAt, sig] = token.slice(prefix.length).split("_");
  if (!rawAt || !sig || !/^[0-9a-z]{1,10}$/.test(rawAt) || !/^[0-9a-f]{20}$/.test(sig)) return null;
  const at = Number.parseInt(rawAt, 36);
  if (!Number.isSafeInteger(at) || !same(sig, mac(key, kind, at))) return null;
  return at;
}

function makeToken(prefix: string, kind: "window" | "claim", key: string, now: number): string {
  const at = Math.floor(now / 1000);
  return `${prefix}${at.toString(36)}_${mac(key, kind, at)}`;
}

/* ── Чистые функции с ключом: их проверяют тесты ───────────────────────── */

export function issueWindow(key: string, now = Date.now()): string {
  return makeToken(MINUTE_PREFIX, "window", key, now);
}

/**
 * Закрепить скидку по окну. Возвращает закрепление или null — окно чужое,
 * битое или минута уже вышла.
 */
export function claimWindow(
  key: string,
  token: unknown,
  seconds: number,
  graceMs: number,
  now = Date.now(),
): string | null {
  if (seconds <= 0) return null;
  const at = openToken(token, MINUTE_PREFIX, "window", key);
  if (at === null) return null;
  const issued = at * 1000;
  // Окно из будущего — чужие часы или подделка; и то и другое мимо.
  if (issued > now + 60_000) return null;
  if (now > issued + seconds * 1000 + graceMs) return null;
  return makeToken(CLAIM_PREFIX, "claim", key, now);
}

export function validClaim(key: string, token: unknown, now = Date.now()): boolean {
  const at = openToken(token, CLAIM_PREFIX, "claim", key);
  if (at === null) return false;
  const claimed = at * 1000;
  return claimed <= now + 60_000 && now - claimed <= CLAIM_TTL_MS;
}

/**
 * Параметр `/start` из ссылки на бота: окно и язык сайта.
 *
 * Язык едет рядом — как в токене передачи разговора: человек с узбекской
 * версии сайта и русским Telegram должен услышать бота по-узбекски.
 */
export function telegramPayload(token: string, locale: Locale): string {
  return `${token}_${locale}`;
}

export function parseTelegramPayload(payload: string): { token: string; locale: Locale | null } | null {
  if (!payload.startsWith(MINUTE_PREFIX)) return null;
  const parts = payload.split("_");
  // mn, время, подпись[, язык]
  if (parts.length < 3 || parts.length > 4) return null;
  const token = parts.slice(0, 3).join("_");
  const locale = parts[3] && isLocale(parts[3]) ? (parts[3] as Locale) : null;
  return { token, locale };
}

/* ── То же с ключом из хранилища: для маршрутов и бота ─────────────────── */

export async function openMinute(now = Date.now()): Promise<{ token: string; seconds: number } | null> {
  const seconds = minuteSeconds();
  if (seconds <= 0) return null;
  const key = await minuteKey();
  if (!key) return null;
  return { token: issueWindow(key, now), seconds };
}

export async function claimMinute(token: unknown, graceMs: number, now = Date.now()): Promise<string | null> {
  if (typeof token !== "string") return null;
  const key = await minuteKey();
  if (!key) return null;
  return claimWindow(key, token, minuteSeconds(), graceMs, now);
}

export async function checkClaim(token: unknown, now = Date.now()): Promise<boolean> {
  if (typeof token !== "string") return false;
  const key = await minuteKey();
  if (!key) return false;
  return validClaim(key, token, now);
}

/* ── Закрепление за чатом в Telegram ───────────────────────────────────── */

/** Скидка закреплена за этим чатом бота. Ошибка базы — «нет», но не падение разговора. */
export async function minuteClaimed(chatId: number): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db.from("discount_claims").select("chat_id").eq("chat_id", chatId).maybeSingle();
  if (error) console.error("минута: база не ответила про закрепление", error.message);
  return Boolean(data);
}

export async function rememberMinuteClaim(chatId: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  // Повторное закрепление не двигает дату: первая минута была одна.
  const { error } = await db
    .from("discount_claims")
    .upsert({ chat_id: chatId, reason: "minute" }, { onConflict: "chat_id", ignoreDuplicates: true });
  if (error) console.error("минута: закрепление не записалось", error.message);
}
