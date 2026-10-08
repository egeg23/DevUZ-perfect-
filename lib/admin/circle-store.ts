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

/**
 * Кружок, загруженный в панели (владелец, 08.10.2026, прислал записанный
 * кружок: «его отправляем… на всех аккаунтах»).
 *
 * Положить кружок в «Избранное» может только сессия аккаунта, то есть скаут.
 * Поэтому панель кладёт файл на диск сервера (туда же, где промо-материалы)
 * и пишет сюда, что он есть, а скаут каждого аккаунта при очередном взгляде
 * в «Избранное» видит: загруженный новее последнего кружка там — и
 * отправляет его себе в «Избранное» кружком. Дальше всё как раньше: тем, кто
 * ответил, уходит последний кружок из «Избранного».
 */
export const CIRCLE_FILE_KEY = "tg-circle-file";

export type CircleFile = {
  /** Путь в папке промо-материалов (lib/partners/promo-files.ts). */
  path: string;
  bytes: number;
  /** Секунды, ширина и высота — для атрибутов кружка в Telegram. */
  duration: number;
  width: number;
  height: number;
  /** Когда загружен (мс): новее последнего кружка в «Избранном» — скаут его положит. */
  uploadedAt: number;
  /** Кто загрузил — имя, для строки в «Аккаунтах». */
  by: string | null;
};

function isCircleFile(value: unknown): value is CircleFile {
  const v = value as Partial<CircleFile> | null;
  return Boolean(
    v &&
      typeof v.path === "string" &&
      typeof v.uploadedAt === "number" &&
      typeof v.duration === "number" &&
      typeof v.width === "number" &&
      typeof v.height === "number",
  );
}

export async function circleFile(): Promise<CircleFile | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", CIRCLE_FILE_KEY).maybeSingle();
  const payload = (data as { payload?: unknown } | null)?.payload;
  return isCircleFile(payload) ? payload : null;
}

export async function recordCircleFile(file: CircleFile): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("stats_snapshots").upsert(
    { key: CIRCLE_FILE_KEY, payload: file, computed_at: new Date(file.uploadedAt).toISOString() },
    { onConflict: "key" },
  );
  return !error;
}

/**
 * Пора ли скауту положить загруженный кружок в «Избранное» аккаунта: он
 * загружен позже последнего кружка, который там лежит. Кружок, сохранённый
 * в «Избранное» руками уже после загрузки, — новее, и его не перебиваем.
 */
export function circleDue(file: CircleFile | null, savedAt: number | null): boolean {
  return Boolean(file) && (savedAt === null || savedAt < file!.uploadedAt);
}
