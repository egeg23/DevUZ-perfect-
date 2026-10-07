import { serviceClient } from "@/lib/supabase";

/**
 * Кружок для писем после «Здравствуйте» (lib/admin/hello-first.ts): есть ли
 * он в «Избранном» рабочего аккаунта.
 *
 * Владелец записывает кружок сам и сохраняет его в «Избранное» каждого
 * рабочего аккаунта; скаут берёт последний. Узнать, сохранён ли он, можно
 * только из сессии аккаунта, поэтому скаут каждые десять минут смотрит и
 * пишет сюда, а «Аккаунты» в панели показывают.
 */

/** Как часто скаут смотрит «Избранное». */
export const CIRCLE_CHECK_MS = 10 * 60_000;

export const circleKey = (account: string) => `tg-circle:${account}`;

export type CircleState = {
  /** Когда записан последний кружок в «Избранном» (мс); null — кружка нет. */
  savedAt: number | null;
  /** Когда скаут смотрел (мс). */
  checkedAt: number;
};

export async function recordCircle(account: string, savedAt: number | null, now = Date.now()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert(
    {
      key: circleKey(account),
      payload: { savedAt, checkedAt: now } satisfies CircleState,
      computed_at: new Date(now).toISOString(),
    },
    { onConflict: "key" },
  );
}

/** Что известно о кружке каждого аккаунта: ключ аккаунта → состояние. */
export async function circleStates(): Promise<Map<string, CircleState>> {
  const db = serviceClient();
  const out = new Map<string, CircleState>();
  if (!db) return out;
  const { data } = await db.from("stats_snapshots").select("key, payload").like("key", "tg-circle:%");
  for (const row of data ?? []) {
    const payload = row.payload as Partial<CircleState> | null;
    if (!payload || typeof payload.checkedAt !== "number") continue;
    out.set(String(row.key).slice("tg-circle:".length), {
      savedAt: typeof payload.savedAt === "number" ? payload.savedAt : null,
      checkedAt: payload.checkedAt,
    });
  }
  return out;
}
