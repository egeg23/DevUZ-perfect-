import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Промо-ролик в макете — смотреть можно, скачать нельзя.
 *
 * Владелец, 19.10.2026, про ролик для бюро SIA: «Видео нельзя скачать с
 * сайта или через код». Поэтому ролик не лежит в макете файлом: он порезан
 * на куски HLS и каждый кусок зашифрован AES-128 (public/protos/<макет>/
 * promo/). Без ключа куски — шум. Ключа нет ни в репозитории (он открытый),
 * ни в разметке: он в хранилище секретов (`PROMO_KEY_<МАКЕТ>`), и отдаёт его
 * только маршрут app/proto/[token]/promo/[file] — тому, кому открыт сам
 * макет, и только по подписи из плейлиста, которая живёт 10 минут.
 *
 * Честно: запись экрана так не остановить, и человек с инструментами
 * разработчика, пока макет открыт, может собрать ролик руками. Защита — от
 * «Сохранить видео как», от ссылки на файл и от скачивания кодом.
 */

export type Promo = {
  /** Папка с кусками в public. */
  dir: string;
  /** Имя секрета с ключом (16 байт в hex). */
  secret: string;
  /** Длительность каждого куска, секунды: из сборки ролика. */
  parts: number[];
};

export const PROMOS: Record<string, Promo> = {
  sia: { dir: "/protos/sia/promo", secret: "PROMO_KEY_SIA", parts: [4, 4, 4, 4, 4, 4, 4, 4, 4] },
};

/** Подпись на ключ живёт 10 минут: дольше ролик не грузится. */
export const SIGN_TTL_MS = 10 * 60_000;

const sig = (key: string, token: string, exp: number) =>
  createHmac("sha256", Buffer.from(key, "hex")).update(`promo:${token}:${exp}`).digest("base64url").slice(0, 32);

export function signKey(key: string, token: string, now = Date.now()): { e: number; s: string } {
  const e = now + SIGN_TTL_MS;
  return { e, s: sig(key, token, e) };
}

export function keySigned(key: string, token: string, e: string | null, s: string | null, now = Date.now()): boolean {
  const exp = Number(e);
  if (!Number.isFinite(exp) || exp < now || exp > now + SIGN_TTL_MS || !s) return false;
  const want = Buffer.from(sig(key, token, exp));
  const got = Buffer.from(s);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Плейлист HLS: куски из public, ключ — по подписи через наш маршрут. */
export function playlist(promo: Promo, base: string, sign: { e: number; s: string }): string {
  const top = Math.ceil(Math.max(...promo.parts, 1));
  return [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-PLAYLIST-TYPE:VOD",
    `#EXT-X-TARGETDURATION:${top}`,
    "#EXT-X-MEDIA-SEQUENCE:0",
    `#EXT-X-KEY:METHOD=AES-128,URI="${base}/promo/key?e=${sign.e}&s=${sign.s}",IV=0x${"0".repeat(32)}`,
    ...promo.parts.flatMap((d, i) => [`#EXTINF:${d.toFixed(3)},`, `${promo.dir}/p${i}.ts`]),
    "#EXT-X-ENDLIST",
    "",
  ].join("\n");
}

/** Ключ в хранилище — 32 знака hex; иное за ключ не считаем. */
export const keyOk = (key: string | null): key is string => typeof key === "string" && /^[0-9a-f]{32}$/i.test(key);

/**
 * Сцена макета, зашифрованная целиком (владелец, 21.10.2026, про SamAuto:
 * «защити его, я не хочу, чтобы через консоль кто-то смог вытащить код и
 * украсть то, что тут есть»): кадры и видео в public — AES-256-GCM, файл =
 * 12 байт nonce + шифр (scripts/protos/samauto/seal.py). Ключ — секрет в
 * хранилище, отдаёт его app/proto/[token]/promo/scene тому, кому открыт
 * макет. Честно: пока макет открыт, расшифрованные кадры живут в памяти
 * браузера, и человек с инструментами разработчика может их собрать. Защита —
 * от скачивания файлов с сервера и из репозитория.
 */
export const SCENES: Record<string, string> = { samauto: "SCENE_KEY_SAMAUTO" };

/** Ключ сцены — 64 знака hex (32 байта). */
export const sceneKeyOk = (key: string | null): key is string => typeof key === "string" && /^[0-9a-f]{64}$/i.test(key);
