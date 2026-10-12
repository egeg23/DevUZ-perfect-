import { HELLO_TEXT, type HelloTexts } from "@/lib/admin/hello-first";
import { HELLO_KEY, effectiveHello, type SavedHello } from "@/lib/admin/hello-text";
import { serviceClient } from "@/lib/supabase";

/**
 * Своё «Здравствуйте» — база (lib/admin/hello-text.ts). Модуль читает и
 * процесс скаута (outreach-queue → nextQueued), поэтому здесь только база.
 */

export async function savedHello(): Promise<SavedHello> {
  const db = serviceClient();
  if (!db) return { ru: null, uz: null };
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", HELLO_KEY).maybeSingle();
  const p = (data?.payload ?? {}) as Partial<SavedHello>;
  return {
    ru: typeof p.ru === "string" && p.ru.trim() ? p.ru : null,
    uz: typeof p.uz === "string" && p.uz.trim() ? p.uz : null,
    by: typeof p.by === "string" ? p.by : null,
    at: typeof p.at === "string" ? p.at : null,
  };
}

/** Что уходит на деле. База молчит — обычное приветствие: касание не должно встать из-за настройки. */
export async function helloTexts(): Promise<HelloTexts> {
  try {
    return effectiveHello(await savedHello());
  } catch {
    return HELLO_TEXT;
  }
}

export async function saveHello(texts: { ru: string; uz: string }, by: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const payload: SavedHello = {
    ru: texts.ru.trim() || null,
    uz: texts.uz.trim() || null,
    by,
    at: new Date().toISOString(),
  };
  const { error } = await db
    .from("stats_snapshots")
    .upsert({ key: HELLO_KEY, payload, computed_at: payload.at }, { onConflict: "key" });
  if (error) console.error("приветствие не сохранилось", error.message);
  return !error;
}
