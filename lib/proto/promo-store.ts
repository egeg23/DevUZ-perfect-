import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";
import { looksLikeAccessToken } from "@/lib/store/access";
import { activeLock } from "@/lib/proto/lock";
import { accessBy } from "@/lib/proto/serve";
import { PROMOS, SCENES, keyOk, keySigned, playlist, sceneKeyOk, signKey, type Promo } from "@/lib/proto/promo";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Сборка макета — тому же, кому открыт макет: тот же токен, не черновик, а
 * закрытый паролем — с той же кукой пароля (lib/proto/serve). Иначе null.
 */
async function bundleFor(request: Request, token: string): Promise<string | null> {
  if (!looksLikeAccessToken(token)) return null;
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("protos").select("id, status, facts, closed_at").eq("token", token).maybeSingle();
  if (!data || data.status === "draft") return null;
  const facts = data.facts as { bundle?: unknown; lock?: unknown; lockAt?: unknown } | null;
  if (typeof facts?.bundle !== "string") return null;
  const lock = activeLock(facts);
  const closed = Boolean(data.closed_at);
  if ((lock || closed) && !(await accessBy(request.headers.get("cookie"), { id: String(data.id), lock, closed }))) return null;
  return facts.bundle;
}

/** Ролик макета: ответ 404 не подтверждает, что ролик есть. */
async function promoFor(request: Request, token: string): Promise<{ promo: Promo; key: string } | null> {
  const bundle = await bundleFor(request, token);
  const promo = bundle ? PROMOS[bundle] : undefined;
  if (!promo || !promo.parts.length) return null;
  const key = await appSecret(promo.secret);
  return keyOk(key) ? { promo, key } : null;
}

/**
 * Ключ сцены (SamAuto): кадры и видео лежат в public зашифрованными, макет
 * спрашивает ключ кодом со своей же страницы. Открытием во вкладке и с
 * чужого сайта — 404.
 */
async function serveScene(request: Request, token: string, none: Response): Promise<Response> {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return none;
  const bundle = await bundleFor(request, token);
  const secret = bundle ? SCENES[bundle] : undefined;
  if (!secret) return none;
  const key = await appSecret(secret);
  if (!sceneKeyOk(key)) return none;
  return new Response(Buffer.from(key, "hex"), { headers: { ...HEADERS, "Content-Type": "application/octet-stream" } });
}

/** `index.m3u8` — плейлист с подписью на ключ; `key` — 16 байт ключа; `scene` — ключ сцены. */
export async function servePromo(request: Request, token: string, file: string): Promise<Response> {
  const none = new Response(null, { status: 404, headers: HEADERS });
  if (file !== "index.m3u8" && file !== "key" && file !== "scene") return none;
  // Ключ открытием во вкладке не получить: его спрашивает только плеер.
  if (file !== "index.m3u8" && request.headers.get("sec-fetch-dest") === "document") return none;
  if (file === "scene") return serveScene(request, token, none);
  const found = await promoFor(request, token);
  if (!found) return none;
  const { promo, key } = found;
  if (file === "index.m3u8") {
    return new Response(playlist(promo, `/proto/${token}`, signKey(key, token)), {
      headers: { ...HEADERS, "Content-Type": "application/vnd.apple.mpegurl" },
    });
  }
  const url = new URL(request.url);
  if (!keySigned(key, token, url.searchParams.get("e"), url.searchParams.get("s"))) return none;
  return new Response(Buffer.from(key, "hex"), { headers: { ...HEADERS, "Content-Type": "application/octet-stream" } });
}
