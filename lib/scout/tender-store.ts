import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { PRICE_RULE, promoteTenders } from "@/lib/scout/tender-lead";
import { SOURCE_LABEL, mergeLots, withContact, type SourceResult, type TenderLot, type TenderSource } from "@/lib/scout/tender-sources";
import { serviceClient } from "@/lib/supabase";

/**
 * Тендеры скаута: проход, лента и решения по лоту.
 *
 * Раз в `SCAN_EVERY_MS` свип читает площадки (lib/scout/tender-sources.ts),
 * кладёт наши лоты в `scout_tenders` (пара «площадка + номер» уникальна —
 * повтор не задваивает) и новые шлёт строкой в канал скаута, тот же, что
 * сигналы из групп. Итог прохода — `stats_snapshots` «tender-scan»: его
 * показывает раздел «Тендеры».
 *
 * С 10.11.2026 новый лот ещё и лид менеджеру (lib/scout/tender-lead.ts): у
 * новых лотов etender контакт дочитывается из карточки, потом `promoteTenders`.
 */

export const SCAN_KEY = "tender-scan";
export const SCAN_EVERY_MS = 30 * 60_000;
/** Одним проходом в канал — не больше; остальное видно в разделе. */
const NOTIFY_CAP = 8;

export const TENDER_STATUSES = ["new", "taken", "applied", "skipped"] as const;
export type TenderStatus = (typeof TENDER_STATUSES)[number];

export type TenderRow = {
  id: string;
  created_at: string;
  source: TenderSource;
  external_id: string;
  url: string;
  title: string;
  customer: string | null;
  region: string | null;
  kind: string | null;
  price: number | null;
  currency: string | null;
  published_at: string | null;
  deadline: string | null;
  topics: string[];
  status: TenderStatus;
  taken_by: string | null;
  taken_at: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  customer_inn?: string | null;
  lead_id?: string | null;
};

export type ScanState = {
  at: string;
  sources: { source: TenderSource; seen: number; ours: number; error: string | null }[];
  added: number;
};

export function isTenderStatus(value: string): value is TenderStatus {
  return (TENDER_STATUSES as readonly string[]).includes(value);
}

/** Пора ли проходу: прошлый был раньше чем полчаса назад (или его не было). */
export function scanDue(last: ScanState | null, now: Date): boolean {
  if (!last) return true;
  const at = new Date(last.at).getTime();
  return !Number.isFinite(at) || now.getTime() - at >= SCAN_EVERY_MS;
}

/** Цена словами для строки: «1 700 000 000 UZS». */
export function priceText(price: number | null, currency: string | null): string {
  if (!price) return "";
  return `${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency ?? ""}`.trim();
}

/** Дата в Ташкенте: «17.11, 16:13». */
export function tashkentShort(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(new Date(iso).getTime() + 5 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Строка в канал скаута. */
export function tenderNotice(lot: TenderLot): string {
  return [
    `🏛 <b>Тендер</b> · ${esc(SOURCE_LABEL[lot.source])}${lot.kind ? ` · ${esc(lot.kind)}` : ""}`,
    "",
    `<b>${esc(lot.title.slice(0, 300))}</b>`,
    lot.customer ? `Заказчик: ${esc(lot.customer)}` : "",
    lot.region ? `Регион: ${esc(lot.region)}` : "",
    lot.price ? `Стартовая цена: ${esc(priceText(lot.price, lot.currency))}` : "",
    lot.deadline ? `Приём заявок до: ${esc(tashkentShort(lot.deadline))} (Ташкент)` : "",
    lot.contact?.phone ? `Телефон заказчика: ${esc(lot.contact.phone)}` : "",
    "",
    `⚠️ ${esc(PRICE_RULE)}`,
    `Лот: ${lot.url}`,
    `В панели: ${siteUrl}/admin/tenders`,
  ]
    .filter((line, index, all) => line !== "" || (index > 0 && all[index - 1] !== ""))
    .join("\n");
}

async function readScan(): Promise<ScanState | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", SCAN_KEY).maybeSingle();
  const payload = (data?.payload ?? null) as ScanState | null;
  return payload && typeof payload.at === "string" ? payload : null;
}

async function writeScan(state: ScanState): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert({ key: SCAN_KEY, payload: state, computed_at: state.at }, { onConflict: "key" });
}

export async function loadScan(): Promise<ScanState | null> {
  return readScan().catch(() => null);
}

/** Сохранить лоты; вернуть те, которых в базе ещё не было. */
async function saveLots(lots: TenderLot[]): Promise<TenderLot[] | null> {
  const db = serviceClient();
  if (!db || !lots.length) return db ? [] : null;
  const fresh: TenderLot[] = [];
  for (let i = 0; i < lots.length; i += 100) {
    const chunk = lots.slice(i, i + 100);
    const { data, error } = await db
      .from("scout_tenders")
      .upsert(
        chunk.map((lot) => ({
          source: lot.source,
          external_id: lot.externalId,
          url: lot.url,
          title: lot.title,
          customer: lot.customer,
          region: lot.region,
          kind: lot.kind,
          price: lot.price,
          currency: lot.currency,
          published_at: lot.publishedAt,
          deadline: lot.deadline,
          topics: lot.topics,
          phone: lot.contact?.phone ?? null,
          email: lot.contact?.email ?? null,
          contact_person: lot.contact?.person ?? null,
          customer_inn: lot.contact?.inn ?? null,
        })),
        { onConflict: "source,external_id", ignoreDuplicates: true },
      )
      .select("source, external_id");
    if (error) return null;
    const added = new Set((data ?? []).map((row) => `${row.source}:${row.external_id}`));
    fresh.push(...chunk.filter((lot) => added.has(`${lot.source}:${lot.externalId}`)));
  }
  return fresh;
}

/** Контакт, дочитанный после записи, — в строку лота. */
async function saveContacts(lots: TenderLot[]): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  for (const lot of lots) {
    if (!lot.contact) continue;
    await db
      .from("scout_tenders")
      .update({ phone: lot.contact.phone, email: lot.contact.email, contact_person: lot.contact.person, customer_inn: lot.contact.inn })
      .eq("source", lot.source)
      .eq("external_id", lot.externalId);
  }
}

async function markNotified(lots: TenderLot[]): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  for (const lot of lots) {
    await db.from("scout_tenders").update({ notified_at: new Date().toISOString() }).eq("source", lot.source).eq("external_id", lot.externalId);
  }
}

/**
 * Проход свипа. Сам решает, пора ли; отметку времени пишет до чтения
 * площадок — два прохода подряд не читают их дважды.
 */
export async function runTenderScan(
  now: Date,
  read: () => Promise<SourceResult[]>,
  notify: (text: string) => Promise<boolean> = async (text) => {
    const channel = process.env.TELEGRAM_SCOUT_CHANNEL_ID;
    return channel ? Boolean(await sendMessage(channel, text)) : false;
  },
  toLeads: (now: Date) => Promise<{ errors: string[] }> = promoteTenders,
  enrich: (lot: TenderLot) => Promise<TenderLot> = withContact,
): Promise<{ ran: boolean; added: number; errors: string[] }> {
  const db = serviceClient();
  if (!db) return { ran: false, added: 0, errors: [] };
  if (!scanDue(await readScan(), now)) return { ran: false, added: 0, errors: [] };
  await writeScan({ at: now.toISOString(), sources: [], added: 0 });

  const results = await read();
  const lots = mergeLots(results.flatMap((result) => result.lots));
  const saved = await saveLots(lots);
  // Контакт новых лотов, которого не было в списке площадки (etender — по вызову на лот).
  let fresh: TenderLot[] | null = saved;
  if (saved?.length) {
    fresh = [];
    for (const lot of saved) fresh.push(await enrich(lot));
    await saveContacts(fresh.filter((lot, index) => lot.contact !== saved[index].contact));
  }
  const errors = results.map((result) => result.error).filter((error): error is string => Boolean(error));
  if (fresh === null) errors.push("scout_tenders: таблица не ответила (миграция 0184 применена?)");

  const toSend = (fresh ?? [])
    .slice()
    .sort((a, b) => (a.deadline ?? "9").localeCompare(b.deadline ?? "9"))
    .slice(0, NOTIFY_CAP);
  const sent: TenderLot[] = [];
  for (const lot of toSend) if (await notify(tenderNotice(lot))) sent.push(lot);
  await markNotified(sent);
  if ((fresh?.length ?? 0) > toSend.length) {
    await notify(`🏛 Ещё ${(fresh?.length ?? 0) - toSend.length} новых тендеров — в разделе: ${siteUrl}/admin/tenders`);
  }

  // Новые наши лоты — лидами в очередь менеджеров.
  errors.push(...(await toLeads(now).catch((error) => ({ errors: [String(error)] }))).errors);

  await writeScan({
    at: now.toISOString(),
    added: fresh?.length ?? 0,
    sources: results.map((result) => ({ source: result.source, seen: result.seen, ours: result.lots.length, error: result.error })),
  });
  return { ran: true, added: fresh?.length ?? 0, errors };
}

/** Лента раздела: по статусу, сначала те, у кого срок ближе. Просроченные новые — в конце. */
export async function listTenders(status: TenderStatus | "all", now = new Date()): Promise<TenderRow[] | null> {
  const db = serviceClient();
  if (!db) return null;
  let query = db.from("scout_tenders").select("*").order("deadline", { ascending: true, nullsFirst: false }).limit(300);
  if (status !== "all") query = query.eq("status", status);
  if (status === "new") query = query.or(`deadline.is.null,deadline.gte.${new Date(now.getTime() - 86_400_000).toISOString()}`);
  const { data, error } = await query;
  if (error) return null;
  return (data ?? []) as TenderRow[];
}

export async function tenderCounts(): Promise<Record<TenderStatus, number> | null> {
  const db = serviceClient();
  if (!db) return null;
  const out = {} as Record<TenderStatus, number>;
  for (const status of TENDER_STATUSES) {
    const { count, error } = await db.from("scout_tenders").select("id", { count: "exact", head: true }).eq("status", status);
    if (error) return null;
    out[status] = count ?? 0;
  }
  return out;
}

/** «Беру», «Подали», «Не наше», «Вернуть» — любой, кому открыт раздел. */
export async function setTenderStatus(staff: Staff, id: string, status: string, ip: string): Promise<boolean> {
  const db = serviceClient();
  if (!db || !isTenderStatus(status) || !/^[0-9a-f-]{36}$/.test(id)) return false;
  const patch: Record<string, unknown> = { status };
  if (status === "taken") Object.assign(patch, { taken_by: staff.id, taken_at: new Date().toISOString() });
  if (status === "new") Object.assign(patch, { taken_by: null, taken_at: null });
  const { data, error } = await db.from("scout_tenders").update(patch).eq("id", id).select("id, title").maybeSingle();
  if (error || !data) return false;
  await record("scout.tender_status", { actorStaffId: staff.id, targetType: "tender", targetId: id, meta: { status }, ip });
  return true;
}
