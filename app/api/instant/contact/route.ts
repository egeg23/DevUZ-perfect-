import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { isCircleNiche, type CircleNiche } from "@/lib/admin/sales-after-reply";
import { INSTANT_SOURCE, MANUAL_SOURCE, manualHeading } from "@/lib/proto/instant/bot-deps";
import { contactOk, webLeadInput } from "@/lib/proto/instant/site";
import { claimWebLead, setProtoLead, siteProtoOf } from "@/lib/proto/instant/store";
import { protoUrl } from "@/lib/proto/store";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { isLocale, type Locale } from "@/lib/i18n";

/**
 * «Связаться» в окне «Собрать макет»: контакт оставил сам человек — лид тем
 * же путём, что у бота и формы (saveLead + routeNewLead: очередь тёплых
 * лидов, ночью — утром). Готовый макет — источник «mockup», не собрался или
 * потолок — «mockup-manual» с шапкой «🔥 Нужен макет вручную».
 */
export const runtime = "nodejs";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const webOf = (cookie: string | null) => /(?:^|;\s*)dz_mk=([a-f0-9]{24})(?:;|$)/.exec(cookie ?? "")?.[1] ?? null;

export async function POST(request: Request) {
  const limit = rateLimit(`instant-contact:${clientIp(request)}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return Response.json({ error: "rate_limited" }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  // Ловушка для ботов: людям поле не видно.
  if (text(body.hp, 200)) return Response.json({ ok: true });
  const contact = text(body.contact, 120);
  if (!contactOk(contact)) return Response.json({ error: "contact" }, { status: 400 });
  const webId = webOf(request.headers.get("cookie"));
  if (!webId) return Response.json({ error: "no_browser" }, { status: 400 });
  const siteLocale: Locale = isLocale(text(body.locale, 5)) ? (text(body.locale, 5) as Locale) : "ru";

  const token = text(body.token, 80);
  const proto = token ? await siteProtoOf(token, webId) : null;
  if (token && !proto) return Response.json({ error: "not_yours" }, { status: 403 });
  const nicheRaw = proto ? proto.niche : text(body.niche, 40);
  const niche: CircleNiche = isCircleNiche(nicheRaw) ? nicheRaw : "general";
  const why = proto ? "built" : "failed";
  const site = proto?.source && /^https?:/.test(proto.source) ? proto.source : text(body.site, 300) || null;

  // Один браузер — одна карточка за неделю: второе «Связаться» — тот же ответ без нового лида.
  if (!(await claimWebLead(webId).catch(() => true))) return Response.json({ ok: true });

  const input = webLeadInput({ contact, name: proto?.name ?? text(body.name, 60), niche, site, link: proto ? protoUrl(token) : null, why, siteLocale });
  const lead = scoreLead(input, siteLocale);
  const requestNo = newRequestNo();
  const source = why === "built" ? INSTANT_SOURCE : MANUAL_SOURCE;
  const origin = { entryPath: `/${siteLocale}#maket`, entryRef: null };
  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, [], source, { requestNo, origin });
  } catch (error) {
    console.error("макет на сайте: лид не записался", error);
  }
  const delivered = await routeNewLead({
    leadId: leadId ?? "unsaved",
    lead,
    requestNo,
    origin: { ...origin, source },
    heading: why === "failed" ? manualHeading({ niche, site }, "site") : undefined,
    fallback: await salesRecipients(),
  }).catch((error) => {
    console.error("макет на сайте: лид не разослан", error);
    return false;
  });
  if (leadId && proto) await setProtoLead(proto.id, leadId).catch(() => undefined);
  if (!delivered && !leadId) return Response.json({ error: "delivery_failed" }, { status: 502 });
  return Response.json({ ok: true });
}
