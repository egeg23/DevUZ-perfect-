import { serviceClient } from "@/lib/supabase";

/**
 * Чтение чата аккаунтом скаута — по строке в базе, а не руками.
 *
 * Владелец, 28.11.2026: «На скауте я добавил тебя в чат с CZECHFARM, они там
 * сегодня накидали сертификатов и вчера или позавчера просили добавить новых
 * партнеров, сделай». Скаут читает только группы для сигналов, а историю
 * чужого чата и файлы из него сессии разработки взять было неоткуда.
 *
 * Строка `stats_snapshots` «scout-read:<имя>» с `{ chat, limit?, days?, files? }`:
 * `chat` — часть названия чата, @адрес или номер. Скаут берёт строку (ключ →
 * «scout-read-busy:»), читает последние сообщения, файлы кладёт в закрытое
 * хранилище `private/scout-read/<имя>/…` со ссылкой на 3 дня и пишет итог в
 * «scout-read-done:<имя>» (или «-failed:» с причиной). Скаут только читает:
 * ничего не пишет в чат и не отмечает прочитанным. Текст чата — только в
 * базе: в журнал сервера идут числа, без слов и имён.
 */

export const READ_PREFIX = "scout-read:";
/** Сколько сообщений берём по умолчанию и не больше какого числа. */
export const READ_LIMIT = 200;
export const READ_LIMIT_MAX = 500;
/** Глубина по умолчанию — неделя. */
export const READ_DAYS = 7;
/** Один файл — до 45 МБ (у хранилища предел 50), все вместе — до 400 МБ. */
export const FILE_MAX = 45 * 1024 * 1024;
export const FILES_TOTAL_MAX = 400 * 1024 * 1024;
/** Ссылка на файл живёт 3 дня. */
export const LINK_SECONDS = 3 * 86_400;
export const READ_BUCKET = "private";

export type ReadAsk = { chat: string; limit: number; days: number; files: boolean };

/** Разбор просьбы; без `chat` — null. */
export function readAsk(payload: unknown): ReadAsk | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  const chat = typeof p.chat === "string" || typeof p.chat === "number" ? String(p.chat).trim() : "";
  if (!chat) return null;
  const num = (v: unknown, dflt: number, max: number) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n > 0 ? Math.min(n, max) : dflt;
  };
  return { chat, limit: num(p.limit, READ_LIMIT, READ_LIMIT_MAX), days: num(p.days, READ_DAYS, 365), files: p.files !== false };
}

type Dialog = { id?: unknown; title?: unknown; name?: unknown; entity?: { username?: unknown } | null };

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/ё/g, "е").trim();

/** Какой из диалогов просили: номер, @адрес, потом точное название, потом часть названия. */
export function pickDialog<T extends Dialog>(dialogs: T[], chat: string): T | null {
  const q = norm(chat).replace(/^@/, "");
  if (!q) return null;
  const idOf = (d: T) => String(d.id ?? "").replace(/^-100/, "").replace(/^-/, "");
  const byId = /^-?\d+$/.test(q) ? dialogs.find((d) => idOf(d) === q.replace(/^-100/, "").replace(/^-/, "")) : undefined;
  if (byId) return byId;
  const byUser = dialogs.find((d) => norm(d.entity?.username) === q);
  if (byUser) return byUser;
  const titleOf = (d: T) => norm(d.title ?? d.name);
  return dialogs.find((d) => titleOf(d) === q) ?? dialogs.find((d) => titleOf(d).includes(q)) ?? null;
}

/** Имя файла для хранилища: латиница, цифры, точка, дефис; номер сообщения впереди. */
export function storeName(messageId: number, name: string, ext: string): string {
  const base = String(name || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 80);
  const withExt = base && /\.[a-z0-9]{1,6}$/i.test(base) ? base : `${base || "file"}${ext ? `.${ext.replace(/^\./, "")}` : ""}`;
  return `${messageId}-${withExt}`;
}

export type ReadFile = { name: string; size: number; mime: string; path: string; url: string | null };
export type ReadMessage = { id: number; at: string; from: string; text: string; reply?: number; file?: ReadFile; skipped?: string };

/** Взять следующую просьбу — одну. null — нечего или база не ответила. */
export async function takeRead(): Promise<{ name: string; ask: ReadAsk | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: rows, error } = await db.from("stats_snapshots").select("key").like("key", `${READ_PREFIX}%`).order("key").limit(1);
  const key = rows?.[0]?.key ? String(rows[0].key) : null;
  if (error || !key) return null;
  const name = key.slice(READ_PREFIX.length);
  const { data: claimed } = await db.from("stats_snapshots").update({ key: `scout-read-busy:${name}` }).eq("key", key).select("payload");
  if (!claimed?.length) return null;
  return { name, ask: readAsk(claimed[0].payload) };
}

/** Файл — в закрытое хранилище, ссылка на 3 дня. Не вышло — null, сообщение остаётся без файла. */
export async function keepFile(name: string, file: string, body: Buffer, mime: string): Promise<{ path: string; url: string | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const path = `scout-read/${name}/${file}`;
  const { error } = await db.storage.from(READ_BUCKET).upload(path, body, { contentType: mime || "application/octet-stream", upsert: true });
  if (error) return null;
  const { data } = await db.storage.from(READ_BUCKET).createSignedUrl(path, LINK_SECONDS);
  return { path, url: data?.signedUrl ?? null };
}

export async function finishRead(name: string, result: { chat?: string; id?: string; messages?: ReadMessage[]; error?: string }): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const at = new Date().toISOString();
  await db
    .from("stats_snapshots")
    .update({ key: `${result.error ? "scout-read-failed" : "scout-read-done"}:${name}`, payload: { ...result, at }, computed_at: at })
    .eq("key", `scout-read-busy:${name}`);
}
