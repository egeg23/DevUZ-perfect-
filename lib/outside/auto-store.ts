import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { AUTO_PLATFORMS, PLATFORM, type Platform } from "@/lib/outside/posts";
import { POSTIZ_KEY, channelFor, postizChannels, type PostizChannel } from "@/lib/outside/postiz";
import { mayChoosePublisher } from "@/lib/outside/store";
import { TELEGRAPH_KEY } from "@/lib/outside/telegraph";
import { appSecret, saveAppSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * «Публикуется само» в «Статьях на площадках»: ключ Postiz и что он видит.
 *
 * Ключ вставляют владелец и руководитель (те же, кто выбирает «Кто
 * публикует»). Сначала ключ проверяется у Postiz, и только потом пишется в
 * хранилище секретов; обратно — только «задано / пусто», в журнал — без
 * значения. Итог проверки (какие каналы видны и какие наши площадки
 * подключены) — строкой stats_snapshots, её читают раздел и недельный заход.
 */

export const POSTIZ_CHECK_KEY = "postiz-check";

export type PostizCheck = {
  at: string;
  ok: boolean;
  reason: string | null;
  channels: { name: string; identifier: string }[];
  /** Наши площадки, у которых в Postiz есть включённый канал. */
  ready: Platform[];
};

export type AutoState = {
  postizKey: boolean;
  telegraphKey: boolean;
  check: PostizCheck | null;
};

export function checkOf(channels: readonly PostizChannel[], now: Date): PostizCheck {
  return {
    at: now.toISOString(),
    ok: true,
    reason: null,
    channels: channels.map((c) => ({ name: c.name, identifier: c.identifier })),
    ready: AUTO_PLATFORMS.filter((p) => PLATFORM[p].via === "postiz" && channelFor(channels, p)),
  };
}

async function saveCheck(check: PostizCheck): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert({ key: POSTIZ_CHECK_KEY, payload: check, computed_at: check.at }, { onConflict: "key" });
}

export async function readAuto(): Promise<AutoState> {
  const db = serviceClient();
  const [postiz, telegraph, row] = await Promise.all([
    appSecret(POSTIZ_KEY),
    appSecret(TELEGRAPH_KEY),
    db ? db.from("stats_snapshots").select("payload").eq("key", POSTIZ_CHECK_KEY).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const payload = (row.data?.payload ?? null) as PostizCheck | null;
  return { postizKey: Boolean(postiz), telegraphKey: Boolean(telegraph), check: payload && typeof payload.at === "string" ? payload : null };
}

/**
 * «Сохранить и проверить»: пустое поле — проверить уже сохранённый ключ;
 * новый ключ пишется, только если Postiz его принял.
 */
export async function savePostizKey(staff: Staff, raw: string, ip: string, now = new Date()): Promise<"ok" | "bad" | "forbidden" | "failed"> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const key = raw.trim();
  if (key && (key.length > 300 || /\s/.test(key))) return "bad";
  const channels = await postizChannels(key || undefined);
  if ("error" in channels) {
    await saveCheck({ at: now.toISOString(), ok: false, reason: channels.error, channels: [], ready: [] });
    return "bad";
  }
  if (key && !(await saveAppSecret(POSTIZ_KEY, key))) return "failed";
  const check = checkOf(channels, now);
  await saveCheck(check);
  await record("outside.postiz_key_saved", {
    actorStaffId: staff.id,
    targetType: "secret",
    targetId: POSTIZ_KEY,
    meta: { new_key: Boolean(key), channels: check.channels.length, ready: check.ready },
    ip,
  });
  return "ok";
}
