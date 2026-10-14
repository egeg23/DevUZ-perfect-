import { mainLimitUntil, MAIN_LABEL } from "@/lib/admin/account-ban-store";
import { TROUBLE_KEY, autopilotSettings } from "@/lib/admin/autopilot-store";
import { circleStates } from "@/lib/admin/circle-store";
import {
  attentionOf,
  dailyCounts,
  dayStartOf,
  leadsPulse,
  mockupsPulse,
  moneyPulse,
  personOf,
  seesHqMoney,
  sortPeople,
  tasksPulse,
  touchesPulse,
  OPEN_TASK,
  feedOf,
  type Attention,
  type FeedItem,
  type HqEvent,
  type HqLead,
  type HqMockup,
  type HqPayment,
  type HqPerson,
  type HqPortionRow,
  type HqProspect,
  type HqTask,
  type LeadsPulse,
  type MockupsPulse,
  type MoneyPulse,
  type TasksPulse,
  type TouchesPulse,
} from "@/lib/admin/hq";
import { ACTIVE_MINUTES, QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { staleCounts } from "@/lib/admin/lead-tidy-store";
import { pendingContracts } from "@/lib/admin/pulse-store";
import { todayInTashkent } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { touchesOnDay } from "@/lib/admin/touch-store";
import { approves, pendingTransfers } from "@/lib/admin/transfers";
import { MAIN_ACCOUNT } from "@/lib/admin/work-accounts";
import { readHealth } from "@/lib/admin/sweep-health";
import { firecrawlBalance, firecrawlKey } from "@/lib/firecrawl";
import { serviceClient } from "@/lib/supabase";

/**
 * «Главная» — всё одним заходом (Promise.all), с лимитами, без вычислений:
 * считает lib/admin/hq.ts. Две недели истории — ровно на «7 дней против 7
 * дней до них»; дальше не нужно, а журнал и касания растут без предела.
 */

const LOOKBACK_MS = 14 * 24 * 3600_000;
const LIMIT = 5000;
/** Остаток Firecrawl ждём не дольше этого: страница не должна висеть на чужом сервисе. */
const FIRECRAWL_WAIT_MS = 1_200;

export type Hq = {
  offline: boolean;
  leads: LeadsPulse;
  touches: TouchesPulse;
  mockups: MockupsPulse;
  tasks: TasksPulse;
  money: MoneyPulse | null;
  attention: Attention[];
  people: HqPerson[];
  feed: FeedItem[];
};

const str = (v: unknown) => (typeof v === "string" ? v : null);

function leadLabel(row: Record<string, unknown>): string {
  return String(row.company || row.contact_name || (row.request_no ? `№${row.request_no}` : "") || String(row.id).slice(0, 8));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise.catch(() => fallback), late]);
  } finally {
    clearTimeout(timer);
  }
}

/** Остаток Firecrawl: ключа нет — null. Ответ помнится в lib/firecrawl.ts полчаса, запрос бесплатный. */
async function firecrawlRemaining(now: Date): Promise<number | null> {
  if (!(await firecrawlKey())) return null;
  const balance = await withTimeout(firecrawlBalance(now.getTime()), FIRECRAWL_WAIT_MS, null);
  return balance ? balance.remaining : null;
}

export async function loadHq(viewer: Pick<Staff, "role">, now: Date = new Date()): Promise<Hq> {
  const db = serviceClient();
  const role: Role = viewer.role;
  const empty: Hq = {
    offline: true,
    leads: leadsPulse([], [], [], now),
    touches: touchesPulse([], [], { enabled: false, target: 0 }, now),
    mockups: mockupsPulse([], now),
    tasks: tasksPulse([], now),
    money: null,
    attention: [],
    people: [],
    feed: [],
  };
  if (!db) return empty;

  const from = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const dayFrom = new Date(dayStartOf(now)).toISOString();
  const day = todayInTashkent(now);
  const activeFrom = new Date(now.getTime() - ACTIVE_MINUTES * 60_000).toISOString();
  const money = seesHqMoney(role);

  const [
    staffRes,
    leadsRes,
    offersRes,
    burnedRes,
    eventsRes,
    openTasksRes,
    closedTasksRes,
    mockupsRes,
    prospectsRes,
    portionsRes,
    presenceRes,
    viewsRes,
    actsRes,
    accountsRes,
    troubleRes,
    circleFallbackRes,
    autopilot,
    health,
    mainUntil,
    circles,
    transfers,
    contracts,
    paymentsRes,
    firecrawl,
  ] = await Promise.all([
    db.from("staff").select("id, display_name, role, bot_seen_at").eq("is_active", true).limit(200),
    db
      .from("leads")
      .select("id, created_at, status, priority, assigned_staff_id, company, contact_name, request_no")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    db.from("lead_offers").select("lead_id, staff_id, expires_at").is("outcome", null).limit(500),
    db
      .from("lead_offers")
      .select("staff_id")
      .eq("outcome", "expired")
      .gte("closed_at", dayFrom)
      .limit(1000),
    db
      .from("audit_events")
      .select("action, created_at, actor_staff_id, target_id, meta")
      .in("action", ["lead.status_changed", "lead.auto_lost"])
      .gte("created_at", from)
      .limit(LIMIT),
    db
      .from("staff_tasks")
      .select("id, title, assignee_id, creator_id, status, due_at, closed_at")
      .in("status", [...OPEN_TASK])
      .limit(2000),
    db
      .from("staff_tasks")
      .select("id, title, assignee_id, creator_id, status, due_at, closed_at")
      .not("status", "in", `(${OPEN_TASK.join(",")})`)
      .gte("closed_at", from)
      .limit(2000),
    db
      .from("mockup_offers")
      .select("id, client, mockup_name, status, sent_at, expires_at, approved_at")
      .or(`sent_at.gte."${from}",approved_at.gte."${from}",status.eq.active`)
      .limit(2000),
    db
      .from("prospects")
      .select("id, status, touched_by, touched_at, sent_at, autopilot_at, replied_at")
      .or(`touched_at.gte."${from}",sent_at.gte."${from}",replied_at.gte."${from}"`)
      .limit(LIMIT),
    db.from("touch_portions").select("staff_id, replaces, outcome, source").eq("day", day).limit(2000),
    db.from("panel_presence").select("staff_id, minutes, first_at, last_at").eq("day", day).limit(500),
    db.from("panel_usage").select("staff_id, last_at").eq("day", day).limit(2000),
    db
      .from("audit_events")
      .select("actor_staff_id, created_at, action")
      .gte("created_at", activeFrom)
      .not("actor_staff_id", "is", null)
      .limit(2000),
    db.from("tg_accounts").select("id, label, tg_name, status, flood_until").neq("status", "removed"),
    db.from("stats_snapshots").select("payload, computed_at").eq("key", TROUBLE_KEY).maybeSingle(),
    db
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("kind", "circle")
      .ilike("failure", "%нет кружка%")
      .gte("created_at", dayFrom),
    autopilotSettings().catch(() => ({ enabled: false, target: 0 })),
    readHealth().catch(() => null),
    mainLimitUntil(now.getTime()).catch(() => null),
    circleStates().catch(() => new Map()),
    approves(role) ? pendingTransfers().catch(() => []) : Promise.resolve([]),
    money ? pendingContracts().catch(() => []) : Promise.resolve([]),
    money
      ? db.from("project_payments").select("amount_usd, paid_on").gte("paid_on", from.slice(0, 10)).limit(LIMIT)
      : Promise.resolve({ data: [] as HqPayment[] }),
    firecrawlRemaining(now).catch(() => null),
  ]);

  if (staffRes.error && leadsRes.error) return empty;

  const staffRows = ((staffRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    display_name: String(r.display_name ?? "—"),
    role: r.role as Role,
    bot_seen_at: str(r.bot_seen_at),
  }));
  const leads: HqLead[] = ((leadsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    created_at: String(r.created_at),
    status: String(r.status),
    priority: String(r.priority),
    assigned_staff_id: str(r.assigned_staff_id),
    label: leadLabel(r),
  }));
  const offers = ((offersRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    lead_id: String(r.lead_id),
    staff_id: String(r.staff_id),
    expires_at: String(r.expires_at),
  }));
  const events = (eventsRes.data ?? []) as HqEvent[];
  const tasks = [...((openTasksRes.data ?? []) as HqTask[]), ...((closedTasksRes.data ?? []) as HqTask[])];
  const mockups = ((mockupsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    client: String(r.client ?? ""),
    mockup_name: String(r.mockup_name ?? ""),
    status: String(r.status),
    sent_at: String(r.sent_at),
    expires_at: String(r.expires_at),
    approved_at: str(r.approved_at),
  })) as HqMockup[];
  const prospects = (prospectsRes.data ?? []) as HqProspect[];
  const portions = (portionsRes.data ?? []) as HqPortionRow[];

  const leadsNow = leadsPulse(leads, offers, events, now);
  const touches = touchesPulse(prospects, portions, autopilot, now);
  const mockupsNow = mockupsPulse(mockups, now);
  const tasksNow = tasksPulse(tasks, now);

  // Люди — те, кто в очереди касаний и лидов: руководители и менеджеры.
  const team = staffRows.filter((s) => (QUEUE_ROLES as readonly string[]).includes(s.role));
  const ids = team.map((s) => s.id);
  const [touchesBy, stale] = await Promise.all([
    touchesOnDay(ids, day).catch(() => new Map<string, number>()),
    staleCounts(ids, now).catch(() => new Map<string, number>()),
  ]);
  const count = <T>(rows: readonly T[], key: (r: T) => string | null) => {
    const out = new Map<string, number>();
    for (const r of rows) {
      const k = key(r);
      if (k) out.set(k, (out.get(k) ?? 0) + 1);
    }
    return out;
  };
  const inWorkBy = count(
    leads.filter((l) => l.status === "taken"),
    (l) => l.assigned_staff_id,
  );
  const burned = (burnedRes.data ?? []) as { staff_id: string }[];
  const burnedBy = count(burned, (r) => r.staff_id);
  const presence = (presenceRes.data ?? []) as { staff_id: string; minutes: number; first_at: string | null; last_at: string | null }[];
  const views = (viewsRes.data ?? []) as { staff_id: string; last_at: string | null }[];
  const acts = ((actsRes.data ?? []) as { actor_staff_id: string; created_at: string; action: string }[]).filter(
    (a) => !a.action.startsWith("login."),
  );
  const lastOf = (rows: readonly { at: string | null }[]) =>
    rows.map((r) => r.at).filter((x): x is string => Boolean(x)).sort().at(-1) ?? null;

  const people = sortPeople(
    team.map((s) =>
      personOf(
        {
          staff: s,
          presence: presence.find((p) => p.staff_id === s.id) ?? null,
          lastView: lastOf(views.filter((v) => v.staff_id === s.id).map((v) => ({ at: v.last_at }))),
          lastAction: lastOf(acts.filter((a) => a.actor_staff_id === s.id).map((a) => ({ at: a.created_at }))),
          touches: touchesBy.get(s.id) ?? 0,
          touchDays: dailyCounts(
            prospects.filter((p) => p.touched_by === s.id && p.status !== "failed").map((p) => p.touched_at),
            now,
          ),
          portion: portions.filter((p) => p.staff_id === s.id),
          inWork: inWorkBy.get(s.id) ?? 0,
          burnedToday: burnedBy.get(s.id) ?? 0,
          stale: stale.get(s.id) ?? 0,
          tasks,
        },
        now,
      ),
    ),
  );

  // Ограничения Telegram и кружки — только у рабочих аккаунтов.
  const accounts = ((accountsRes.data ?? []) as Record<string, unknown>[]).filter((a) => a.status === "active");
  const labelOf = (a: Record<string, unknown>) => String(a.label || a.tg_name || a.id);
  const bans = [
    ...(mainUntil ? [{ account: MAIN_LABEL, until: mainUntil }] : []),
    ...accounts
      .map((a) => ({ account: labelOf(a), until: a.flood_until ? Date.parse(String(a.flood_until)) : 0 }))
      .filter((b) => b.until > now.getTime()),
  ];
  const known = [
    { key: MAIN_ACCOUNT, label: MAIN_LABEL },
    ...accounts.map((a) => ({ key: String(a.id), label: labelOf(a) })),
  ].filter((a) => circles.has(a.key));
  const circlesMissing = {
    ru: known.filter((a) => !circles.get(a.key)?.savedAt).map((a) => a.label),
    uz: known.filter((a) => !circles.get(a.key)?.uzSavedAt).map((a) => a.label),
  };

  const trouble = troubleRes.data
    ? {
        error: String((troubleRes.data.payload as { error?: unknown } | null)?.error ?? ""),
        at: String(troubleRes.data.computed_at),
      }
    : null;

  const moneyNow = money ? moneyPulse((paymentsRes.data ?? []) as HqPayment[], contracts.length, now) : null;

  const attention = attentionOf({
    role,
    now,
    sweep: health,
    autopilotTrouble: trouble && trouble.error ? trouble : null,
    bans,
    circlesMissing,
    circleFallback: circleFallbackRes.count ?? 0,
    leads: leadsNow,
    burnedToday: burned.length,
    overdue: tasksNow.overdue.length,
    stale: [...stale.values()].reduce((s, n) => s + n, 0),
    transfers: transfers.length,
    contracts: contracts.length,
    mockups: mockupsNow,
    firecrawlRemaining: firecrawl,
  });

  return {
    offline: false,
    leads: leadsNow,
    touches,
    mockups: mockupsNow,
    tasks: tasksNow,
    money: moneyNow,
    attention,
    people,
    feed: feedOf({ leads, events, mockups, tasks, names: new Map(staffRows.map((s) => [s.id, s.display_name])) }, now),
  };
}
