import { serviceClient } from "@/lib/supabase";

/**
 * Сообщения себе в «Избранное» аккаунта скаута.
 *
 * Владелец, 06.11.2026, на ссылки на группы, которые бот прислал ему в личку:
 * «Перешли все сообщения на аккаунт скаута, зачем на мой? Я со своего что ль
 * подписываться буду?». Бот студии написать аккаунту скаута не может, пока
 * тот сам не открыл бота, а скаут в своё «Избранное» пишет и так (кружки,
 * circle-store). Строка `stats_snapshots` «scout-saved:<имя>» с теми же
 * текстами, что у client-outbox: `{ items: [{ kind: "text", name, text }] }`.
 * Скаут берёт строку (ключ → «scout-saved-sending:»), шлёт тексты по порядку
 * и ставит «scout-saved-sent:» или «-failed:». Чужим людям — ничего.
 */

export const SAVED_PREFIX = "scout-saved:";
/** Пауза между сообщениями: Telegram не любит пачку в один чат. */
export const SAVED_GAP_MS = 1500;
/** Предел текста одного сообщения (Telegram — 4096). */
export const SAVED_TEXT_MAX = 3500;

/** Тексты строки по порядку; мусор и пустое — мимо. */
export function savedTexts(payload: unknown): string[] {
  const items = (payload as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (item as { kind?: unknown; text?: unknown }) ?? {})
    .filter((item) => item.kind === "text" && typeof item.text === "string")
    .map((item) => String(item.text).trim())
    .filter((text) => text.length > 0 && text.length <= SAVED_TEXT_MAX);
}

/** Взять следующую строку — одну. null — нечего или база не ответила. */
export async function takeSaved(): Promise<{ name: string; texts: string[] } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: rows, error } = await db
    .from("stats_snapshots")
    .select("key")
    .like("key", `${SAVED_PREFIX}%`)
    .order("key")
    .limit(1);
  const key = rows?.[0]?.key ? String(rows[0].key) : null;
  if (error || !key) return null;
  const name = key.slice(SAVED_PREFIX.length);
  // Переименование — замок: второй процесс строку уже не найдёт.
  const { data: claimed } = await db
    .from("stats_snapshots")
    .update({ key: `scout-saved-sending:${name}` })
    .eq("key", key)
    .select("payload");
  if (!claimed?.length) return null;
  return { name, texts: savedTexts(claimed[0].payload) };
}

export async function finishSaved(name: string, sent: number, total: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const ok = total > 0 && sent === total;
  await db
    .from("stats_snapshots")
    .update({
      key: `${ok ? "scout-saved-sent" : "scout-saved-failed"}:${name}`,
      payload: { sent, total, at: new Date().toISOString() },
      computed_at: new Date().toISOString(),
    })
    .eq("key", `scout-saved-sending:${name}`);
}
