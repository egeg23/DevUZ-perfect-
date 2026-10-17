import { CIRCLE_NICHES, type CircleNiche } from "@/lib/admin/sales-after-reply";
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
  /**
   * Кружки ниш (владелец, 17.10.2026: кружок на нишу × язык): ключ
   * `<язык>:<ниша>` → номера сообщений в «Избранном», которые скаут положил
   * туда этим кружком, новые первыми. Общий кружок языка — не здесь.
   */
  nicheIds: Record<string, number[]>;
  /** Когда лежит кружок ниши (мс): ключ `<язык>:<ниша>`; нет ключа — нет кружка. */
  nicheSavedAt: Record<string, number>;
  /** Когда скаут смотрел (мс). */
  checkedAt: number;
};

/** Кружок ниши: язык и ниша. Общий — «general», он и был до 17.10.2026. */
export type CircleSlot = { lang: CircleLang; niche: CircleNiche };

export const slotKey = (slot: CircleSlot) => `${slot.lang}:${slot.niche}`;

/** Все места для кружков: язык × ниша, общий первым. */
export const CIRCLE_SLOTS: readonly CircleSlot[] = CIRCLE_NICHES.flatMap((niche) =>
  CIRCLE_LANGS.map((lang) => ({ lang, niche })),
);

export async function recordCircle(
  account: string,
  state: {
    savedAt: number | null;
    uzSavedAt: number | null;
    uzIds: readonly number[];
    nicheIds?: Readonly<Record<string, readonly number[]>>;
    nicheSavedAt?: Readonly<Record<string, number>>;
  },
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
        nicheIds: Object.fromEntries(Object.entries(state.nicheIds ?? {}).map(([k, ids]) => [k, [...ids].slice(0, UZ_IDS_KEPT)])),
        nicheSavedAt: { ...(state.nicheSavedAt ?? {}) },
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
  /**
   * Кружки ниш: их номера и размеры файлов. Общий русский — последний кружок,
   * которого нет ни среди узбекских, ни среди кружков ниш: иначе кружок
   * стоматологии ушёл бы мебельщику.
   */
  niches: { ids?: readonly number[]; bytes?: readonly number[] } = {},
): Record<CircleLang, T | null> {
  const ids = new Set(uzIds);
  const nicheIds = new Set(niches.ids ?? []);
  const nicheBytes = new Set((niches.bytes ?? []).filter((b) => b > 0));
  const isNiche = (note: T) => nicheIds.has(note.id) || (note.bytes != null && nicheBytes.has(note.bytes));
  const isUz = (note: T) => ids.has(note.id) || (uzBytes !== null && uzBytes > 0 && note.bytes === uzBytes);
  return {
    ru: saved.find((note) => !isUz(note) && !isNiche(note)) ?? null,
    uz: uzIds.map((id) => saved.find((note) => note.id === id)).find(Boolean) ?? saved.find(isUz) ?? null,
  };
}

/**
 * Кружки ниш в «Избранном»: ключ `<язык>:<ниша>` → кружок или null. Номера —
 * главный признак, размер файла — запасной (как у узбекского в pickCircles).
 */
export function pickNicheCircles<T extends SavedNote>(
  saved: readonly T[],
  nicheIds: Readonly<Record<string, readonly number[]>>,
  nicheBytes: Readonly<Record<string, number | null>> = {},
): Record<string, T | null> {
  const out: Record<string, T | null> = {};
  for (const slot of CIRCLE_SLOTS) {
    if (slot.niche === "general") continue;
    const key = slotKey(slot);
    const ids = nicheIds[key] ?? [];
    const bytes = nicheBytes[key] ?? null;
    out[key] =
      ids.map((id) => saved.find((note) => note.id === id)).find(Boolean) ??
      (bytes && bytes > 0 ? saved.find((note) => note.bytes === bytes) : undefined) ??
      null;
  }
  return out;
}

/**
 * Какой кружок уходит: ниши компании на языке ответа, нет его — общий на
 * этом языке, как до 17.10.2026.
 */
export function circleFor<T>(general: Record<CircleLang, T | null>, niche: Record<string, T | null>, slot: CircleSlot): T | null {
  return (slot.niche !== "general" ? niche[slotKey(slot)] : null) ?? general[slot.lang];
}

/** Каких кружков ниш не хватает: ни загруженного файла, ни кружка в «Избранном» хоть одного аккаунта. */
export function missingNicheSlots(
  files: ReadonlyMap<string, unknown>,
  states: Iterable<Pick<CircleState, "nicheSavedAt">>,
): CircleSlot[] {
  const seen = new Set<string>();
  for (const state of states) for (const key of Object.keys(state.nicheSavedAt ?? {})) seen.add(key);
  return CIRCLE_SLOTS.filter((slot) => slot.niche !== "general" && !files.has(slotKey(slot)) && !seen.has(slotKey(slot)));
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
      nicheIds: idsMap(payload.nicheIds),
      nicheSavedAt: Object.fromEntries(
        Object.entries(payload.nicheSavedAt && typeof payload.nicheSavedAt === "object" ? payload.nicheSavedAt : {}).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number",
        ),
      ),
      checkedAt: payload.checkedAt,
    });
  }
  return out;
}

function idsMap(raw: unknown): Record<string, number[]> {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, ids]) => [
      key,
      Array.isArray(ids) ? ids.filter((id): id is number => Number.isInteger(id)) : [],
    ]),
  );
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
export const circleFileKey = (lang: CircleLang, niche: CircleNiche = "general") =>
  niche !== "general" ? `${CIRCLE_FILE_KEY}:${lang}:${niche}` : lang === "ru" ? CIRCLE_FILE_KEY : `${CIRCLE_FILE_KEY}:${lang}`;

/** Ключ хранилища → место кружка; чужой ключ — null. */
export function slotOfFileKey(key: string): CircleSlot | null {
  return CIRCLE_SLOTS.find((slot) => circleFileKey(slot.lang, slot.niche) === key) ?? null;
}

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

export async function circleFile(lang: CircleLang = "ru", niche: CircleNiche = "general"): Promise<CircleFile | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", circleFileKey(lang, niche)).maybeSingle();
  const payload = (data as { payload?: unknown } | null)?.payload;
  return isCircleFile(payload) ? payload : null;
}

/** Все загруженные кружки одним запросом: ключ места (`<язык>:<ниша>`) → файл. */
export async function circleFiles(): Promise<Map<string, CircleFile>> {
  const db = serviceClient();
  const out = new Map<string, CircleFile>();
  if (!db) return out;
  const { data } = await db.from("stats_snapshots").select("key, payload").like("key", `${CIRCLE_FILE_KEY}%`);
  for (const row of data ?? []) {
    const slot = slotOfFileKey(String(row.key));
    if (slot && isCircleFile(row.payload)) out.set(slotKey(slot), row.payload);
  }
  return out;
}

export async function recordCircleFile(file: CircleFile, lang: CircleLang = "ru", niche: CircleNiche = "general"): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("stats_snapshots").upsert(
    { key: circleFileKey(lang, niche), payload: file, computed_at: new Date(file.uploadedAt).toISOString() },
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
