import { OFFER_MS, mockupLinks, type MockupLink, type OfferLang } from "@/lib/admin/mockup-offer";
import { SHOWCASE_HOST, showcaseCases } from "@/lib/admin/mockups";
import { normalizeHandle } from "@/lib/admin/outreach-talk";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Акция после макета (lib/admin/mockup-offer.ts): записать, что макет ушёл
 * клиенту, — с этой минуты идут 48 часов.
 *
 * Два пути, и оба ведут сюда:
 * - сообщение ушло через очередь бота (ответ из карточки лида, модель) —
 *   зовёт markReplySent (outreach-talk-store);
 * - менеджер отправил ссылку руками с рабочего аккаунта в Telegram — скаут
 *   видит своё исходящее и зовёт recordMockupOut.
 *
 * Повторная отправка той же ссылки тому же клиенту срок не продлевает:
 * строка одна на клиента и макет (уникальный индекс в базе).
 *
 * Модуль лёгкий намеренно: его грузит скаут. Расписание напоминаний —
 * lib/admin/mockup-offer-run.ts, кнопки бота — mockup-offer-bot.ts.
 */

type Resolved = { ref: string; name: string; url: string; lang: OfferLang | null };

async function resolve(link: MockupLink): Promise<Resolved | null> {
  if (link.kind === "showcase") {
    // Проект витрины — тот, чей адрес совпадает с началом ссылки; самый длинный.
    const item = showcaseCases()
      .map((c) => ({ c, path: c.url!.slice(SHOWCASE_HOST.length).replace(/\/+$/, "") }))
      .filter(({ path }) => path && (link.path === path || link.path.startsWith(`${path}/`)))
      .sort((a, b) => b.path.length - a.path.length)[0]?.c;
    return item ? { ref: `s:${item.slug}`, name: item.name, url: item.url!, lang: null } : null;
  }
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("protos")
    .select("id, name, locale, status, token")
    .eq("token", link.token)
    .neq("status", "draft")
    .maybeSingle();
  if (!data) return null;
  return {
    ref: `p:${data.id}`,
    name: String(data.name ?? ""),
    url: `${siteUrl}/proto/${data.token}`,
    lang: data.locale === "uz" ? "uz" : null,
  };
}

/**
 * Макет ушёл клиенту. Возвращает, сколько акций началось (0 — ссылки не
 * наши или по этому макету акция у клиента уже идёт).
 */
export async function recordMockupSent(input: {
  prospectId: string | null;
  leadId?: string | null;
  body: string;
  account?: string | null;
  /** Кому ушло, если касания нет: id в Telegram или @адрес. */
  peer?: string | null;
  at?: Date;
}): Promise<number> {
  const links = mockupLinks(input.body);
  if (!links.length) return 0;
  const db = serviceClient();
  if (!db) return 0;

  let client = input.peer ?? "";
  let leadId = input.leadId ?? null;
  let lang: OfferLang = "ru";
  if (input.prospectId) {
    const { data: p } = await db
      .from("prospects")
      .select("host, label, lead_id, walked")
      .eq("id", input.prospectId)
      .maybeSingle();
    if (p) {
      client = String(p.label || p.host || client);
      leadId = leadId ?? ((p.lead_id as string | null) ?? null);
      if ((p.walked as { lang?: string } | null)?.lang === "uz") lang = "uz";
    }
  }

  const at = input.at ?? new Date();
  let started = 0;
  for (const link of links) {
    const mockup = await resolve(link);
    if (!mockup) continue;
    const { error } = await db.from("mockup_offers").insert({
      mockup_ref: mockup.ref,
      mockup_name: mockup.name,
      mockup_url: mockup.url,
      prospect_id: input.prospectId,
      lead_id: leadId,
      client: client || mockup.name,
      peer: input.prospectId ? null : (input.peer ?? null),
      account: input.account ?? null,
      lang: mockup.lang ?? lang,
      sent_at: at.toISOString(),
      expires_at: new Date(at.getTime() + OFFER_MS).toISOString(),
    });
    // 23505 — по этому макету у клиента акция уже идёт: срок не продлеваем.
    if (error && error.code !== "23505") console.error("акция по макету: не записалась", error.message);
    if (!error) started += 1;
  }
  return started;
}

/**
 * Скаут: со своего рабочего аккаунта ушло сообщение со ссылкой на макет.
 * Клиент ищется среди касаний — по id в Telegram, потом по @адресу.
 */
export async function recordMockupOut(input: {
  account: string;
  userId: string;
  handle: string;
  body: string;
}): Promise<number> {
  if (!mockupLinks(input.body).length) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const handle = normalizeHandle(input.handle);

  let prospect: { id: string; lead_id: string | null } | null = null;
  if (input.userId) {
    const { data } = await db
      .from("prospects")
      .select("id, lead_id")
      .eq("target_user_id", input.userId)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    prospect = (data as typeof prospect) ?? null;
  }
  if (!prospect && handle) {
    const { data } = await db
      .from("prospects")
      .select("id, lead_id, target")
      .ilike("target", `%${handle}%`)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(20);
    const hit = (data ?? []).find((row) => normalizeHandle(String(row.target ?? "")) === handle);
    prospect = hit ? { id: String(hit.id), lead_id: (hit.lead_id as string | null) ?? null } : null;
  }

  return recordMockupSent({
    prospectId: prospect?.id ?? null,
    leadId: prospect?.lead_id ?? null,
    body: input.body,
    account: input.account,
    peer: prospect ? null : handle ? `@${handle}` : input.userId || null,
  });
}
