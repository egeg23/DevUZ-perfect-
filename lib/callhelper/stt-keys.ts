import { roadFetch } from "@/lib/egress.mjs";
import { appSecret } from "@/lib/secrets";

/**
 * Ключ распознавания речи для DevUz CallHelper — Яндекс SpeechKit.
 *
 * Владелец, 25.11.2026, на «Сделать блок „Ключ распознавания речи“ в
 * панели?»: «Да, доступ к этим раздел пока только у меня». Ключ и номер
 * каталога вставляют в разделе, сервер спрашивает Яндекс, принят ли ключ, и
 * только тогда пишет в хранилище секретов. Обратно — только «задано / пусто».
 * В журнал, лог и ответ — никогда значение.
 */

export const STT_KEY = "YANDEX_SPEECHKIT_KEY";
export const STT_FOLDER = "YANDEX_FOLDER_ID";

export type SttForm = { key: string; folder: string };
export type SttParsed =
  | { ok: true; key: string; folder: string }
  | { ok: false; field: "key" | "folder" };

/** API-ключ Яндекса — одна строка без пробелов; каталог — 20 латинских букв и цифр. */
export function parseSttForm(form: SttForm): SttParsed {
  const key = form.key.trim();
  const folder = form.folder.trim().toLowerCase();
  if (!/^[A-Za-z0-9_\-]{20,200}$/.test(key)) return { ok: false, field: "key" };
  if (!/^[a-z0-9]{20}$/.test(folder)) return { ok: false, field: "folder" };
  return { ok: true, key, folder };
}

export type SttCheck = "ok" | "key" | "folder" | "down";

/** Что ответил Яндекс — словом, без текста ошибки. */
export function sttVerdict(status: number, body: string): SttCheck {
  if (status === 200) return "ok";
  if (status === 401) return "key";
  if (status === 400 || status === 403) return /folder/i.test(body) || status === 400 ? "folder" : "key";
  return "down";
}

/** 0,1 секунды тишины, 8 кГц, 16 бит: проверка стоит одну единицу тарификации SpeechKit (≈0,16 ₽). */
const SILENCE = new Uint8Array(1600);

/** Спросить Яндекс, принимает ли он ключ с этим каталогом. */
export async function checkStt(key: string, folder: string): Promise<SttCheck> {
  const url =
    "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize" +
    `?folderId=${encodeURIComponent(folder)}&lang=ru-RU&format=lpcm&sampleRateHertz=8000`;
  try {
    const res = await roadFetch(url, {
      method: "POST",
      headers: { Authorization: `Api-Key ${key}`, "Content-Type": "application/octet-stream" },
      body: SILENCE,
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.text().catch(() => "")).slice(0, 500);
    return sttVerdict(res.status, body);
  } catch {
    return "down";
  }
}

/** Задано ли — без значений. */
export async function sttState(): Promise<{ key: boolean; folder: boolean }> {
  const [key, folder] = await Promise.all([appSecret(STT_KEY), appSecret(STT_FOLDER)]);
  return { key: !!key, folder: !!folder };
}
