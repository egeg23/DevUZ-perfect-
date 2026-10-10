import { handleIncoming } from "@/lib/ai-staff/service";
import { channelByWidgetKey, salesEmployee, serviceEnabled, tenantById } from "@/lib/ai-staff/store";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Виджет на сайте клиента: приём сообщения покупателя и ответ ИИ.
 *
 * Ключ виджета публичный — он в разметке сайта клиента, — поэтому он
 * только называет клиента, а защиту от расхода держат лимиты: по адресу
 * посетителя и по разговору. Куки не нужны, отсюда `*` в CORS.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { ...CORS, ...extra } });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Что показать в шапке виджета: название компании, имя помощника, приветствие. */
export async function GET(request: Request) {
  if (!(await serviceEnabled())) return json({ error: "off" }, 404);
  const key = new URL(request.url).searchParams.get("k") ?? "";
  const channel = await channelByWidgetKey(key);
  if (!channel || channel.status !== "active") return json({ error: "unknown" }, 404);
  const tenant = await tenantById(channel.tenant_id);
  const employee = await salesEmployee(channel.tenant_id);
  if (!tenant || !employee) return json({ error: "unknown" }, 404);
  return json(
    { company: tenant.name, assistant: employee.name, greeting: employee.greeting, locale: tenant.locale },
    200,
    { "Cache-Control": "public, max-age=300" },
  );
}

export async function POST(request: Request) {
  if (!(await serviceEnabled())) return json({ error: "off" }, 404);
  const ip = clientIp(request);
  if (!rateLimit(`ai-widget:${ip}`, { limit: 30, windowMs: 10 * 60_000 }).ok) return json({ error: "rate_limited" }, 429);

  const body = (await request.json().catch(() => null)) as { key?: unknown; visitor?: unknown; text?: unknown } | null;
  const key = typeof body?.key === "string" ? body.key : "";
  const visitor = typeof body?.visitor === "string" && /^[\w-]{12,64}$/.test(body.visitor) ? body.visitor : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!key || !visitor || !text) return json({ error: "bad_request" }, 400);
  if (!rateLimit(`ai-widget-v:${visitor}`, { limit: 12, windowMs: 60_000 }).ok) return json({ error: "rate_limited" }, 429);

  const channel = await channelByWidgetKey(key);
  if (!channel || channel.status !== "active") return json({ error: "unknown" }, 404);

  try {
    const outcome = await handleIncoming({
      tenantId: channel.tenant_id,
      channel,
      kind: "widget",
      chatKey: visitor,
      text,
      customer: { name: "", handle: null },
    });
    if (outcome.kind === "reply") return json({ reply: outcome.text, requestNo: outcome.lead?.request_no ?? null });
    if (outcome.kind === "stopped") return json({ reply: outcome.text });
    return json({ reply: null });
  } catch (error) {
    console.error("ai-staff: виджет", error);
    return json({ error: "failed" }, 500);
  }
}
