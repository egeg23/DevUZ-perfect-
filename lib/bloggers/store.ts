import { tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import { DEFAULT_SETTINGS, settingsFrom, type BloggerSettings, type Candidate, type Channel } from "@/lib/bloggers/rules";
import { spentCredits } from "@/lib/firecrawl";
import { serviceClient } from "@/lib/supabase";

/**
 * ИИ-сотрудник «Блогеры» — база: блогеры, настройки, расход Firecrawl.
 * Читает и пишет только сервер (RLS без политик, миграция 0103_bloggers).
 */

type Db = NonNullable<ReturnType<typeof serviceClient>>;

export const BLOGGER_STATUSES = [
  "found",
  "ready",
  "skipped",
  "queued",
  "contacted",
  "replied",
  "stats",
  "agreed",
  "partner",
  "declined",
  "unreachable",
] as const;
export type BloggerStatus = (typeof BLOGGER_STATUSES)[number];

export type BloggerMessage = { role: "blogger" | "agent" | "staff"; text: string; at: string; via?: string; disclosed?: boolean };

export type Blogger = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  website: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  engagement: number | null;
  posts_per_week: number | null;
  last_post_at: string | null;
  topics: string[];
  lang: string | null;
  city: string | null;
  fit: number | null;
  why: string | null;
  telegram: string | null;
  email: string | null;
  source: "firecrawl" | "ig" | "manual";
  source_url: string | null;
  found_query: string | null;
  metrics_from: "ig" | "search" | null;
  score: number | null;
  score_notes: string | null;
  status: BloggerStatus;
  channel: Channel | null;
  pitch: string | null;
  pitch_lang: "ru" | "uz" | null;
  contacted_at: string | null;
  contacted_by: string | null;
  replied_at: string | null;
  ig_scoped_id: string | null;
  /** Рабочий аккаунт Telegram, с которого ушло «Здравствуйте», и id блогера в Telegram. */
  tg_account: string | null;
  tg_user_id: string | null;
  tg_pending: string | null;
  tg_pending_at: string | null;
  /** До какого времени разговор ведёт человек — агент молчит. */
  human_until: string | null;
  /** Агенту пора ответить в Telegram (сообщение записал скаут). */
  agent_due_at: string | null;
  /** Скриншоты из Telegram до разбора, base64. */
  inbox_images: { mediaType: string; data: string }[] | null;
  messages: BloggerMessage[];
  audience: Record<string, unknown> | null;
  audience_score: number | null;
  audience_notes: string | null;
  partner_id: string | null;
  note: string | null;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
};

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

function shape(row: Record<string, unknown>): Blogger {
  return {
    ...(row as unknown as Blogger),
    avg_likes: num(row.avg_likes),
    avg_comments: num(row.avg_comments),
    engagement: num(row.engagement),
    posts_per_week: num(row.posts_per_week),
    topics: Array.isArray(row.topics) ? (row.topics as string[]) : [],
    messages: Array.isArray(row.messages) ? (row.messages as BloggerMessage[]) : [],
  };
}

/* ── Настройки ── */

const SETTINGS_KEY = "settings";

export async function loadSettings(): Promise<BloggerSettings> {
  const db = serviceClient();
  if (!db) return DEFAULT_SETTINGS;
  const { data } = await db.from("blogger_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  return settingsFrom(data?.value ?? null);
}

export async function saveSettings(settings: BloggerSettings): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("blogger_settings")
    .upsert({ key: SETTINGS_KEY, value: settings, updated_at: new Date().toISOString() });
  if (error) console.error("блогеры: настройки не сохранились —", error.message);
  return !error;
}

/* ── Блогеры ── */

export async function bloggersByStatus(statuses: readonly BloggerStatus[], limit = 100): Promise<Blogger[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("bloggers")
    .select("*")
    .in("status", [...statuses])
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => shape(r as Record<string, unknown>));
}

export async function statusCounts(): Promise<Record<BloggerStatus, number>> {
  const out = Object.fromEntries(BLOGGER_STATUSES.map((s) => [s, 0])) as Record<BloggerStatus, number>;
  const db = serviceClient();
  if (!db) return out;
  const { data } = await db.from("bloggers").select("status");
  for (const row of data ?? []) {
    const s = String(row.status) as BloggerStatus;
    if (s in out) out[s]++;
  }
  return out;
}

export async function bloggerById(id: string): Promise<Blogger | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db.from("bloggers").select("*").eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}

export async function bloggerByHandle(handle: string): Promise<Blogger | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("bloggers").select("*").eq("handle", handle).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}

/** Новые кандидаты из поиска. Уже известный ник второй раз не заводится. */
export async function addCandidates(candidates: readonly Candidate[], query: string): Promise<number> {
  const db = serviceClient();
  if (!db || !candidates.length) return 0;
  const rows = candidates.map((c) => ({
    handle: c.handle,
    name: c.metrics?.name ?? "",
    bio: c.bio,
    followers: c.metrics?.followers ?? null,
    following: c.metrics?.following ?? null,
    posts: c.metrics?.posts ?? null,
    metrics_from: c.metrics?.followers != null ? "search" : null,
    source: "firecrawl",
    source_url: c.sourceUrl.slice(0, 500),
    found_query: query.slice(0, 120),
  }));
  const { data, error } = await db.from("bloggers").upsert(rows, { onConflict: "handle", ignoreDuplicates: true }).select("id");
  if (error) console.error("блогеры: кандидаты не записались —", error.message);
  return data?.length ?? 0;
}

export async function addManual(handle: string, note: string | null): Promise<Blogger | null> {
  const db = serviceClient();
  if (!db) return null;
  const existing = await bloggerByHandle(handle);
  if (existing) return existing;
  const { data, error } = await db.from("bloggers").insert({ handle, source: "manual", note }).select("*").maybeSingle();
  if (error) console.error("блогеры: не завёл —", error.message);
  return data ? shape(data as Record<string, unknown>) : null;
}

export async function updateBlogger(id: string, patch: Partial<Omit<Blogger, "id" | "created_at">>): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("bloggers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("блогеры: не обновил —", error.message);
  return !error;
}

/** Начало сегодняшнего дня по Ташкенту — от него считаются дневные квоты. */
export function dayStart(now: Date): Date {
  return tashkentMidnight(todayInTashkent(now));
}

/** Сколько первых сообщений ушло сегодня: в Telegram — отдельно, руками (Direct и почта) — вместе. */
export async function sentToday(now: Date): Promise<{ telegram: number; manual: number }> {
  const db = serviceClient();
  if (!db) return { telegram: 0, manual: 0 };
  const { data } = await db.from("bloggers").select("channel").gte("contacted_at", dayStart(now).toISOString());
  let telegram = 0;
  let manual = 0;
  for (const row of data ?? []) (row.channel === "telegram" ? telegram++ : manual++);
  return { telegram, manual };
}

/* ── Firecrawl ── */

export async function firecrawlUsedToday(now: Date): Promise<{ all: number; bloggers: number }> {
  const db = serviceClient();
  if (!db) return { all: 0, bloggers: 0 };
  const { data } = await db.from("firecrawl_usage").select("kind, credits").gte("at", dayStart(now).toISOString());
  let all = 0;
  let bloggers = 0;
  for (const row of data ?? []) {
    const c = Number(row.credits ?? 0);
    all += c;
    if (row.kind === "bloggers") bloggers += c;
  }
  return { all, bloggers };
}

/** Когда каждым запросом искали в последний раз — чтобы идти по кругу. */
export async function queriesUsed(): Promise<Map<string, number>> {
  const db = serviceClient();
  const out = new Map<string, number>();
  if (!db) return out;
  const { data } = await db
    .from("firecrawl_usage")
    .select("target, at")
    .eq("kind", "bloggers")
    .order("at", { ascending: false })
    .limit(200);
  for (const row of data ?? []) {
    const t = String(row.target);
    if (!out.has(t)) out.set(t, Date.parse(String(row.at)));
  }
  return out;
}

export async function recordFirecrawl(db: Db | null, row: { credits: number; target: string; found: number; note?: string | null }): Promise<void> {
  const client = db ?? serviceClient();
  if (!client) return;
  const { error } = await client
    .from("firecrawl_usage")
    .insert({ kind: "bloggers", credits: row.credits, target: row.target.slice(0, 200), found: row.found, note: row.note?.slice(0, 300) ?? null });
  if (error) console.error("firecrawl: расход блогеров не записался —", error.message);
  spentCredits(row.credits);
}
