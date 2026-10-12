import { serviceClient } from "@/lib/supabase";

/**
 * Кружок для писем после «Здравствуйте» (lib/admin/hello-first.ts): есть ли
 * он в «Избранном» рабочего аккаунта.
 *
 * Владелец записывает кружок сам и сохраняет его в «Избранное» каждого
 * рабочего аккаунта; скаут берёт последний. С 12.10.2026 кружков два —
 * русский и узбекский (CircleLang). Узнать, сохранён ли он, можно
 * только из сессии аккаунта, поэтому скаут каждые десять минут смотрит и
 * пишет сюда, а «Аккаунты» в панели показывают.
 */

/** Как часто скаут смотрит «Избранное». */
export const CIRCLE_CHECK_MS = 10 * 60_000;

export const circleKey = (account: string) => `tg-circle:${account}`;

/**
 * На каком языке кружок. Владелец, 12.10.2026: «появился кружок с более
 * коротким текстом и на узбекском языке… если ответ от лида на узбекском —
 * кружок на узбекском отправляем». Ответил по-русски — русский кружок,
 * по-узбекски — узбекский, на другом языке — письмо, как раньше.
 */
export type CircleLang = "ru" | "uz";
export const CIRCLE_LANGS: readonly CircleLang[] = ["ru", "uz"];

export function isCircleLang(value: unknown): value is CircleLang {
  return value === "ru" || value === "uz";
}

export type CircleState = {
  /** Когда записан русский кружок в «Избранном» (мс); null — его нет. */
  savedAt: number | null;
  /** То же для узбекского. */
  uzSavedAt: number | null;
  /**
   * Номера сообщений в «Избранном», которые скаут положил туда узбекским
   * кружком, новые первыми. Кружок без подписи — по виду его язык не
   * узнать, поэтому скаут запоминает, что положил сам: узбекский — первый из
   * этих номеров, что ещё лежит, русский — последний кружок, которого среди
   * них нет (так работает и кружок, сохранённый в «Избранное» руками).
   * Номера пропали (база не ответила при перезапуске) — узбекский узнаётся
   * по размеру файла (pickCircles).
   */
  uzIds: number[];
  /** Когда скаут смотрел (мс). */
  checkedAt: number;
};

export async function recordCircle(
  account: string,
  state: { savedAt: number | null; uzSavedAt: number | null; uzIds: readonly number[] },
  now = Date.now(),
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert(
    {
      key: circleKey(account),
      payload: {
        savedAt: state.savedAt,
        uzSavedAt: state.uzSavedAt,
        uzIds: [...state.uzIds].slice(0, UZ_IDS_KEPT),
        checkedAt: now,
      } satisfies CircleState,
      computed_at: new Date(now).toISOString(),
    },
    { onConflict: "key" },
  );
}

/** Сколько номеров узбекских кружков помнить: старые скаут удаляет из «Избранного». */
const UZ_IDS_KEPT = 20;

type SavedNote = { id: number; date: number; bytes?: number | null };

/**
 * Какой кружок из «Избранного» уходит на каком языке. `saved` — кружки
 * «Избранного», новые первыми (как отдаёт Telegram); `uzIds` — что скаут
 * клал туда узбекским; `uzBytes` — размер загруженного узбекского файла.
 *
 * Номера — главный признак, размер — запасной: забудь скаут номера (база
 * промолчала при перезапуске), узбекский кружок, лежащий последним, ушёл бы
 * тем, кто ответил по-русски. Файл скаут кладёт как есть, и размер у кружка
 * в «Избранном» тот же, что у загруженного.
 */
export function pickCircles<T extends SavedNote>(
  saved: readonly T[],
  uzIds: readonly number[],
  uzBytes: number | null = null,
): Record<CircleLang, T | null> {
  const ids = new Set(uzIds);
  const isUz = (note: T) => ids.has(note.id) || (uzBytes !== null && uzBytes > 0 && note.bytes === uzBytes);
  return {
    ru: saved.find((note) => !isUz(note)) ?? null,
    uz: uzIds.map((id) => saved.find((note) => note.id === id)).find(Boolean) ?? saved.find(isUz) ?? null,
  };
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
      uzSavedAt: typeof payload.uzSavedAt === "number" ? payload.uzSavedAt : null,
      uzIds: Array.isArray(payload.uzIds) ? payload.uzIds.filter((id): id is number => Number.isInteger(id)) : [],
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

/** Где лежит загруженный кружок языка: русский — под старым ключом, как до узбекского. */
export const circleFileKey = (lang: CircleLang) => (lang === "ru" ? CIRCLE_FILE_KEY : `${CIRCLE_FILE_KEY}:${lang}`);

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

export async function circleFile(lang: CircleLang = "ru"): Promise<CircleFile | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", circleFileKey(lang)).maybeSingle();
  const payload = (data as { payload?: unknown } | null)?.payload;
  return isCircleFile(payload) ? payload : null;
}

export async function recordCircleFile(file: CircleFile, lang: CircleLang = "ru"): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("stats_snapshots").upsert(
    { key: circleFileKey(lang), payload: file, computed_at: new Date(file.uploadedAt).toISOString() },
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
