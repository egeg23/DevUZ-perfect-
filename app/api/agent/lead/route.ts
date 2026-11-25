import { AGENT_DAY_CAP, AGENT_SOURCE, agentLeadInput, agentName, parseAgentLead } from "@/lib/agent/lead";
import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { attributeAndNotify } from "@/lib/partners/attribute";
import { codeFromQuery } from "@/lib/partners/rules";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { refFromClient } from "@/lib/qualify/origin";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { absoluteUrl } from "@/lib/seo";
import { locales } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Заявка от ИИ-агента за клиента (владелец, 24.11.2026: «Разрешаем агенту
 * отправлять нам заявки»). Как пользоваться — в /llms.txt и в конце каждой
 * текстовой страницы (lib/agent/markdown.ts), и здесь же по GET.
 *
 * Дальше заявка идёт тем же путём, что форма сайта: `saveLead` и
 * `routeNewLead` (очередь тёплых лидов, ночью — утром). Источник — «agent»:
 * в карточке лида «заявка от ИИ-агента».
 */
export function GET() {
  return Response.json({
    name: "DevUz Studio: request on behalf of a client",
    method: "POST",
    url: absoluteUrl("api/agent/lead"),
    content_type: "application/json",
    required: {
      contact: "client's phone, Telegram @username or email",
      message: "what the client needs, in their own words (10+ characters)",
      consent: "true: the client asked you to send this request",
    },
    optional: {
      name: "client's name",
      company: "client's company",
      locale: locales,
      agent: "name of your service",
    },
    response: { ok: true, request: "DZ-MMDD-XXXX" },
    errors: ["invalid_json", "consent_required", "contact_required", "contact_invalid", "message_required", "rate_limited", "delivery_failed"],
    docs: absoluteUrl("llms.txt"),
  });
}

export async function POST(request: Request) {
  const limit = rateLimit(`agent-lead:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseAgentLead(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  // Потолок на весь сайт: поток заявок от одного сбившегося агента не должен
  // залить очередь лидов. Считаются только заявки, прошедшие проверку.
  const day = rateLimit("agent-lead:all", { limit: AGENT_DAY_CAP, windowMs: 24 * 3600 * 1000 });
  if (!day.ok) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(day.retryAfter) } });
  }

  const who = agentName(parsed.lead, request.headers.get("user-agent"));
  const lead = scoreLead(agentLeadInput(parsed.lead, who), parsed.lead.locale);
  const origin = { entryPath: "/api/agent/lead", entryRef: refFromClient(parsed.lead.agent) };
  const requestNo = newRequestNo();

  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, [], AGENT_SOURCE, { requestNo, origin });
  } catch (error) {
    console.error("saveLead agent", error);
  }

  // «промокод AZIZ» в словах клиента или код партнёра полем `ref`.
  if (leadId) {
    try {
      await attributeAndNotify(
        leadId,
        { code: codeFromQuery((body as { ref?: unknown }).ref), at: null },
        { ...lead, said: parsed.lead.message },
      );
    } catch (error) {
      console.error("partners: привязка заявки агента", error);
    }
  }

  const delivered = await routeNewLead({
    leadId: leadId ?? "unsaved",
    lead,
    requestNo,
    origin: { ...origin, source: AGENT_SOURCE },
    fallback: await salesRecipients(),
  });

  if (!delivered && !leadId) {
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, request: requestNo });
}
