import { click } from "@/lib/ai-staff/billing";
import { dbPayRepo, payConfig } from "@/lib/ai-staff/pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Click SHOP API: один адрес на Prepare и Complete (их различает action).
 * Тело — форма; ответ — JSON. Подпись сверяется с секретом сервиса.
 */
export async function POST(request: Request) {
  const cfg = await payConfig();
  const form = await request.formData().catch(() => null);
  const fields: Record<string, string> = {};
  for (const [key, value] of form?.entries() ?? []) if (typeof value === "string") fields[key] = value;
  if (!cfg.click) return Response.json({ error: -8, error_note: "Error in request from click" });
  try {
    return Response.json(await click(dbPayRepo, fields, { secret: cfg.click.secret, serviceId: cfg.click.serviceId }, Date.now()));
  } catch (error) {
    console.error("ai-staff: Click", error);
    return Response.json({ error: -7, error_note: "Failed to update user" });
  }
}
