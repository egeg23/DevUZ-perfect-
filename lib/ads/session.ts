import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { memberById, membershipsOf, workspaceById, type Member, type Workspace } from "@/lib/ads/store";
import { serviceClient } from "@/lib/supabase";

/**
 * Вход в кабинет автопилота рекламы — как у партнёров (lib/partners/session.ts):
 * кнопка «Войти через Telegram» открывает бота (`/start ads`), бот находит
 * человека среди участников кабинетов и присылает одноразовую ссылку.
 * Постороннему бот отвечает так же, как на неизвестную команду: проверять
 * через бота, кто клиент студии, нельзя.
 *
 * В базе только хеши: утёкшая таблица не даёт войти ни одной строкой.
 */

export const ADS_COOKIE = "devuz_ads";
export const LOGIN_TOKEN_MINUTES = 15;
export const SESSION_DAYS = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://devuz.studio";
}

/** Одноразовая ссылка входа для участника; null — базы нет. */
export async function adsLoginLink(member: Member): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const token = newToken();
  const { error } = await db.from("ads_login_tokens").insert({
    token_hash: hash(token),
    member_id: member.id,
    expires_at: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000).toISOString(),
  });
  return error ? null : `${siteBase()}/api/ads/enter?t=${token}`;
}

export async function consumeAdsToken(token: string): Promise<string | null> {
  const db = serviceClient();
  if (!db || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const { data } = await db
    .from("ads_login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hash(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("member_id")
    .maybeSingle();
  return (data?.member_id as string | undefined) ?? null;
}

export async function openAdsSession(memberId: string): Promise<{ token: string; maxAge: number } | null> {
  const db = serviceClient();
  if (!db) return null;
  const token = newToken();
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const { error } = await db.from("ads_sessions").insert({
    token_hash: hash(token),
    member_id: memberId,
    expires_at: new Date(Date.now() + maxAge * 1000).toISOString(),
  });
  return error ? null : { token, maxAge };
}

export async function closeAdsSession(token: string | undefined): Promise<void> {
  const db = serviceClient();
  if (!token || !db) return;
  await db.from("ads_sessions").delete().eq("token_hash", hash(token));
}

export type AdsViewer = { member: Member; workspace: Workspace };

/**
 * Кто в кабинете. Участника убрали из кабинета — сессия больше ничего не
 * открывает (строка участника удалена, сессия ушла каскадом).
 */
export async function currentAdsViewer(): Promise<AdsViewer | null> {
  const token = (await cookies()).get(ADS_COOKIE)?.value;
  const db = serviceClient();
  if (!token || !db) return null;
  const { data } = await db.from("ads_sessions").select("member_id, expires_at, last_seen_at").eq("token_hash", hash(token)).maybeSingle();
  if (!data || Date.parse(String(data.expires_at)) < Date.now()) return null;
  const seen = data.last_seen_at ? Date.parse(String(data.last_seen_at)) : 0;
  if (Date.now() - seen > 60 * 60_000) {
    await db.from("ads_sessions").update({ last_seen_at: new Date().toISOString() }).eq("token_hash", hash(token));
  }
  const member = await memberById(String(data.member_id));
  if (!member) return null;
  const workspace = await workspaceById(member.workspace_id);
  return workspace ? { member, workspace } : null;
}

/** Для бота: участник по Telegram id (первый кабинет, если их несколько). */
export async function memberForTelegram(telegramUserId: number): Promise<Member | null> {
  const list = await membershipsOf(telegramUserId);
  return list[0] ?? null;
}
