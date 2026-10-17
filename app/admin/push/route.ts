import { appDict } from "@/content/admin-panel/app";
import { currentStaff } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { PUSH_HOME, deviceLabel, parseSubscription } from "@/lib/admin/push";
import {
  hasSubscription,
  pushToStaff,
  removeSubscription,
  saveSubscription,
  vapidPublicKey,
} from "@/lib/admin/push-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Пуш-подписка устройства (CLAUDE.md, «Панель — приложение на телефоне и
 * пуш»).
 *
 * Адрес — под /admin, как маячок (app/admin/beacon): кука сессии панели
 * живёт только здесь. Кто подписывается — из куки, а не из тела запроса:
 * подписать своё устройство на чужие сообщения нельзя. Сервис-воркер
 * (lib/admin/pwa.ts) ходит сюда же, когда браузер сам сменил подписку.
 *
 * GET — открытый ключ VAPID (при первом обращении пара заводится в
 * хранилище секретов сама). POST — `subscribe`, `unsubscribe`, `status` и
 * `test`: тестовый пуш себе на все свои устройства.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  return !origin || !host || new URL(origin).host === host;
}

export async function GET() {
  const staff = await currentStaff();
  if (!staff) return json({ error: "auth" }, 401);
  const publicKey = await vapidPublicKey();
  return publicKey ? json({ publicKey }) : json({ error: "offline" }, 503);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  const staff = await currentStaff();
  if (!staff) return json({ error: "auth" }, 401);

  let body: { action?: unknown; subscription?: unknown; endpoint?: unknown; standalone?: unknown; old?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "body" }, 400);
  }

  if (body.action === "subscribe") {
    const sub = parseSubscription(body.subscription);
    if (!sub) return json({ error: "subscription" }, 400);
    if (typeof body.old === "string" && body.old !== sub.endpoint) await removeSubscription(staff.id, body.old);
    const device = deviceLabel(request.headers.get("user-agent"), body.standalone === true);
    return (await saveSubscription(staff.id, sub, device)) ? json({ ok: true }) : json({ error: "offline" }, 503);
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
  if (body.action === "unsubscribe") {
    if (!endpoint) return json({ error: "endpoint" }, 400);
    await removeSubscription(staff.id, endpoint);
    return json({ ok: true });
  }

  if (body.action === "status") {
    return json({ subscribed: endpoint ? await hasSubscription(staff.id, endpoint) : false });
  }

  if (body.action === "test") {
    const t = pick(appDict, staff.panel_locale);
    const result = await pushToStaff(staff.id, { title: t.testTitle, body: t.testBody, url: PUSH_HOME });
    return json({ ok: result.sent > 0, ...result });
  }

  return json({ error: "action" }, 400);
}
