import { createReadStream } from "node:fs";
import { appendFile, mkdir, open, readdir, readFile, rename, rm, stat, statfs, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { PROMO_CHUNK_BYTES, PROMO_MAX_BYTES, PROMO_MIME, isPromoPath } from "@/lib/partners/promo-rules";

/**
 * Файлы промо-материалов на диске нашего сервера.
 *
 * Контейнер сайта пересобирается на каждой выкатке, и всё, что лежит внутри
 * него, пропадает. Поэтому файлы живут в папке хоста, подключённой к
 * контейнеру (docker-compose.yml, MEDIA_DIR); выкатка её создаёт и отдаёт
 * пользователю контейнера, но не трогает содержимое.
 *
 * Загрузка — кусками (PROMO_CHUNK_BYTES): незаконченный файл копится в tmp/,
 * в promo/ он попадает целиком и только после проверки размера и сигнатуры.
 * Раздача — с поддержкой Range: без неё Safari не показывает видео вовсе, а
 * перемотка в любом браузере скачивает файл с начала.
 */

export function mediaRoot(): string {
  return process.env.MEDIA_DIR || path.join(process.cwd(), ".media");
}

const promoDir = () => path.join(mediaRoot(), "promo");
const tmpDir = () => path.join(mediaRoot(), "tmp");
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Абсолютный путь файла; null — путь не наш (защита от «../» и чужих файлов). */
export function promoFilePath(storagePath: string): string | null {
  return isPromoPath(storagePath) ? path.join(promoDir(), storagePath) : null;
}

type UploadMeta = { path: string; mime: string; bytes: number; createdAt: string };

/**
 * Сколько места оставить свободным после загрузки. Диск общий с базой
 * бэкапов и docker-образами: заполненный до нуля, он роняет следующую
 * выкатку на середине сборки.
 */
const DISK_RESERVE = 2 * 1024 * 1024 * 1024;

export type FileResult<T> = ({ ok: true } & T) | { ok: false; reason: string };

/** Завести загрузку: место на диске, путь будущего файла, пустой кусок. */
export async function startUpload(input: {
  uploadId: string;
  path: string;
  mime: string;
  bytes: number;
}): Promise<FileResult<Record<never, never>>> {
  if (!UPLOAD_ID.test(input.uploadId) || !isPromoPath(input.path)) return { ok: false, reason: "Не разобрал загрузку." };
  if (!Number.isInteger(input.bytes) || input.bytes <= 0 || input.bytes > PROMO_MAX_BYTES) {
    return { ok: false, reason: "Файл больше 500 МБ или пустой." };
  }
  try {
    await mkdir(tmpDir(), { recursive: true });
    await mkdir(promoDir(), { recursive: true });
    await sweepStale();
    const fs = await statfs(mediaRoot());
    const free = fs.bavail * fs.bsize;
    if (free - input.bytes < DISK_RESERVE) {
      return {
        ok: false,
        reason: `На сервере мало места: свободно ${(free / 1024 ** 3).toFixed(1)} ГБ, а после загрузки должно остаться не меньше 2 ГБ.`,
      };
    }
    const meta: UploadMeta = { path: input.path, mime: input.mime, bytes: input.bytes, createdAt: new Date().toISOString() };
    await writeFile(path.join(tmpDir(), `${input.uploadId}.json`), JSON.stringify(meta));
    await writeFile(path.join(tmpDir(), `${input.uploadId}.part`), "");
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: `Сервер не смог завести файл: ${(error as Error).message}` };
  }
}

async function readMeta(uploadId: string): Promise<UploadMeta | null> {
  if (!UPLOAD_ID.test(uploadId)) return null;
  try {
    return JSON.parse(await readFile(path.join(tmpDir(), `${uploadId}.json`), "utf8")) as UploadMeta;
  } catch {
    return null;
  }
}

/**
 * Дописать кусок с места `offset`.
 *
 * Повтор уже принятого куска (ответ потерялся, браузер прислал его снова)
 * не портит файл: если такие байты уже есть, кусок просто подтверждается.
 * Дыра — кусок из будущего — отвергается: склеить файл с пропуском значит
 * отдать партнёрам битый ролик, который ещё и откроется не везде.
 */
export async function appendChunk(uploadId: string, offset: number, data: Uint8Array): Promise<FileResult<{ received: number }>> {
  const meta = await readMeta(uploadId);
  if (!meta) return { ok: false, reason: "Загрузка не найдена — начните заново." };
  if (!Number.isInteger(offset) || offset < 0 || data.byteLength === 0 || data.byteLength > PROMO_CHUNK_BYTES) {
    return { ok: false, reason: "Кусок файла не того размера." };
  }
  const part = path.join(tmpDir(), `${uploadId}.part`);
  const have = (await stat(part).catch(() => null))?.size;
  if (have === undefined) return { ok: false, reason: "Загрузка не найдена — начните заново." };
  if (offset + data.byteLength <= have) return { ok: true, received: have };
  if (offset !== have) return { ok: false, reason: `Кусок не по порядку: ждал байт ${have}, пришёл ${offset}.` };
  if (have + data.byteLength > meta.bytes) return { ok: false, reason: "Файл вышел больше заявленного размера." };
  try {
    await appendFile(part, data);
  } catch (error) {
    return { ok: false, reason: `Сервер не записал кусок: ${(error as Error).message}` };
  }
  return { ok: true, received: have + data.byteLength };
}

/** Первые байты файла совпадают с его типом — чтобы под видом ролика не лёг, например, HTML. */
export function signatureMatches(mime: string, head: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  switch (PROMO_MIME[mime]) {
    case "mp4":
    case "mov":
      return ascii(4, 8) === "ftyp" || ["moov", "mdat", "wide", "free"].includes(ascii(4, 8));
    case "webm":
      return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    case "png":
      return head[0] === 0x89 && ascii(1, 4) === "PNG";
    case "jpg":
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "gif":
      return ascii(0, 4) === "GIF8";
    default:
      return false;
  }
}

/** Закончить загрузку: размер сошёлся, сигнатура тоже — файл переезжает в promo/. */
export async function finishUpload(uploadId: string): Promise<FileResult<{ path: string; mime: string; bytes: number }>> {
  const meta = await readMeta(uploadId);
  if (!meta) return { ok: false, reason: "Загрузка не найдена — начните заново." };
  const part = path.join(tmpDir(), `${uploadId}.part`);
  const size = (await stat(part).catch(() => null))?.size ?? -1;
  if (size !== meta.bytes) return { ok: false, reason: `Файл дошёл не целиком: ${size} из ${meta.bytes} байт.` };

  const head = new Uint8Array(16);
  const handle = await open(part, "r");
  try {
    await handle.read(head, 0, 16, 0);
  } finally {
    await handle.close();
  }
  if (!signatureMatches(meta.mime, head)) {
    await discardUpload(uploadId);
    return { ok: false, reason: "Внутри файла не то, что в его названии: ни ролик, ни картинка." };
  }

  const target = promoFilePath(meta.path);
  if (!target) return { ok: false, reason: "Путь файла не наш." };
  try {
    await mkdir(path.dirname(target), { recursive: true });
    await rename(part, target);
  } catch (error) {
    return { ok: false, reason: `Сервер не переложил файл: ${(error as Error).message}` };
  }
  await rm(path.join(tmpDir(), `${uploadId}.json`), { force: true });
  return { ok: true, path: meta.path, mime: meta.mime, bytes: size };
}

export async function discardUpload(uploadId: string): Promise<void> {
  if (!UPLOAD_ID.test(uploadId)) return;
  await rm(path.join(tmpDir(), `${uploadId}.part`), { force: true });
  await rm(path.join(tmpDir(), `${uploadId}.json`), { force: true });
}

/** Брошенные загрузки старше суток — вон: закрытая вкладка не должна копить гигабайты. */
async function sweepStale(): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const name of await readdir(tmpDir()).catch(() => [] as string[])) {
    const file = path.join(tmpDir(), name);
    const info = await stat(file).catch(() => null);
    if (info && info.mtimeMs < cutoff) await rm(file, { force: true });
  }
}

export async function removePromoFile(storagePath: string): Promise<void> {
  const file = promoFilePath(storagePath);
  if (file) await rm(file, { force: true });
}

/**
 * Диапазон из заголовка Range. `null` — заголовка нет или он не про байты
 * (отдаём файл целиком); `"bad"` — диапазон за пределами файла (416).
 */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null | "bad" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return null;
  let start: number;
  let end: number;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (suffix === 0) return "bad";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start >= size || start > end) return "bad";
  return { start, end };
}

/** Поток части файла для Response. */
export function fileStream(file: string, start: number, end: number): ReadableStream<Uint8Array> {
  return Readable.toWeb(createReadStream(file, { start, end })) as unknown as ReadableStream<Uint8Array>;
}

export async function fileSize(file: string): Promise<number | null> {
  const info = await stat(file).catch(() => null);
  return info?.isFile() ? info.size : null;
}
