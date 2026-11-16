import { createHash, randomBytes } from "node:crypto";

import { inSlot, siteOpens } from "@/lib/proto/instant/bot-deps";
import { readClientSite } from "@/lib/proto/instant/read";
import { parseSiteRequest, runSiteBuild, siteCaseLinks, siteLimit, WEB_COOKIE, type SiteEvent } from "@/lib/proto/instant/site";
import { siteStaff } from "@/lib/proto/instant/site-staff";
import { saveInstantProto, siteCounts } from "@/lib/proto/instant/store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

/**
 * «Собрать макет» на главной (lib/proto/instant/site.ts): сборка идёт здесь,
 * а окно получает её шаги потоком событий — по мере того, как сервер их
 * делает, как виджет в боте. Модель — только Haiku в разборе сайта.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const ipMark = (ip: string) => createHash("sha256").update(`instant:${ip}`).digest("hex").slice(0, 20);
const webOf = (cookie: string | null) => /(?:^|;\s*)dz_mk=([a-f0-9]{24})(?:;|$)/.exec(cookie ?? "")?.[1] ?? null;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const staff = await siteStaff(request);
  // Страховка от скрипта: несколько сборок подряд с одного адреса — отказ до базы.
  // Сотрудник собирает своим клиентам подряд — ему всплеск не помеха.
  const burst = staff ? { ok: true as const, retryAfter: 0 } : rateLimit(`instant:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!burst.ok) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(burst.retryAfter) } });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const req = parseSiteRequest(body);
  if (req === "bad") return Response.json({ error: "bad_request" }, { status: 400 });

  const known = webOf(request.headers.get("cookie"));
  const webId = known ?? randomBytes(12).toString("hex");
  const mark = ipMark(ip);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (event: SiteEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        // Ловушка для ботов заполнена: делаем вид, что собирать нечего.
        if (req === "trap") {
          push({ t: "error" });
          return;
        }
        const counts = await siteCounts(known, mark);
        if (!counts) {
          push({ t: "error" });
          return;
        }
        const verdict = siteLimit(counts, Boolean(staff));
        if (verdict === "has" && counts.token) {
          push({ t: "has", token: counts.token, name: counts.name ?? "", admin: counts.admin });
          return;
        }
        if (verdict !== "ok") {
          // Черновик, потолок адреса или дня — как ручной путь в боте: соберёт дизайнер.
          push({ t: "manual", why: verdict === "draft" ? "failed" : "limit", niche: req.niche, cases: siteCaseLinks(req.niche, req.siteLocale) });
          return;
        }
        await runSiteBuild(
          req,
          {
            reachable: siteOpens,
            read: (url, niche, locale, onStep) => inSlot(() => readClientSite(url, niche, locale, { onStep })),
            save: (build) => saveInstantProto(build, { tgId: null, username: null, staffId: staff?.id ?? null, web: { id: webId, ip: mark } }),
            now: () => new Date(),
          },
          (event) => push(staff && event.t === "done" ? { ...event, staff: true } : event),
        );
      } catch (error) {
        console.error("макет на сайте: сборка упала", error instanceof Error ? error.message : error);
        push({ t: "error" });
      } finally {
        controller.close();
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    Connection: "keep-alive",
  };
  // Кука — до первого события: по ней «один макет на браузер», год, только сервер.
  if (!known) headers["Set-Cookie"] = `${WEB_COOKIE}=${webId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax; Secure`;
  return new Response(stream, { headers });
}

/** Окно открылось: есть ли у этого браузера готовый макет — тогда сразу он. */
export async function GET(request: Request) {
  const known = webOf(request.headers.get("cookie"));
  const staff = Boolean(await siteStaff(request));
  const flag = staff ? { staff: true } : {};
  if (!known) return Response.json(flag, { headers: { "Cache-Control": "no-store" } });
  const counts = await siteCounts(known, ipMark(clientIp(request))).catch(() => null);
  const has = counts?.has === "ready" && counts.token ? { token: counts.token, name: counts.name ?? "", admin: counts.admin } : undefined;
  return Response.json(has ? { has, ...flag } : flag, { headers: { "Cache-Control": "no-store" } });
}
