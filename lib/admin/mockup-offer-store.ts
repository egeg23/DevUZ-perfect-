import { OFFER_MS, foreignMockup, mockupLinks, type MockupLink, type MockupOwner, type OfferLang } from "@/lib/admin/mockup-offer";
import { scanFields } from "@/lib/admin/mockup-scan";
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
 * Третий путь — скан дважды в день (lib/admin/mockup-scan.ts): то, что эти
 * два пропустили. Найденное сканом помечено (source = scan), старое клиенту
 * задним числом не пишется (quiet, или сразу «закончилась»).
 *
 * Повторная отправка той же ссылки тому же клиенту срок не продлевает:
 * строка одна на клиента и макет (уникальный индекс в базе).
 *
 * Модуль лёгкий намеренно: его грузит скаут. Расписание напоминаний —
 * lib/admin/mockup-offer-run.ts, кнопки бота — mockup-offer-bot.ts.
 */

type Resolved = { ref: string; name: string; url: string; lang: OfferLang | null; owner: MockupOwner };

async function resolve(link: MockupLink): Promise<Resolved | null> {
  if (link.kind === "showcase") {
    // Проект витрины — тот, чей адрес совпадает с началом ссылки; самый длинный.
    const item = showcaseCases()
      .map((c) => ({ c, path: c.url!.slice(SHOWCASE_HOST.length).replace(/\/+$/, "") }))
      .filter(({ path }) => path && (link.path === path || link.path.startsWith(`${path}/`)))
      .sort((a, b) => b.path.length - a.path.length)[0]?.c;
    return item
      ? { ref: `s:${item.slug}`, name: item.name, url: item.url!, lang: null, owner: { prospectId: null, hosts: [], names: [item.name] } }
      : null;
  }
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("protos")
    .select("id, name, locale, status, token, prospect_id, facts")
    .eq("token", link.token)
    .neq("status", "draft")
    .maybeSingle();
  if (!data) return null;
  const facts = (data.facts ?? {}) as { source?: unknown; name?: unknown };
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? [v] : []);
  return {
    ref: `p:${data.id}`,
    name: String(data.name ?? ""),
    url: `${siteUrl}/proto/${data.token}`,
    lang: data.locale === "uz" ? "uz" : null,
    owner: {
      prospectId: (data.prospect_id as string | null) ?? null,
      hosts: text(facts.source),
      names: [...text(data.name), ...text(facts.name)],
    },
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
  /** Кому ушло, если касания нет: id в Telegram, @адрес или «lead:<id>». */
  peer?: string | null;
  /** Как звать клиента, если касания нет. */
  client?: string | null;
  /** Когда ушло само сообщение. */
  at?: Date;
  /** Найдено сканом: старое клиенту не пишется (scanFields). */
  scan?: { now: Date };
}): Promise<number> {
  const links = mockupLinks(input.body);
  if (!links.length) return 0;
  const db = serviceClient();
  if (!db) return 0;

  let client = input.client || input.peer || "";
  let leadId = input.leadId ?? null;
  let lang: OfferLang = "ru";
  // С чем сверять, свой ли это макет: касание, сайт, название. @ник — не название.
  const who = { prospectId: input.prospectId, host: null as string | null, names: input.client ? [input.client] : [] };
  if (input.prospectId) {
    const { data: p } = await db
      .from("prospects")
      .select("host, label, lead_id, walked")
      .eq("id", input.prospectId)
      .maybeSingle();
    if (p) {
      client = String(p.label || p.host || client);
      who.host = (p.host as string | null) ?? null;
      if (p.label) who.names = [String(p.label)];
      leadId = leadId ?? ((p.lead_id as string | null) ?? null);
      if ((p.walked as { lang?: string } | null)?.lang === "uz") lang = "uz";
    }
  }

  const at = input.at ?? new Date();
  let started = 0;
  for (const link of links) {
    const mockup = await resolve(link);
    if (!mockup) continue;
    // Пример чужого проекта — не его макет: акции нет (lib/admin/mockup-offer, foreignMockup).
    if (foreignMockup(mockup.owner, who)) continue;
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
      ...(input.scan ? scanFields(at, input.scan.now) : {}),
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
  /** Когда ушло сообщение — у скана это дата из Telegram, а не «сейчас». */
  at?: Date;
  scan?: { now: Date };
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
    at: input.at,
    scan: input.scan,
  });
}

/**
 * Скан (lib/admin/mockup-scan.ts): взять слот для аккаунта или базы. Один раз
 * на слот — второй проход свипа и перезапуск скаута того же не повторят.
 */
export async function claimMockupScan(account: string, slot: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db.from("mockup_scans").insert({ account, slot });
  if (error && error.code !== "23505") console.error("скан макетов: слот не взят", error.message);
  return !error;
}

/** Скан прошёл: сколько диалогов или сообщений смотрели и сколько нашли. */
export async function finishMockupScan(
  account: string,
  slot: string,
  result: { seen: number; found: number; error?: string | null },
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("mockup_scans")
    .update({ finished_at: new Date().toISOString(), seen: result.seen, found: result.found, error: result.error ?? null })
    .eq("account", account)
    .eq("slot", slot);
}
