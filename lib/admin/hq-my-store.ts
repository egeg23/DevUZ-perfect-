import { OPEN_TASK, type HqProspect } from "@/lib/admin/hq";
import {
  contactsOf,
  hotOf,
  mineReply,
  mockupLines,
  mockupOwnerId,
  overdueOf,
  workOf,
  type ContactRow,
  type Hot,
  type MockupLine,
  type MyLead,
  type MyMockup,
  type MyOffer,
  type MyProspect,
  type MyReply,
  type MyTask,
  type MyWork,
  type Overdue,
} from "@/lib/admin/hq-my";
import { loadIdle } from "@/lib/admin/lead-tidy-store";
import { parseMockupRef } from "@/lib/admin/mockups";
import { openState } from "@/lib/admin/mockups-store";
import { todayInTashkent } from "@/lib/admin/pulse";
import { myStagesOf, shownAtOf, type Deal, type MyStages } from "@/lib/admin/sales-stages";
import { loadDeals } from "@/lib/admin/sales-stages-store";
import type { Grade } from "@/lib/admin/finance";
import { gradeStatus } from "@/lib/admin/grade-month";
import { gradeBookFor } from "@/lib/admin/ledger";
import { growthOf, type Growth } from "@/lib/admin/levels";
import { readXp } from "@/lib/admin/levels-store";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * «Главная» менеджера — всё одним заходом и с лимитами, как loadHq
 * (lib/admin/hq-store.ts). Каждый запрос уже отобран по этому человеку:
 * его лиды, его задачи, его касания, его предложения. Переписку и макеты
 * отобрать запросом нельзя — «чьё» там решается по лиду и касанию, — их
 * отбирают правила mineReply и mockupOwnerId (lib/admin/hq-my.ts).
 * Считает — lib/admin/hq-my.ts.
 */

const LOOKBACK_MS = 14 * 24 * 3600_000;
const LIMIT = 2000;

export type MyHq = {
  offline: boolean;
  hot: Hot[];
  overdue: Overdue[];
  contacts: ContactRow[];
  mockups: MockupLine[];
  work: MyWork;
  /** Мои ступени продажи с понедельника и норма «2 показа в неделю». */
  stages?: MyStages;
  /** Мой уровень и грейд по сделкам месяца. */
  growth?: Growth;
};

const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const rows = (res: { data: unknown }) => (res.data ?? []) as Record<string, unknown>[];

function labelOf(r: Record<string, unknown>): string {
  return String(r.company || r.contact_name || (r.request_no ? `№${r.request_no}` : "") || String(r.id).slice(0, 8));
}

export function emptyMyHq(now: Date): MyHq {
  return {
    offline: true,
    hot: [],
    overdue: [],
    contacts: [],
    mockups: [],
    work: workOf({ me: "", now, portion: [], prospects: [], offersClosed: [], mockups: [], wins: [], inWork: 0 }),
    stages: myStagesOf([], "", now),
  };
}

export async function loadMyHq(viewer: Pick<Staff, "id">, now: Date = new Date()): Promise<MyHq> {
  const db = serviceClient();
  if (!db) return emptyMyHq(now);
  const me = viewer.id;
  const from = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const day = todayInTashkent(now);
  const nowIso = now.toISOString();

  const [leadsRes, idle, offersRes, closedOffersRes, tasksRes, prospectsRes, inboxRes, mockupsRes, portionRes, winsRes, staffRes, deals, xp, book, meRes] =
    await Promise.all([
      db
        .from("leads")
        .select("id, status, contact_kind")
        .eq("assigned_staff_id", me)
        .eq("status", "taken")
        .limit(LIMIT),
      loadIdle([me]).catch(() => []),
      db.from("lead_offers").select("lead_id, expires_at").eq("staff_id", me).is("outcome", null).gt("expires_at", nowIso).limit(50),
      db.from("lead_offers").select("outcome, closed_at").eq("staff_id", me).not("outcome", "is", null).gte("closed_at", from).limit(LIMIT),
      db.from("staff_tasks").select("id, title, body, status, due_at").eq("assignee_id", me).in("status", [...OPEN_TASK]).limit(500),
      db
        .from("prospects")
        .select("id, status, touched_by, touched_at, sent_at, autopilot_at, replied_at, host, label, target, lead_id")
        .eq("touched_by", me)
        .or(`touched_at.gte."${from}",replied_at.gte."${from}"`)
        .limit(LIMIT),
      // Неотвеченные входящие за две недели: чьи они — решает mineReply ниже.
      db
        .from("outreach_messages")
        .select("prospect_id, lead_id, created_at")
        .eq("direction", "in")
        .is("answered_at", null)
        .gte("created_at", from)
        .order("created_at", { ascending: true })
        .limit(1000),
      db
        .from("mockup_offers")
        .select("id, mockup_ref, client, mockup_name, status, sent_at, expires_at, lead_id, prospect_id")
        .or(`sent_at.gte."${from}",status.eq.active`)
        .order("sent_at", { ascending: false })
        .limit(LIMIT),
      db.from("touch_portions").select("replaces, outcome, source").eq("staff_id", me).eq("day", day).limit(200),
      db
        .from("audit_events")
        .select("created_at, meta")
        .eq("action", "lead.status_changed")
        .eq("actor_staff_id", me)
        .gte("created_at", from)
        .limit(LIMIT),
      db.from("staff").select("id").eq("is_active", true).limit(500),
      loadDeals(now, 21).catch(() => [] as Deal[]),
      readXp().catch(() => null),
      gradeBookFor(me, now).catch(() => null),
      db.from("staff").select("grade, rate_percent").eq("id", me).maybeSingle(),
    ]);

  if (leadsRes.error && tasksRes.error) return emptyMyHq(now);

  const kindOf = new Map(rows(leadsRes).map((r) => [String(r.id), str(r.contact_kind)]));
  const leads: MyLead[] = idle.filter((l) => kindOf.has(l.id)).map((l) => ({ ...l, contactKind: kindOf.get(l.id) ?? null }));
  const mine = new Set(leads.map((l) => l.id));
  const active = new Set(rows(staffRes).map((r) => String(r.id)));

  // Второй заход — по найденному: подписи предложенных лидов, касания
  // неотвеченных, прототипы, лиды и касания макетов, открытия.
  const offerIds = rows(offersRes).map((r) => String(r.lead_id));
  const inbox = rows(inboxRes);
  const inboxProspects = [...new Set(inbox.map((r) => String(r.prospect_id)))];
  const offerRows = rows(mockupsRes).filter((r) => parseMockupRef(String(r.mockup_ref ?? "")));
  const protoIds = [...new Set(offerRows.map((r) => parseMockupRef(String(r.mockup_ref)))
    .flatMap((t) => (t?.kind === "proto" ? [t.id] : [])))];
  const offerLeadIds = [...new Set(offerRows.map((r) => str(r.lead_id)).filter((x): x is string => Boolean(x)))];
  const offerProspectIds = [...new Set(offerRows.map((r) => str(r.prospect_id)).filter((x): x is string => Boolean(x)))];
  const none = Promise.resolve({ data: [] as Record<string, unknown>[] });
  const chunk = <T>(ids: readonly T[]) => ids.slice(0, 300);

  const [offerLeadsRes, talkRes, protosRes, mockLeadsRes, mockProspectsRes] = await Promise.all([
    offerIds.length ? db.from("leads").select("id, company, contact_name, request_no").in("id", offerIds) : none,
    inboxProspects.length
      ? db
          .from("prospects")
          .select("id, host, label, target, lead_id, ai_handling, handled_by, claimed_by, touched_by")
          .in("id", chunk(inboxProspects))
      : none,
    protoIds.length
      ? db
          .from("protos")
          .select("id, name, prospect_id, auto, closed_at, auto_closed_at, opened_at, opens, created_at, owner_staff_id, created_by, lock:facts->>lock, lockAt:facts->>lockAt, open:facts->>open")
          .in("id", chunk(protoIds))
      : none,
    offerLeadIds.length ? db.from("leads").select("id, assigned_staff_id").in("id", chunk(offerLeadIds)) : none,
    offerProspectIds.length ? db.from("prospects").select("id, touched_by").in("id", chunk(offerProspectIds)) : none,
  ]);

  // Тёплые, предложенные ему.
  const offerLabel = new Map(rows(offerLeadsRes).map((r) => [String(r.id), labelOf(r)]));
  const offers: MyOffer[] = rows(offersRes).map((r) => ({
    leadId: String(r.lead_id),
    label: offerLabel.get(String(r.lead_id)) ?? "—",
    expiresAt: String(r.expires_at),
  }));

  // Клиент ждёт ответа: модель отпустила разговор, а входящее не отвечено.
  const leadOwner = new Map<string, string | null>([...mine].map((id) => [id, me]));
  const talks = new Map(rows(talkRes).map((r) => [String(r.id), r]));
  const replies: MyReply[] = [];
  const replied = new Set<string>();
  for (const msg of inbox) {
    const p = talks.get(String(msg.prospect_id));
    if (!p || p.ai_handling !== false || replied.has(String(p.id))) continue;
    const leadId = str(msg.lead_id) ?? str(p.lead_id);
    const ok = mineReply(
      { hasLead: Boolean(leadId), leadOwner: leadId ? (leadOwner.get(leadId) ?? null) : null, handled_by: str(p.handled_by), claimed_by: str(p.claimed_by), touched_by: str(p.touched_by) },
      me,
    );
    if (!ok) continue;
    replied.add(String(p.id));
    replies.push({ prospectId: String(p.id), leadId, label: String(p.label || p.host || "—"), since: String(msg.created_at), target: str(p.target) });
  }

  // Макеты: ответственный тем же порядком, что в «Макетах».
  const protos = new Map(rows(protosRes).map((r) => [String(r.id), r]));
  const mockLeadOwner = new Map(rows(mockLeadsRes).map((r) => [String(r.id), str(r.assigned_staff_id)]));
  const toucher = new Map(rows(mockProspectsRes).map((r) => [String(r.id), str(r.touched_by)]));
  const myOffers: { row: Record<string, unknown>; proto: Record<string, unknown> | null }[] = [];
  const seenRef = new Set<string>();
  for (const r of offerRows) {
    const target = parseMockupRef(String(r.mockup_ref));
    const proto = target?.kind === "proto" ? (protos.get(target.id) ?? null) : null;
    if (proto?.auto === true) continue;
    const leadId = str(r.lead_id);
    const prospectId = str(r.prospect_id) ?? (proto ? str(proto.prospect_id) : null);
    const owner = mockupOwnerId(
      {
        set: proto ? str(proto.owner_staff_id) : null,
        lead: leadId ? (mockLeadOwner.get(leadId) ?? null) : null,
        touch: prospectId ? (toucher.get(prospectId) ?? null) : null,
        made: proto ? str(proto.created_by) : null,
      },
      active,
    );
    if (owner !== me) continue;
    // Одному клиенту один макет — одна строка: свежая отправка (список уже по убыванию).
    const key = `${r.mockup_ref}|${leadId ?? prospectId ?? r.client}`;
    if (seenRef.has(key)) continue;
    seenRef.add(key);
    myOffers.push({ row: r, proto });
  }
  const myProtoIds = [...new Set(myOffers.flatMap((o) => (o.proto ? [String(o.proto.id)] : [])))];
  const { data: views } = myProtoIds.length
    ? await db.from("proto_views").select("proto_id, at").in("proto_id", myProtoIds).gte("at", from).order("at", { ascending: false }).limit(LIMIT)
    : { data: [] as Record<string, unknown>[] };
  const lastView = new Map<string, string>();
  for (const v of (views ?? []) as Record<string, unknown>[]) if (!lastView.has(String(v.proto_id))) lastView.set(String(v.proto_id), String(v.at));

  const mockups: MyMockup[] = myOffers.map(({ row, proto }) => {
    const sentAt = String(row.sent_at);
    const state = proto ? openState(proto, { sent_at: sentAt, lead_id: str(row.lead_id), prospect_id: str(row.prospect_id) }, now) : null;
    return {
      id: String(row.id),
      ref: String(row.mockup_ref),
      client: String(row.client ?? ""),
      name: String(row.mockup_name ?? ""),
      sentAt,
      expiresAt: String(row.expires_at),
      status: String(row.status),
      leadId: str(row.lead_id),
      prospectId: str(row.prospect_id),
      lastOpenedAt: proto ? (lastView.get(String(proto.id)) ?? null) : null,
      opens: proto ? Number(proto.opens ?? 0) : 0,
      openUntil: state?.openUntil ?? null,
      closedAt: state?.closedAt ?? null,
    };
  });

  const tasks = rows(tasksRes).map((r) => ({
    id: String(r.id),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    status: String(r.status),
    due_at: String(r.due_at),
  })) as MyTask[];
  const prospects: MyProspect[] = rows(prospectsRes).map((r) => ({
    ...(r as unknown as HqProspect),
    label: String(r.label || r.host || "—"),
    target: str(r.target),
    lead_id: str(r.lead_id),
  }));

  const input = { me, now, leads, offers, replies, tasks, mockups };
  const wins = rows(winsRes)
    .filter((e) => (e.meta as { to?: unknown } | null)?.to === "won")
    .map((e) => ({ created_at: String(e.created_at) }));

  return {
    offline: false,
    hot: hotOf(input),
    overdue: overdueOf(input),
    contacts: contactsOf({ ...input, prospects }),
    mockups: mockupLines(input).map((m) => ({ ...m, shownAt: shownAtOf(deals, { leadId: m.leadId, prospectId: m.prospectId }) })),
    work: workOf({
      me,
      now,
      portion: rows(portionRes) as { replaces: string | null; outcome: string | null; source: string | null }[],
      prospects,
      offersClosed: rows(closedOffersRes) as { outcome: string | null; closed_at: string | null }[],
      mockups,
      wins,
      inWork: leads.length,
    }),
    stages: myStagesOf(deals, me, now),
    growth: growthOf(
      me,
      xp,
      book
        ? gradeStatus(
            {
              id: me,
              grade: ((meRes.data?.grade as string | null) ?? "manager") as Grade,
              rate_percent: meRes.data?.rate_percent == null ? null : Number(meRes.data.rate_percent),
            },
            book,
          )
        : null,
    ),
  };
}
