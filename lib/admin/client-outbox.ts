import { readFile } from "node:fs/promises";
import path from "node:path";

import { esc, sendDocument, sendMessage, sendPhotoFile } from "@/lib/qualify/telegram";
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
 *
 * Текстом — `{ kind: "text", name, text }` (владелец, 06.11.2026: «выведи
 * удобным списком прямо через бота нашего в тг, пусть поочерёдно пришлёт мне
 * ссылки» — группы для скаута): каждая строка — отдельное сообщение, по
 * порядку, ссылки в нём Telegram делает нажимаемыми сам. Между сообщениями —
 * пауза: больше одного в секунду в один чат Telegram не пускает. Проход не
 * дольше PASS_BUDGET_MS: остальные строки уйдут следующим проходом свипа.
 */

export const OUTBOX_PREFIX = "client-outbox:";

export type OutboxItem =
  | { kind: "photo" | "document"; name: string; b64?: string; file?: string; caption?: string }
  | { kind: "text"; name: string; text: string };

/** Предел текста одного сообщения: Telegram берёт до 4096 знаков. */
export const OUTBOX_TEXT_MAX = 3500;
/** Пауза между сообщениями в один чат. */
export const OUTBOX_GAP_MS = 1100;
/** Сколько один проход свипа тратит на исходящую почту. */
export const PASS_BUDGET_MS = 25_000;

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
      if (typeof it.name !== "string") return false;
      if (it.kind === "text") return typeof it.text === "string" && it.text.trim().length > 0 && it.text.length <= OUTBOX_TEXT_MAX;
      const body = typeof it.b64 === "string" || (typeof it.file === "string" && outboxFile(it.file) !== null);
      return (it.kind === "photo" || it.kind === "document") && body;
    })
  );
}

export async function sendClientOutbox(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data: rows } = await db
    .from("stats_snapshots")
    .select("key")
    .like("key", `${OUTBOX_PREFIX}%`)
    .order("key")
    .limit(3);
  let sent = 0;
  const started = Date.now();
  for (const row of rows ?? []) {
    if (Date.now() - started > PASS_BUDGET_MS) break;
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
    for (const [index, item] of payload.items.entries()) {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, OUTBOX_GAP_MS));
      if (item.kind === "text") {
        // Без пуша и колокольчика: это пачка ссылок по просьбе, а не уведомление.
        done.push({ name: item.name, ok: await sendMessage(payload.chat, esc(item.text), { mirror: false }) });
        continue;
      }
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
