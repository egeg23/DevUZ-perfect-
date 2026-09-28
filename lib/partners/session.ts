import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import type { Locale } from "@/lib/i18n";
import { partnerById, type Partner } from "@/lib/partners/store";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Вход в кабинет партнёра.
 *
 * Владелец: «отдельный вход для партнёров… Авторизация через телеграм».
 * Сделано через бота, а не виджетом Telegram Login: виджет требует
 * привязать домен к боту в BotFather и не работает во встроенном браузере
 * мессенджера — а партнёр чаще всего открывает сайт именно оттуда. Бот
 * работает везде: кнопка «Войти через Telegram» открывает бота, бот
 * заводит партнёра (если его ещё нет) и присылает одноразовую ссылку.
 * Кто нажал — Telegram уже знает, и подтверждать это вторым способом не
 * нужно.
 *
 * В базе только хеши: утёкшая таблица не даёт войти ни одной строкой.
 */

export const PARTNER_COOKIE = "devuz_partner";
/** Ссылка из бота живёт минутами: её пересылают и забывают в чатах. */
export const LOGIN_TOKEN_MINUTES = 15;
/** Кабинет — не панель с чужими контактами: месяц без повторного входа. */
export const SESSION_DAYS = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

/** Одноразовая ссылка входа — для ответа бота. */
export async function loginLink(partner: Partner, locale: Locale): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const token = newToken();
  const { error } = await db.from("partner_login_tokens").insert({
    token_hash: hash(token),
    partner_id: partner.id,
    expires_at: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000).toISOString(),
  });
  if (error) return null;
  return `${siteUrl}/api/partners/enter?t=${token}&l=${locale}`;
}

/**
 * Погасить ссылку входа и вернуть, чья она. Одноразовая: второй переход по
 * той же ссылке (переслали в чат) ничего не даст. Гасится условной записью
 * «где ещё не использована» — две вкладки одновременно не войдут обе.
 */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const db = serviceClient();
  if (!db || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const { data } = await db
    .from("partner_login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hash(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("partner_id")
    .maybeSingle();
  return (data?.partner_id as string | undefined) ?? null;
}

/** Завести сессию — токен для куки. */
export async function openSession(partnerId: string): Promise<{ token: string; maxAge: number } | null> {
  const db = serviceClient();
  if (!db) return null;
  const token = newToken();
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const { error } = await db.from("partner_sessions").insert({
    token_hash: hash(token),
    partner_id: partnerId,
    expires_at: new Date(Date.now() + maxAge * 1000).toISOString(),
  });
  return error ? null : { token, maxAge };
}

/**
 * Кто сейчас в кабинете. Заблокированный партнёр — никто: кабинет
 * показывает деньги и ссылки, а блокировка значит «больше не партнёр».
 */
export async function currentPartner(): Promise<Partner | null> {
  const token = (await cookies()).get(PARTNER_COOKIE)?.value;
  if (!token) return null;
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("partner_sessions")
    .select("partner_id, expires_at, last_seen_at")
    .eq("token_hash", hash(token))
    .maybeSingle();
  if (!data || Date.parse(String(data.expires_at)) < Date.now()) return null;

  // Отметка «был» — не чаще раза в час: страница кабинета читается часто.
  const seen = data.last_seen_at ? Date.parse(String(data.last_seen_at)) : 0;
  if (Date.now() - seen > 60 * 60_000) {
    await db.from("partner_sessions").update({ last_seen_at: new Date().toISOString() }).eq("token_hash", hash(token));
  }

  const partner = await partnerById(String(data.partner_id));
  return partner && partner.status === "active" ? partner : null;
}

/** Выйти: сессия гаснет в базе, а не только кука в браузере. */
export async function closeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = serviceClient();
  if (!db) return;
  await db.from("partner_sessions").delete().eq("token_hash", hash(token));
}
