import { readFile } from "node:fs/promises";
import path from "node:path";

import { esc, sendDocument, sendPhotoFile } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Файлы клиенту от бота студии — смета, КП, договор картинками и PDF.
 *
 * Владелец, 23.10.2026, про смету FloraEdu Global: «Бот может прикреплять
 * изображения… Или найди способ отправить документ от имени нашей студии на
 * фирменном бланке». Рассылка «Пользователям бота» шлёт только текст, а
 * класть документ клиента в открытый репозиторий ради ссылки нельзя. Поэтому
 * файлы лежат в базе: строка stats_snapshots с ключом
 * `client-outbox:<имя>` и payload `{ chat, items: [{ kind, name, b64 | file,
 * caption? }] }`, а свип отправляет их по порядку от бота студии. Файл —
 * либо сам в base64, либо путь в `kp/send/` (он едет в образ свипа, на сайте
 * не открывается): большой документ через запрос к базе не передать.
 *
 * Строку берёт один проход: ключ переименовывается в `client-outbox-sending:`
 * условно, до отправки. После — `client-outbox-sent:` (или `-failed:`) и
 * payload без самих файлов: в базе не держим лишнего. Список — только ключи,
 * файлы читаются той строкой, которую взяли. Окна «ночью бот молчит» нет:
 * строку кладут по слову человека, и уходит она тогда, когда он попросил.
 */

export const OUTBOX_PREFIX = "client-outbox:";

export type OutboxItem = { kind: "photo" | "document"; name: string; b64?: string; file?: string; caption?: string };

/** Файл с диска — только из kp/send/, без выхода наверх. */
export const OUTBOX_DIR = "kp/send/";

export function outboxFile(file: string): string | null {
  const clean = path.posix.normalize(file);
  if (!clean.startsWith(OUTBOX_DIR) || clean.includes("..")) return null;
  return clean;
}
export type OutboxPayload = { chat: number; items: OutboxItem[]; note?: string };

export function isOutboxPayload(value: unknown): value is OutboxPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isFinite(Number(v.chat)) &&
    Array.isArray(v.items) &&
    v.items.length > 0 &&
    v.items.every((i) => {
      const it = i as Record<string, unknown>;
      const body = typeof it.b64 === "string" || (typeof it.file === "string" && outboxFile(it.file) !== null);
      return (it.kind === "photo" || it.kind === "document") && typeof it.name === "string" && body;
    })
  );
}

export async function sendClientOutbox(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data: rows } = await db.from("stats_snapshots").select("key").like("key", `${OUTBOX_PREFIX}%`).limit(3);
  let sent = 0;
  for (const row of rows ?? []) {
    const key = String(row.key);
    const name = key.slice(OUTBOX_PREFIX.length);
    const sending = `client-outbox-sending:${name}`;
    const { data: claimed } = await db.from("stats_snapshots").update({ key: sending }).eq("key", key).select("payload");
    const payload = claimed?.[0]?.payload as unknown;
    if (!claimed?.length) continue;
    if (!isOutboxPayload(payload)) {
      await db.from("stats_snapshots").update({ key: `client-outbox-failed:${name}`, payload: { error: "bad payload" } }).eq("key", sending);
      continue;
    }
    const done: { name: string; ok: boolean }[] = [];
    for (const item of payload.items) {
      const file = item.file ? outboxFile(item.file) : null;
      const raw = file
        ? await readFile(path.join(process.cwd(), file)).catch(() => null)
        : Buffer.from(item.b64 ?? "", "base64");
      if (!raw?.length) {
        done.push({ name: item.name, ok: false });
        continue;
      }
      const bytes = new Uint8Array(raw);
      const caption = item.caption ? esc(item.caption) : "";
      const ok =
        item.kind === "photo"
          ? await sendPhotoFile(payload.chat, bytes, item.name, caption)
          : await sendDocument(payload.chat, bytes, item.name, caption || undefined);
      done.push({ name: item.name, ok });
    }
    const allOk = done.every((d) => d.ok);
    if (allOk) sent += 1;
    else console.error("файлы клиенту: не всё ушло", name, done);
    await db
      .from("stats_snapshots")
      .update({
        key: `${allOk ? "client-outbox-sent" : "client-outbox-failed"}:${name}`,
        payload: { chat: payload.chat, note: payload.note ?? null, done, at: new Date().toISOString() },
        computed_at: new Date().toISOString(),
      })
      .eq("key", sending);
  }
  return sent;
}
