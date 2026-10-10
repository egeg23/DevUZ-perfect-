import { createHmac } from "node:crypto";

import { openToken, randomKey, safeEqual, sealToken } from "@/lib/ai-staff/crypto";
import { handleIncoming, humanReplied } from "@/lib/ai-staff/service";
import * as store from "@/lib/ai-staff/store";
import { appSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

/**
 * Instagram Direct — Instagram API с входом через Instagram (Meta, v25.0).
 *
 * Instagram — второй канал продаж в Узбекистане по охвату (research.md,
 * 1.1): покупатели пишут в Direct под постом и в профиль. Механика та же,
 * что у Telegram Business: ИИ отвечает от имени профессионального аккаунта
 * клиента, только на входящие и только в течение 24 часов после сообщения
 * покупателя; владелец ответил сам — ИИ молчит в этом чате 12 часов.
 *
 * Сверено с developers.facebook.com/docs/instagram-platform (10.10.2026):
 * вход — instagram.com/oauth/authorize, обмен кода — api.instagram.com,
 * долгий токен на 60 дней и его продление — graph.instagram.com, вебхук
 * подписан X-Hub-Signature-256 секретом приложения, текст ответа — до 1000
 * байт. Чтобы приложение получало сообщения чужих аккаунтов, Meta требует
 * проверку бизнеса и одобрение разрешения instagram_business_manage_messages
 * (docs/ai-staff/pilot.md).
 */

export const IG_API = "https://graph.instagram.com/v25.0";
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_messages"];
export const IG_MAX_BYTES = 1000;
export const IG_REDIRECT_PATH = "/cabinet/instagram/callback";

export type IgConfig = { appId: string; appSecret: string; verifyToken: string };

export async function igConfig(): Promise<IgConfig | null> {
  const [appId, secret, verify] = await Promise.all([
    appSecret("AI_STAFF_IG_APP_ID"),
    appSecret("AI_STAFF_IG_APP_SECRET"),
    appSecret("AI_STAFF_IG_VERIFY_TOKEN"),
  ]);
  return appId && secret && verify ? { appId, appSecret: secret, verifyToken: verify } : null;
}

/* ── Вход: state подписан ключом сервиса и живёт 15 минут ── */

const STATE_TTL_MS = 15 * 60_000;

export function signState(tenantId: string, key: string, now = Date.now()): string {
  const body = `${tenantId}.${randomKey(9)}.${now}`;
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readState(state: string, key: string, now = Date.now()): string | null {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [tenantId, nonce, at, mac] = parts;
  const want = createHmac("sha256", key).update(`${tenantId}.${nonce}.${at}`).digest("base64url");
  if (!safeEqual(mac, want)) return null;
  if (!(now - Number(at) >= 0 && now - Number(at) < STATE_TTL_MS)) return null;
  return /^[0-9a-f-]{36}$/.test(tenantId) ? tenantId : null;
}

export function authorizeUrl(appId: string, state: string): string {
  const q = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${siteUrl}${IG_REDIRECT_PATH}`,
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${q}`;
}

/* ── Вебхук ── */

/** Подпись Meta: sha256=HMAC(секрет приложения, сырое тело). */
export function validSignature(raw: string, header: string | null, secret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const want = createHmac("sha256", secret).update(raw).digest("hex");
  return safeEqual(header.slice(7).toLowerCase(), want);
}

export type IgEvent = {
  /** Профессиональный аккаунт клиента (entry.id) — по нему ищется канал. */
  igId: string;
  /** Собеседник: покупатель (для эха — получатель). */
  peerId: string;
  mid: string;
  text: string;
  media: boolean;
  /** Сообщение отправил сам аккаунт клиента (человек или наш ответ). */
  echo: boolean;
  at: number;
};

type Messaging = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; is_deleted?: boolean; attachments?: unknown[] };
};

export function parseEvents(payload: unknown): IgEvent[] {
  const p = (payload ?? {}) as { object?: string; entry?: Array<{ id?: string; messaging?: Messaging[] }> };
  if (p.object !== "instagram" || !Array.isArray(p.entry)) return [];
  const out: IgEvent[] = [];
  for (const entry of p.entry) {
    for (const m of entry.messaging ?? []) {
      const message = m.message;
      if (!entry.id || !message?.mid || message.is_deleted) continue;
      const echo = message.is_echo === true;
      const peerId = echo ? m.recipient?.id : m.sender?.id;
      if (!peerId) continue;
      out.push({
        igId: String(entry.id),
        peerId: String(peerId),
        mid: message.mid,
        text: typeof message.text === "string" ? message.text.trim() : "",
        media: Array.isArray(message.attachments) && message.attachments.length > 0,
        echo,
        at: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
      });
    }
  }
  return out;
}

/**
 * Ответ кусками до 1000 байт: Instagram длиннее не принимает. Режем по
 * абзацам и предложениям, а не посреди слова; кириллица — два байта на букву.
 */
export function chunks(text: string, max = IG_MAX_BYTES): string[] {
  const bytes = (s: string) => Buffer.byteLength(s, "utf8");
  const out: string[] = [];
  let current = "";
  const pieces = text.split(/(?<=[.!?\n])\s+/);
  for (const piece of pieces) {
    const next = current ? `${current} ${piece}` : piece;
    if (bytes(next) <= max) {
      current = next;
      continue;
    }
    if (current) out.push(current);
    current = piece;
    while (bytes(current) > max) {
      let cut = current.length;
      while (bytes(current.slice(0, cut)) > max) cut = Math.floor(cut * 0.9);
      const space = current.lastIndexOf(" ", cut);
      const at = space > cut / 2 ? space : cut;
      out.push(current.slice(0, at).trim());
      current = current.slice(at).trim();
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** Наши ответы за последние минуты — чтобы эхо собственного ответа не сочли ответом человека. */
const sent = new Map<string, number>();
const SENT_TTL_MS = 10 * 60_000;

export function rememberSent(mid: string, now = Date.now()): void {
  sent.set(mid, now);
  if (sent.size > 2000) for (const [k, at] of sent) if (now - at > SENT_TTL_MS) sent.delete(k);
}

export function sentByUs(mid: string, now = Date.now()): boolean {
  const at = sent.get(mid);
  return at !== undefined && now - at < SENT_TTL_MS;
}

/**
 * Эхо — наш ли это ответ? По id сообщения, а если эхо обогнало ответ API —
 * по тексту: он совпадает с началом последнего ответа ИИ в разговоре.
 */
export function echoIsOurs(event: IgEvent, lastAiText: string | null, now = Date.now()): boolean {
  if (sentByUs(event.mid, now)) return true;
  if (!lastAiText || !event.text) return false;
  return lastAiText.replace(/\s+/g, " ").includes(event.text.replace(/\s+/g, " ").slice(0, 200));
}

export async function sendIg(
  token: string,
  recipientId: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const mids: string[] = [];
  for (const part of chunks(text)) {
    try {
      const response = await fetchImpl(`${IG_API}/me/messages`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ recipient: { id: recipientId }, message: { text: part } }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await response.json().catch(() => null)) as { message_id?: string; error?: { message?: string } } | null;
      if (!response.ok || !data?.message_id) {
        console.error("ai-staff: Instagram не принял ответ", response.status, data?.error?.message);
        break;
      }
      rememberSent(data.message_id);
      mids.push(data.message_id);
    } catch (error) {
      console.error("ai-staff: Instagram недоступен", (error as Error).message);
      break;
    }
  }
  return mids;
}

/* ── Обмен кода и продление токена ── */

export type IgAccount = { token: string; expiresAt: Date; igId: string; username: string };

export async function exchangeCode(cfg: IgConfig, code: string, fetchImpl: typeof fetch = fetch): Promise<IgAccount | null> {
  const form = new URLSearchParams({
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    grant_type: "authorization_code",
    redirect_uri: `${siteUrl}${IG_REDIRECT_PATH}`,
    code: code.replace(/#_$/, ""),
  });
  const short = await fetchImpl("https://api.instagram.com/oauth/access_token", { method: "POST", body: form })
    .then((r) => r.json())
    .catch(() => null);
  const shortToken: string | undefined = short?.access_token ?? short?.data?.[0]?.access_token;
  if (!shortToken) return null;
  const long = await fetchImpl(
    `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: cfg.appSecret, access_token: shortToken })}`,
  )
    .then((r) => r.json())
    .catch(() => null);
  if (!long?.access_token) return null;
  const me = await fetchImpl(`${IG_API}/me?fields=user_id,username&access_token=${encodeURIComponent(long.access_token)}`)
    .then((r) => r.json())
    .catch(() => null);
  if (!me?.user_id) return null;
  // Подписать аккаунт на сообщения: без этого вебхук о нём молчит.
  await fetchImpl(`${IG_API}/me/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(long.access_token)}`, { method: "POST" }).catch(
    () => null,
  );
  return {
    token: long.access_token,
    expiresAt: new Date(Date.now() + Number(long.expires_in ?? 5_184_000) * 1000),
    igId: String(me.user_id),
    username: String(me.username ?? me.user_id),
  };
}

/** Свип: продлить токены, которым осталось меньше 15 дней. До 50 за проход. */
export async function refreshInstagramTokens(now = new Date(), fetchImpl: typeof fetch = fetch): Promise<{ refreshed: number; failed: number }> {
  const key = await appSecret("AI_STAFF_KEY");
  if (!key || !(await igConfig())) return { refreshed: 0, failed: 0 };
  let refreshed = 0;
  let failed = 0;
  for (const channel of await store.instagramChannelsExpiring(new Date(now.getTime() + 15 * 86_400_000))) {
    const token = channel.token_enc ? openToken(channel.token_enc, key) : null;
    const data = token
      ? await fetchImpl(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)
          .then((r) => r.json())
          .catch(() => null)
      : null;
    if (data?.access_token) {
      await store.setChannelToken(channel.tenant_id, channel.id, sealToken(data.access_token, key), new Date(now.getTime() + Number(data.expires_in ?? 5_184_000) * 1000));
      refreshed++;
    } else {
      failed++;
      if (channel.token_expires_at && Date.parse(channel.token_expires_at) < now.getTime()) {
        await store.setChannelStatus(channel.tenant_id, channel.id, "error", "token_expired");
      }
    }
  }
  return { refreshed, failed };
}

/* ── Входящее ── */

export async function handleInstagramEvent(event: IgEvent): Promise<void> {
  const channel = await store.channelByExternal("instagram", event.igId);
  if (!channel || channel.status !== "active" || !channel.token_enc) return;
  const key = await appSecret("AI_STAFF_KEY");
  const token = key ? openToken(channel.token_enc, key) : null;
  if (!token) return;

  if (event.echo) {
    if (sentByUs(event.mid)) return;
    const conv = await store
      .openConversation(channel.tenant_id, { kind: "instagram", chatKey: event.peerId, channelId: channel.id, customerName: "", customerHandle: null, lang: "ru" })
      .catch(() => null);
    const lastAi = conv?.messages.filter((m) => m.role === "ai").at(-1)?.text ?? null;
    if (echoIsOurs(event, lastAi)) return;
    if (event.text) await humanReplied({ tenantId: channel.tenant_id, chatKey: event.peerId, channel, text: event.text, kind: "instagram" });
    return;
  }

  const outcome = await handleIncoming({
    tenantId: channel.tenant_id,
    channel,
    kind: "instagram",
    chatKey: event.peerId,
    text: event.text,
    media: event.media,
    customer: { name: "", handle: null },
    sentAt: new Date(event.at),
  });
  const reply = outcome.kind === "reply" ? outcome.text : outcome.kind === "stopped" ? outcome.text : null;
  if (reply) await sendIg(token, event.peerId, reply);
}
