import { record } from "@/lib/admin/audit";
import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { wants } from "@/lib/admin/notify-prefs";
import {
  STAGES_DAYS,
  canMark,
  dealsOf,
  noShowDue,
  noShowKey,
  noShowRows,
  noShowText,
  type Deal,
  type MarkKind,
  type ShownVia,
  type StageInput,
  type StageLead,
  type StageMark,
  type StageProspect,
} from "@/lib/admin/sales-stages";
import type { Staff } from "@/lib/admin/session";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { forget, memo } from "@/lib/memo";
import { serviceClient } from "@/lib/supabase";

/**
 * Ступени продажи (lib/admin/sales-stages.ts) — строки из базы одним
 * заходом и с лимитами, как loadHq: «Главная» не должна стать медленнее.
 * Окно — STAGES_DAYS дней: «за 30 дней» и «7 против 7 до них» помещаются.
 * Второй заход — только подписи и хозяева тех, кто попал в окно поздней
 * ступенью (макет ушёл сегодня, а касание было месяц назад).
 *
 * Модели здесь нет.
 */

const LIMIT = 5000;
const SECOND = 500;

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const rows = (res: { data: unknown }) => (res.data ?? []) as Record<string, unknown>[];

function leadLabel(r: Record<string, unknown>): string {
  return String(r.company || r.contact_name || (r.request_no ? `№${r.request_no}` : "") || String(r.id).slice(0, 8));
}

const PROSPECT_FIELDS =
  "id, host, label, status, touched_by, touched_at, handled_by, claimed_by, sent_at, hello_at, replied_at, proto_requested_at, autopilot_replied_at, lead_id";
const LEAD_FIELDS = "id, created_at, source, status, assigned_staff_id, company, contact_name, request_no";

function toProspect(r: Record<string, unknown>): StageProspect {
  return {
    id: String(r.id),
    label: String(r.label || r.host || String(r.id).slice(0, 8)),
    status: String(r.status ?? ""),
    touched_by: str(r.touched_by),
    touched_at: str(r.touched_at),
    handled_by: str(r.handled_by),
    claimed_by: str(r.claimed_by),
    sent_at: str(r.sent_at),
    hello_at: str(r.hello_at),
    replied_at: str(r.replied_at),
    proto_requested_at: str(r.proto_requested_at),
    autopilot_replied_at: str(r.autopilot_replied_at),
    lead_id: str(r.lead_id),
  };
}

function toLead(r: Record<string, unknown>): StageLead {
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    source: str(r.source),
    status: String(r.status ?? ""),
    assigned_staff_id: str(r.assigned_staff_id),
    label: leadLabel(r),
  };
}

/**
 * Сколько держать сделки в памяти сайта.
 *
 * Трафик базы, 23.10.2026: сделки читали «Главная» владельца и менеджеров,
 * «Ступени», недельные карточки людей и уровни — 274 раза за день, ~70 МБ
 * (касания, лиды, журнал). Теперь одно чтение на 10 минут для всех, кто
 * спрашивает «на сейчас»; отметка ступени снимает его сразу (markStage).
 * Отчёт за прошлый день (`now` в прошлом) читается как раньше.
 */
export const DEALS_MS = 10 * 60_000;

/** Все сделки, у которых за STAGES_DAYS дней была хоть одна ступень. */
export async function loadDeals(now: Date = new Date(), days = STAGES_DAYS, limit = LIMIT): Promise<Deal[]> {
  if (Math.abs(Date.now() - now.getTime()) < 60_000) {
    return memo(`deals:${days}:${limit}`, DEALS_MS, () => readDeals(now, days, limit));
  }
  return readDeals(now, days, limit);
}

async function readDeals(now: Date, days: number, limit: number): Promise<Deal[]> {
  const db = serviceClient();
  if (!db) return [];
  const from = new Date(now.getTime() - days * 24 * 3600_000).toISOString();
  const fromDay = from.slice(0, 10);

  const [prospectsRes, leadsRes, mockupsRes, marksRes, pricesRes, paymentsRes, winsRes] = await Promise.all([
    db
      .from("prospects")
      .select(PROSPECT_FIELDS)
      .or(
        [`hello_at.gte."${from}"`, `sent_at.gte."${from}"`, `touched_at.gte."${from}"`, `replied_at.gte."${from}"`, `proto_requested_at.gte."${from}"`].join(","),
      )
      .limit(limit),
    db.from("leads").select(LEAD_FIELDS).gte("created_at", from).limit(limit),
    db.from("mockup_offers").select("lead_id, prospect_id, sent_at, client, mockup_ref").gte("sent_at", from).limit(limit),
    db.from("sales_marks").select("kind, lead_id, prospect_id, staff_id, created_at, via, amount_usd").gte("created_at", from).limit(limit),
    db
      .from("outreach_messages")
      .select("lead_id, prospect_id, created_at, sent_at")
      .eq("kind", "price")
      .eq("direction", "out")
      .in("status", ["sent", "done"])
      .gte("created_at", from)
      .limit(limit),
    db.from("project_payments").select("project_id, paid_on, amount_usd").gte("paid_on", fromDay).limit(limit),
    db
      .from("audit_events")
      .select("target_id, created_at, actor_staff_id, meta")
      .eq("action", "lead.status_changed")
      .gte("created_at", from)
      .limit(limit),
  ]);

  const prospects = rows(prospectsRes).map(toProspect);
  const leads = rows(leadsRes).map(toLead);
  const mockups = rows(mockupsRes).map((r) => ({
    lead_id: str(r.lead_id),
    prospect_id: str(r.prospect_id),
    sent_at: String(r.sent_at),
    client: str(r.client),
    ref: str(r.mockup_ref),
  }));
  const marks = rows(marksRes).map((r) => ({
    kind: String(r.kind) as MarkKind,
    lead_id: str(r.lead_id),
    prospect_id: str(r.prospect_id),
    staff_id: str(r.staff_id),
    created_at: String(r.created_at),
    via: str(r.via),
    amount_usd: r.amount_usd == null ? null : Number(r.amount_usd),
  })) as StageMark[];
  const prices = rows(pricesRes).map((r) => ({ lead_id: str(r.lead_id), prospect_id: str(r.prospect_id), at: String(r.sent_at ?? r.created_at) }));
  const wins = rows(winsRes)
    .filter((e) => (e.meta as { to?: unknown } | null)?.to === "won" && str(e.target_id))
    .map((e) => ({ lead_id: String(e.target_id), at: String(e.created_at), by: str(e.actor_staff_id) }));

  // Второй заход: проекты платежей, лиды и касания, которых нет в окне.
  const projectIds = [...new Set(rows(paymentsRes).map((r) => String(r.project_id)))];
  const haveP = new Set(prospects.map((p) => p.id));
  const haveL = new Set(leads.map((l) => l.id));
  const needP = new Set<string>();
  const needL = new Set<string>();
  for (const x of [...mockups, ...marks, ...prices]) {
    if (x.prospect_id && !haveP.has(x.prospect_id)) needP.add(x.prospect_id);
    if (x.lead_id && !haveL.has(x.lead_id)) needL.add(x.lead_id);
  }
  for (const p of prospects) if (p.lead_id && !haveL.has(p.lead_id)) needL.add(p.lead_id);
  for (const w of wins) if (!haveL.has(w.lead_id)) needL.add(w.lead_id);
  const none = Promise.resolve({ data: [] as Record<string, unknown>[] });
  const [projectsRes, moreP, moreL, byLeadP] = await Promise.all([
    projectIds.length ? db.from("projects").select("id, lead_id").in("id", projectIds.slice(0, SECOND)) : none,
    needP.size ? db.from("prospects").select(PROSPECT_FIELDS).in("id", [...needP].slice(0, SECOND)) : none,
    needL.size ? db.from("leads").select(LEAD_FIELDS).in("id", [...needL].slice(0, SECOND)) : none,
    // Касание лида, попавшего в окно без своего касания: одна компания — одна строка.
    needL.size ? db.from("prospects").select(PROSPECT_FIELDS).in("lead_id", [...needL].slice(0, SECOND)) : none,
  ]);
  const leadOfProject = new Map(rows(projectsRes).map((r) => [String(r.id), str(r.lead_id)]));
  const payments = rows(paymentsRes).flatMap((r) => {
    const lead = leadOfProject.get(String(r.project_id));
    return lead ? [{ lead_id: lead, paid_on: String(r.paid_on), amount_usd: Number(r.amount_usd ?? 0) }] : [];
  });
  // Лид без касания и не в окне: оплата или «выиграли» по нему.
  const missing = payments.map((p) => p.lead_id).filter((id) => !haveL.has(id) && !needL.has(id));
  const lateLeads = missing.length ? rows(await db.from("leads").select(LEAD_FIELDS).in("id", missing.slice(0, SECOND))).map(toLead) : [];

  const allProspects = new Map<string, StageProspect>();
  for (const p of [...prospects, ...rows(moreP).map(toProspect), ...rows(byLeadP).map(toProspect)]) allProspects.set(p.id, p);
  const allLeads = new Map<string, StageLead>();
  for (const l of [...leads, ...rows(moreL).map(toLead), ...lateLeads]) allLeads.set(l.id, l);

  const input: StageInput = {
    prospects: [...allProspects.values()],
    leads: [...allLeads.values()],
    mockups,
    marks,
    prices,
    payments,
    wins,
  };
  return dealsOf(input);
}

/* ── Отметки «Есть интерес», «Показал макет», «Назвал цену» ──────────── */

export type MarkResult = "ok" | "forbidden" | "gone" | "bad" | "failed";

/**
 * Отметить ступень по лиду или касанию. Менеджер — только по своему
 * (canMark), руководитель и владелец — по любому. Пишется строка в
 * sales_marks и шаг в журнал (lead.sales_marked): отметка — движение по
 * лиду, бот «Порядка в лидах» о нём не спросит.
 */
export async function markStage(
  input: { kind: MarkKind; leadId?: string | null; prospectId?: string | null; via?: ShownVia | null; amountUsd?: number | null },
  staff: Pick<Staff, "id" | "role">,
  ip: string | null,
): Promise<MarkResult> {
  const db = serviceClient();
  if (!db) return "failed";
  const leadId = input.leadId ?? null;
  const prospectId = input.prospectId ?? null;
  if (!leadId && !prospectId) return "bad";
  if (input.kind === "shown" && !input.via) return "bad";
  if (input.kind === "priced" && !input.amountUsd) return "bad";

  const [{ data: lead }, { data: prospect }] = await Promise.all([
    leadId ? db.from("leads").select("id, assigned_staff_id").eq("id", leadId).maybeSingle() : Promise.resolve({ data: null }),
    prospectId
      ? db.from("prospects").select("id, lead_id, handled_by, claimed_by, touched_by").eq("id", prospectId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if ((leadId && !lead) || (prospectId && !prospect)) return "gone";
  // Касание с лидом — отметка идёт за лидом: разговор там.
  const ownLeadId = leadId ?? str(prospect?.lead_id);
  let leadOwner: string | null = lead ? str(lead.assigned_staff_id) : null;
  if (!lead && ownLeadId) {
    const { data } = await db.from("leads").select("assigned_staff_id").eq("id", ownLeadId).maybeSingle();
    leadOwner = data ? str(data.assigned_staff_id) : null;
  }
  const ok = canMark(staff, {
    hasLead: Boolean(ownLeadId),
    leadOwner,
    handled_by: str(prospect?.handled_by),
    claimed_by: str(prospect?.claimed_by),
    touched_by: str(prospect?.touched_by),
  });
  if (!ok) return "forbidden";

  const { error } = await db.from("sales_marks").insert({
    kind: input.kind,
    lead_id: ownLeadId,
    prospect_id: prospectId,
    staff_id: staff.id,
    via: input.kind === "shown" ? input.via : null,
    amount_usd: input.kind === "priced" ? input.amountUsd : null,
  });
  if (error) return "failed";
  await record("lead.sales_marked", {
    actorStaffId: staff.id,
    targetType: ownLeadId ? "lead" : "prospect",
    targetId: ownLeadId ?? prospectId,
    meta: { kind: input.kind, via: input.via ?? null, amount_usd: input.amountUsd ?? null },
    ip,
  });
  // Ступени на «Главной» живут в памяти несколько минут (lib/memo.ts): своя
  // отметка должна быть видна сразу.
  forget("hq:deals:");
  forget("deals:");
  return "ok";
}

/** Последние отметки по лиду или касанию — для карточки: что уже отмечено и кем. */
export async function marksFor(ids: { leadId?: string | null; prospectId?: string | null }): Promise<StageMark[]> {
  const db = serviceClient();
  if (!db || (!ids.leadId && !ids.prospectId)) return [];
  const or = [ids.leadId ? `lead_id.eq.${ids.leadId}` : "", ids.prospectId ? `prospect_id.eq.${ids.prospectId}` : ""].filter(Boolean).join(",");
  const { data } = await db
    .from("sales_marks")
    .select("kind, lead_id, prospect_id, staff_id, created_at, via, amount_usd")
    .or(or)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as StageMark[];
}

/* ── Понедельник 10:00 — кто не показал ни одного макета ─────────────── */

/**
 * Строка руководителям и владельцу под галочкой «Отчёты»: кто за прошлую
 * неделю не сделал ни одного показа при хотя бы одном макете. Раз в
 * неделю — отметка в team_news_sent до сообщения (как у «Молчания»):
 * два прохода свипа не напишут дважды.
 */
export async function runNoShowWeek(now: Date = new Date()): Promise<number> {
  if (!noShowDue(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const key = noShowKey(now);
  const [{ data: staff }, { data: done }] = await Promise.all([
    db.from("staff").select("id, role, display_name, telegram_user_id, notify_off").eq("is_active", true),
    db.from("team_news_sent").select("staff_id").eq("news_id", key),
  ]);
  const already = new Set((done ?? []).map((r) => String(r.staff_id)));
  const readers = (staff ?? []).filter(
    (s) =>
      ["admin", "head"].includes(String(s.role)) &&
      Number(s.telegram_user_id) &&
      !already.has(String(s.id)) &&
      wants((s.notify_off as string[] | null) ?? [], "reports"),
  );
  if (!readers.length) return 0;
  const team = (staff ?? [])
    .filter((s) => (QUEUE_ROLES as readonly string[]).includes(String(s.role)))
    .map((s) => ({ id: String(s.id), name: esc(String(s.display_name ?? "без имени")) }));
  const deals = await loadDeals(now, 21);
  const rowsAll = noShowRows(deals, team, now);

  let sent = 0;
  for (const reader of readers) {
    const text = noShowText(rowsAll.filter((r) => r.id !== reader.id));
    if (!text) continue;
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", reader.id);
  }
  return sent;
}

/**
 * Ступени одного лида — для его карточки: те же правила, что на «Главной»,
 * но по строкам только этого лида и его касания. Без окна по времени.
 */
export async function dealForLead(leadId: string): Promise<Deal | null> {
  const db = serviceClient();
  if (!db) return null;
  const [leadRes, prospectsRes, projectsRes, winsRes] = await Promise.all([
    db.from("leads").select(LEAD_FIELDS).eq("id", leadId).maybeSingle(),
    db.from("prospects").select(PROSPECT_FIELDS).eq("lead_id", leadId).limit(5),
    db.from("projects").select("id").eq("lead_id", leadId).limit(20),
    db
      .from("audit_events")
      .select("target_id, created_at, actor_staff_id, meta")
      .eq("action", "lead.status_changed")
      .eq("target_id", leadId)
      .limit(50),
  ]);
  if (!leadRes.data) return null;
  const prospects = rows(prospectsRes).map(toProspect);
  const pids = prospects.map((p) => p.id);
  const or = (col: string) => [`lead_id.eq.${leadId}`, ...pids.map((id) => `${col}.eq.${id}`)].join(",");
  const projectIds = rows(projectsRes).map((r) => String(r.id));
  const [mockupsRes, marksRes, pricesRes, paymentsRes] = await Promise.all([
    db.from("mockup_offers").select("lead_id, prospect_id, sent_at").or(or("prospect_id")).limit(50),
    db.from("sales_marks").select("kind, lead_id, prospect_id, staff_id, created_at, via, amount_usd").or(or("prospect_id")).limit(50),
    db
      .from("outreach_messages")
      .select("lead_id, prospect_id, created_at, sent_at")
      .eq("kind", "price")
      .eq("direction", "out")
      .in("status", ["sent", "done"])
      .or(or("prospect_id"))
      .limit(50),
    projectIds.length
      ? db.from("project_payments").select("paid_on, amount_usd").in("project_id", projectIds).limit(200)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const deals = dealsOf({
    prospects,
    leads: [toLead(leadRes.data as Record<string, unknown>)],
    mockups: rows(mockupsRes).map((r) => ({ lead_id: str(r.lead_id), prospect_id: str(r.prospect_id), sent_at: String(r.sent_at) })),
    marks: rows(marksRes) as unknown as StageMark[],
    prices: rows(pricesRes).map((r) => ({ lead_id: str(r.lead_id), prospect_id: str(r.prospect_id), at: String(r.sent_at ?? r.created_at) })),
    payments: rows(paymentsRes).map((r) => ({ lead_id: leadId, paid_on: String(r.paid_on), amount_usd: Number(r.amount_usd ?? 0) })),
    wins: rows(winsRes)
      .filter((e) => (e.meta as { to?: unknown } | null)?.to === "won")
      .map((e) => ({ lead_id: leadId, at: String(e.created_at), by: str(e.actor_staff_id) })),
  });
  return deals.find((d) => d.leadId === leadId) ?? null;
}
