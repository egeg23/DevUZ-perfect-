import { profileStats, type Post, type ProfileStats } from "@/lib/bloggers/rules";
import { appSecret } from "@/lib/secrets";

/**
 * Цифры профиля блогера через Instagram Graph API — Business Discovery.
 *
 * Официальный способ узнать о чужом профессиональном аккаунте (бизнес или
 * автор) подписчиков, шапку, сайт и лайки с комментариями последних постов.
 * Работает только в «Instagram API с входом через Facebook» (graph.facebook.com),
 * не в том входе через Instagram, которым подключается Direct клиентов
 * сервиса (lib/ai-staff/instagram.ts): нужен Instagram-аккаунт студии,
 * привязанный к странице Facebook, и токен с правами instagram_basic и
 * pages_read_engagement (docs/ai-staff/bloggers.md, что сделать владельцу).
 *
 * Сверено с developers.facebook.com/docs/instagram-platform/
 * instagram-api-with-facebook-login/business-discovery (11.10.2026). Личный
 * аккаунт (не бизнес и не автор) Business Discovery не отдаёт — тогда
 * остаются цифры из выдачи поиска.
 */

export const FB_GRAPH = "https://graph.facebook.com/v25.0";

export type DiscoveryConfig = { igUserId: string; token: string };

export async function discoveryConfig(): Promise<DiscoveryConfig | null> {
  const [igUserId, token] = await Promise.all([appSecret("BLOGGERS_IG_USER_ID"), appSecret("BLOGGERS_FB_TOKEN")]);
  return igUserId && token ? { igUserId, token } : null;
}

export type Profile = ProfileStats & {
  handle: string;
  name: string;
  bio: string;
  website: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  captions: string[];
};

const FIELDS =
  "username,name,biography,website,followers_count,follows_count,media_count," +
  "media.limit(12){caption,like_count,comments_count,timestamp}";

export function discoveryUrl(cfg: DiscoveryConfig, handle: string): string {
  const fields = `business_discovery.username(${handle}){${FIELDS}}`;
  return `${FB_GRAPH}/${encodeURIComponent(cfg.igUserId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(cfg.token)}`;
}

type Raw = {
  username?: string;
  name?: string;
  biography?: string;
  website?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  media?: { data?: Array<{ caption?: string; like_count?: number; comments_count?: number; timestamp?: string }> };
};

/** Ответ Business Discovery → профиль. Чистая функция — её проверяет тест. */
export function profileFrom(handle: string, raw: Raw, now = Date.now()): Profile {
  const media = raw.media?.data ?? [];
  const posts: Post[] = media.map((m) => ({
    likes: typeof m.like_count === "number" ? m.like_count : null,
    comments: typeof m.comments_count === "number" ? m.comments_count : null,
    at: m.timestamp ? Date.parse(m.timestamp) : Number.NaN,
  }));
  const followers = typeof raw.followers_count === "number" ? raw.followers_count : null;
  return {
    handle,
    name: String(raw.name ?? "").slice(0, 120),
    bio: String(raw.biography ?? "").slice(0, 1000),
    website: raw.website ? String(raw.website).slice(0, 300) : null,
    followers,
    following: typeof raw.follows_count === "number" ? raw.follows_count : null,
    posts: typeof raw.media_count === "number" ? raw.media_count : null,
    captions: media.map((m) => String(m.caption ?? "").slice(0, 400)).filter(Boolean),
    ...profileStats(followers, posts, now),
  };
}

export type DiscoveryResult = { ok: true; profile: Profile } | { ok: false; reason: "no_config" | "not_found" | "failed"; detail?: string };

/** Профиль блогера. Ключей нет — ни одного запроса. */
export async function discover(handle: string, fetchImpl: typeof fetch = fetch): Promise<DiscoveryResult> {
  const cfg = await discoveryConfig();
  if (!cfg) return { ok: false, reason: "no_config" };
  try {
    const response = await fetchImpl(discoveryUrl(cfg, handle), { signal: AbortSignal.timeout(15_000), cache: "no-store" });
    const body = (await response.json().catch(() => null)) as { business_discovery?: Raw; error?: { message?: string; code?: number } } | null;
    if (body?.business_discovery) return { ok: true, profile: profileFrom(handle, body.business_discovery) };
    // 110 / 100: такого профессионального аккаунта нет — личный или ник сменился.
    const code = body?.error?.code;
    if (code === 110 || code === 100) return { ok: false, reason: "not_found", detail: body?.error?.message };
    return { ok: false, reason: "failed", detail: body?.error?.message ?? `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, reason: "failed", detail: (error as Error).message };
  }
}
