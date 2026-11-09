import { record } from "@/lib/admin/audit";
import { opens } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { LINK_STATES, isPlatform, publishedUrl, type LinkState, type Platform, type Via } from "@/lib/outside/posts";
import { serviceClient } from "@/lib/supabase";

/**
 * Статьи на площадках — база (таблица outside_posts, миграция 0181).
 *
 * Таблицы нет (миграцию ещё не применили) — чтение отдаёт null, запись
 * ничего не делает: раздел пишет «ещё не включено», неделя не начинается и
 * слот недели не сгорает.
 */

/** 'sent' — отдан в Postiz, ссылку на вышедший пост свип заберёт потом (миграция 0182). */
export type PostStatus = "ready" | "sent" | "published" | "skipped";

export type OutsidePost = {
  id: string;
  platform: Platform;
  topic_key: string;
  query: string;
  title: string;
  body: string;
  status: PostStatus;
  created_at: string;
  published_url: string | null;
  published_at: string | null;
  published_by: string | null;
  skipped_at: string | null;
  link_checked_at: string | null;
  link_state: LinkState | null;
  link_rel: string | null;
  /** Как ушла сама: Telegraph или Postiz; null — руками. */
  via: Exclude<Via, "hand"> | null;
  external_id: string | null;
  sent_at: string | null;
  /** Почему сама не вышла — черновик тогда публикует человек. */
  publish_error: string | null;
};

const COLUMNS =
  "id, platform, topic_key, query, title, body, status, created_at, published_url, published_at, published_by, skipped_at, link_checked_at, link_state, link_rel, via, external_id, sent_at, publish_error";

function asPost(row: Record<string, unknown>): OutsidePost | null {
  if (!isPlatform(row.platform)) return null;
  const state = (LINK_STATES as readonly string[]).includes(String(row.link_state)) ? (row.link_state as LinkState) : null;
  return {
    id: String(row.id),
    platform: row.platform,
    topic_key: String(row.topic_key ?? ""),
    query: String(row.query ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    status: row.status === "published" || row.status === "skipped" || row.status === "sent" ? row.status : "ready",
    created_at: String(row.created_at ?? ""),
    published_url: typeof row.published_url === "string" ? row.published_url : null,
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    published_by: typeof row.published_by === "string" ? row.published_by : null,
    skipped_at: typeof row.skipped_at === "string" ? row.skipped_at : null,
    link_checked_at: typeof row.link_checked_at === "string" ? row.link_checked_at : null,
    link_state: state,
    link_rel: typeof row.link_rel === "string" ? row.link_rel : null,
    via: row.via === "telegraph" || row.via === "postiz" ? row.via : null,
    external_id: typeof row.external_id === "string" ? row.external_id : null,
    sent_at: typeof row.sent_at === "string" ? row.sent_at : null,
    publish_error: typeof row.publish_error === "string" ? row.publish_error : null,
  };
}

/** Колонки до миграции 0182 — на случай, если код выкатили раньше неё. */
const COLUMNS_0181 =
  "id, platform, topic_key, query, title, body, status, created_at, published_url, published_at, published_by, skipped_at, link_checked_at, link_state, link_rel";

/** Все статьи, новые сверху. null — таблицы нет или база не ответила. */
export async function listPosts(limit = 200): Promise<OutsidePost[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const query = (columns: string) => db.from("outside_posts").select(columns).order("created_at", { ascending: false }).limit(limit);
  let { data, error } = await query(COLUMNS);
  if (error) ({ data, error } = await query(COLUMNS_0181));
  if (error) return null;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(asPost).filter((p): p is OutsidePost => Boolean(p));
}

export type NewPost = {
  platform: Platform;
  topic_key: string;
  query: string;
  title: string;
  body: string;
  research: unknown;
  model: string;
};

/** Новый черновик: номер строки или ошибка базы. */
export async function savePost(post: NewPost): Promise<{ id: string } | { error: string }> {
  const db = serviceClient();
  if (!db) return { error: "база недоступна" };
  const { data, error } = await db.from("outside_posts").insert({ ...post, status: "ready" }).select("id").single();
  if (error || !data) return { error: error?.message ?? "строка не вернулась" };
  return { id: String(data.id) };
}

/* ── Сами: Telegraph и Postiz ──────────────────────────────────────────── */

/** Telegraph ответил ссылкой — статья вышла. Ссылка — только с адреса площадки. */
export async function markAutoPublished(id: string, platform: Platform, via: "telegraph" | "postiz", raw: string, now = new Date()): Promise<boolean> {
  const url = publishedUrl(platform, raw);
  const db = serviceClient();
  if (!url || !db) return false;
  const { error } = await db
    .from("outside_posts")
    .update({ status: "published", via, published_url: url, published_at: now.toISOString(), publish_error: null })
    .eq("id", id)
    .in("status", ["ready", "sent"]);
  return !error;
}

/** Отдан в Postiz: ждём, когда площадка опубликует, — номер поста в Postiz. */
export async function markAutoSent(id: string, externalId: string, now = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("outside_posts")
    .update({ status: "sent", via: "postiz", external_id: externalId.slice(0, 100), sent_at: now.toISOString(), publish_error: null })
    .eq("id", id)
    .eq("status", "ready");
  return !error;
}

/**
 * Сама не вышла: черновик возвращается в «Ждут публикации» с причиной —
 * дальше его публикует человек, как vc.ru.
 */
export async function markAutoFailed(id: string, reason: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("outside_posts")
    .update({ status: "ready", publish_error: reason.slice(0, 300) })
    .eq("id", id)
    .in("status", ["ready", "sent"]);
}

/** Отданные в Postiz и ещё без ссылки — их свип сверяет с Postiz. */
export async function sentPosts(limit = 20): Promise<OutsidePost[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db.from("outside_posts").select(COLUMNS).eq("status", "sent").order("sent_at", { ascending: true }).limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => asPost(r as Record<string, unknown>)).filter((p): p is OutsidePost => Boolean(p));
}

async function readyPost(id: string): Promise<OutsidePost | null> {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("outside_posts").select(COLUMNS).eq("id", id).maybeSingle();
  const post = data ? asPost(data as Record<string, unknown>) : null;
  return post?.status === "ready" ? post : null;
}

/**
 * «Опубликовал»: ссылка на статью — только с адреса этой площадки. Отмечает
 * любой, кому открыт раздел: публикует тот, у кого аккаунт площадки.
 */
export async function markPublished(staff: Staff, id: string, raw: string, ip: string): Promise<"ok" | "bad" | "missing" | "failed"> {
  if (!opens(staff, "/admin/outside")) return "failed";
  const post = await readyPost(id);
  if (!post) return "missing";
  const url = publishedUrl(post.platform, raw.slice(0, 500));
  if (!url) return "bad";
  const db = serviceClient();
  if (!db) return "failed";
  const { error } = await db
    .from("outside_posts")
    .update({ status: "published", published_url: url, published_at: new Date().toISOString(), published_by: staff.id })
    .eq("id", id)
    .eq("status", "ready");
  if (error) return "failed";
  await record("outside.published", { actorStaffId: staff.id, targetType: "outside_post", targetId: id, meta: { platform: post.platform, topic: post.topic_key, url }, ip });
  return "ok";
}

/** «Пропустить»: черновик не нужен — площадка получит новый на следующей неделе. */
export async function skipPost(staff: Staff, id: string, ip: string): Promise<"ok" | "missing" | "failed"> {
  if (!opens(staff, "/admin/outside")) return "failed";
  const post = await readyPost(id);
  if (!post) return "missing";
  const db = serviceClient();
  if (!db) return "failed";
  const { error } = await db
    .from("outside_posts")
    .update({ status: "skipped", skipped_at: new Date().toISOString(), skipped_by: staff.id })
    .eq("id", id)
    .eq("status", "ready");
  if (error) return "failed";
  await record("outside.skipped", { actorStaffId: staff.id, targetType: "outside_post", targetId: id, meta: { platform: post.platform, topic: post.topic_key }, ip });
  return "ok";
}

/** Опубликованные — на проверку ссылки (решает checkDue, здесь только кандидаты). */
export async function publishedPosts(limit = 100): Promise<OutsidePost[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("outside_posts")
    .select(COLUMNS)
    .eq("status", "published")
    .order("link_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => asPost(r as Record<string, unknown>)).filter((p): p is OutsidePost => Boolean(p));
}

export async function saveLinkCheck(id: string, state: LinkState, rel: string | null, now: Date): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outside_posts").update({ link_state: state, link_rel: rel?.slice(0, 100) ?? null, link_checked_at: now.toISOString() }).eq("id", id);
}

/* ── Кто публикует ─────────────────────────────────────────────────────── */

/** Активные сотрудники: имя и открыт ли им раздел — для «Кто публикует» и подписей. */
export async function outsidePeople(): Promise<{ id: string; name: string; opens: boolean }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("staff").select("id, display_name, role, section_access").eq("is_active", true).order("display_name");
  return (data ?? []).map((s) => ({
    id: String(s.id),
    name: String(s.display_name ?? "без имени"),
    opens: opens({ role: s.role, section_access: s.section_access ?? undefined }, "/admin/outside"),
  }));
}

/** Строка stats_snapshots: кому идёт карточка недели. Пусто — владельцу и руководителю. */
export const PUBLISHER_KEY = "outside-publisher";

/** Выбирают руководитель и владелец. */
export function mayChoosePublisher(staff: Pick<Staff, "role">): boolean {
  return staff.role === "admin" || staff.role === "head";
}

export async function readPublisher(): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", PUBLISHER_KEY).maybeSingle();
  const id = (data?.payload as { staff?: unknown } | null)?.staff;
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

/** Тот, кого выбрали, должен видеть раздел: иначе карточка вела бы в закрытую страницу. */
export async function setPublisher(staff: Staff, chosen: string | null, ip: string): Promise<"ok" | "forbidden" | "bad" | "failed"> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const db = serviceClient();
  if (!db) return "failed";
  if (chosen) {
    if (!/^[0-9a-f-]{36}$/i.test(chosen)) return "bad";
    const { data } = await db
      .from("staff")
      .select("id, role, section_access, is_active")
      .eq("id", chosen)
      .maybeSingle();
    if (!data?.is_active || !opens({ role: data.role, section_access: data.section_access ?? undefined }, "/admin/outside")) return "bad";
  }
  const at = new Date().toISOString();
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: PUBLISHER_KEY, payload: { staff: chosen, by: staff.id, at }, computed_at: at }, { onConflict: "key" });
  if (error) return "failed";
  await record("outside.publisher_set", { actorStaffId: staff.id, targetType: "staff", targetId: chosen, meta: { publisher: chosen }, ip });
  return "ok";
}
