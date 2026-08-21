import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { isLocale, type Locale } from "@/lib/i18n";
import { saveLead } from "@/lib/qualify/store";
import { sendLead } from "@/lib/qualify/telegram";
import { scoreLead } from "@/lib/qualify/scoring";
import type { QualifyToolInput } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обычная форма — запасной путь, когда чат недоступен или человек просто не
 * хочет разговаривать с ботом.
 *
 * Квалификации здесь нет и не должно быть: выдумывать грейды по трём полям
 * формы значит отправить менеджеру уверенную ложь. Поэтому все категории
 * выставлены в худшие, а в резюме прямо написано, что лид пришёл формой и
 * не квалифицирован.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`lead:${clientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Ловушка для ботов: поле скрыто в разметке, человек его не заполнит.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true });
  }

  const text = (value: unknown, max = 500) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const name = text(body.name, 120);
  const contact = text(body.contact, 200);
  const message = text(body.message, 1500);
  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

  if (!contact) {
    return Response.json({ error: "contact_required" }, { status: 400 });
  }

  const unqualified = "не выяснено — лид пришёл через форму, без диалога";

  const input: QualifyToolInput = {
    contact_name: name,
    company: "",
    contact_handle: contact,
    niche: unqualified,
    niche_tier: 3,
    expertise: "low",
    services: [],
    budget: "B3",
    authority: "A3",
    need: "N3",
    timing: "T3",
    intent: "needs_human",
    summary: {
      client: name || "имя не указано",
      request: message || "текст задачи не указан",
      niche: unqualified,
      expertise: unqualified,
      budget: unqualified,
      authority: unqualified,
      need: unqualified,
      timing: unqualified,
    },
    notes:
      "Заявка из формы, а не из чата. Квалификации нет — грейды выставлены в худшие по умолчанию. Первый звонок должен начинаться с BANT.",
  };

  const lead = scoreLead(input, locale);

  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, [], "form");
  } catch (error) {
    console.error("saveLead form", error);
  }

  const delivered = await sendLead(lead, [], leadId ?? "unsaved");

  // Если и база, и Telegram недоступны — заявка потеряна, и врать об успехе
  // нельзя: человек должен увидеть подсказку написать напрямую.
  if (!delivered && !leadId) {
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
