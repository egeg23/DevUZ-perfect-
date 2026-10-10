import { after } from "next/server";

import { handleInstagramEvent, igConfig, parseEvents, validSignature } from "@/lib/ai-staff/instagram";
import { serviceEnabled } from "@/lib/ai-staff/store";
import { safeEqual } from "@/lib/ai-staff/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Вебхук Instagram (Meta). GET — проверка адреса при настройке приложения:
 * вернуть hub.challenge, если совпал наш verify token. POST — сообщения;
 * подпись X-Hub-Signature-256 считается секретом приложения по сырому
 * телу, без неё — отказ. Ответ Meta сразу, работа — после.
 */
export async function GET(request: Request) {
  const cfg = await igConfig();
  const q = new URL(request.url).searchParams;
  if (cfg && q.get("hub.mode") === "subscribe" && safeEqual(q.get("hub.verify_token") ?? "", cfg.verifyToken)) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const cfg = await igConfig();
  const raw = await request.text();
  if (!cfg || !validSignature(raw, request.headers.get("x-hub-signature-256"), cfg.appSecret)) {
    return new Response("forbidden", { status: 403 });
  }
  if (!(await serviceEnabled())) return Response.json({ ok: true });
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok: true });
  }
  const events = parseEvents(payload);
  after(async () => {
    for (const event of events) {
      try {
        await handleInstagramEvent(event);
      } catch (error) {
        console.error("ai-staff: Instagram", error);
      }
    }
  });
  return Response.json({ ok: true });
}
