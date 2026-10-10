import { PAYME_ERRORS, payme, paymeAuthorized } from "@/lib/ai-staff/billing";
import { dbPayRepo, payConfig } from "@/lib/ai-staff/pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payme Merchant API: адрес, который указывается в кабинете Payme Business.
 * JSON-RPC, ответ всегда HTTP 200 — так требует Payme: другой код он
 * считает системной ошибкой. Касса не настроена — ошибка прав, как чужому.
 */
export async function POST(request: Request) {
  const cfg = await payConfig();
  let body: { id?: unknown; method?: unknown; params?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ id: null, error: PAYME_ERRORS.parse });
  }
  const id = body?.id ?? null;
  if (!cfg.payme || !paymeAuthorized(request.headers.get("authorization"), cfg.payme.key)) {
    return Response.json({ id, error: PAYME_ERRORS.auth });
  }
  if (typeof body?.method !== "string" || !body.params || typeof body.params !== "object") {
    return Response.json({ id, error: PAYME_ERRORS.request });
  }
  try {
    const reply = await payme(dbPayRepo, body.method, body.params as Record<string, unknown>, Date.now());
    return Response.json({ id, ...reply });
  } catch (error) {
    console.error("ai-staff: Payme", error);
    return Response.json({ id, error: { code: -32400, message: { ru: "Системная ошибка", uz: "Tizim xatosi", en: "System error" } } });
  }
}
