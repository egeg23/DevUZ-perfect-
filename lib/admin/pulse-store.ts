import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";
import {
  canSetPlan,
  isMetric,
  type EventLite,
  type ExpenseLite,
  type LeadLite,
  type MessageLite,
  type PaymentLite,
  type Period,
  type Plan,
  type ProjectLite,
} from "@/lib/admin/pulse";

/**
 * Строки для пульса — одним заходом, без вычислений: считает lib/admin/pulse.
 *
 * Журнал и переписка берутся за последние сорок дней: этого хватает на
 * текущую и прошлую неделю, месяц и порог «застрял». Дальше не нужно, а
 * журнал растёт без предела.
 */

const LOOKBACK_DAYS = 40;
const LIMIT = 5000;

export type PulseRows = {
  offline: boolean;
  leads: LeadLite[];
  events: EventLite[];
  messages: MessageLite[];
  projects: ProjectLite[];
  payments: PaymentLite[];
  expenses: ExpenseLite[];
};

export async function loadPulseRows(now: Date): Promise<PulseRows> {
  const db = serviceClient();
  const empty: PulseRows = { offline: true, leads: [], events: [], messages: [], projects: [], payments: [], expenses: [] };
  if (!db) return empty;

  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();

  const [leads, events, messages, projects, payments, expenses] = await Promise.all([
    db
      .from("leads")
      .select("id, assigned_staff_id, status, priority, created_at, assigned_at, request_no, company, contact_name")
      .not("assigned_staff_id", "is", null)
      .limit(LIMIT),
    db
      .from("audit_events")
      .select("actor_staff_id, action, target_type, target_id, created_at, meta")
      .gte("created_at", since)
      .limit(LIMIT),
    db.from("lead_messages").select("lead_id, author_staff_id, created_at").gte("created_at", since).limit(LIMIT),
    db.from("projects").select("id, title, client, owner_staff_id, amount_usd, stage").limit(LIMIT),
    db.from("project_payments").select("project_id, amount_usd, paid_on").limit(LIMIT),
    db.from("expenses").select("amount_usd, spent_on").limit(LIMIT),
  ]);

  if (leads.error || events.error || messages.error || projects.error || payments.error || expenses.error) {
    console.error("pulse: не собрал строки", {
      leads: leads.error?.message,
      events: events.error?.message,
      messages: messages.error?.message,
      projects: projects.error?.message,
      payments: payments.error?.message,
      expenses: expenses.error?.message,
    });
    return empty;
  }

  return {
    offline: false,
    leads: (leads.data ?? []) as unknown as LeadLite[],
    events: (events.data ?? []) as unknown as EventLite[],
    messages: (messages.data ?? []) as unknown as MessageLite[],
    projects: (projects.data ?? []) as unknown as ProjectLite[],
    payments: (payments.data ?? []).map((p) => ({
      project_id: String(p.project_id),
      amount_usd: Number(p.amount_usd) || 0,
      paid_on: String(p.paid_on),
    })),
    expenses: (expenses.data ?? []).map((e) => ({ amount_usd: Number(e.amount_usd) || 0, spent_on: String(e.spent_on) })),
  };
}

/* ── Планы ─────────────────────────────────────────────────────────────── */

function shapePlan(row: Record<string, unknown>): Plan | null {
  const metric = String(row.metric ?? "");
  const period = String(row.period ?? "");
  if (!isMetric(metric) || (period !== "week" && period !== "month")) return null;
  return {
    id: String(row.id),
    staff_id: String(row.staff_id),
    period,
    period_start: String(row.period_start),
    metric,
    target: Number(row.target) || 0,
  };
}

/** Планы на названные периоды — для всех или для круга людей. */
export async function loadPlans(starts: { period: Period; period_start: string }[], staffIds?: readonly string[]): Promise<Plan[]> {
  const db = serviceClient();
  if (!db || !starts.length) return [];
  if (staffIds && !staffIds.length) return [];

  let query = db.from("plans").select("id, staff_id, period, period_start, metric, target").in(
    "period_start",
    [...new Set(starts.map((s) => s.period_start))],
  );
  if (staffIds) query = query.in("staff_id", [...staffIds]);
  const { data } = await query;
  const wanted = new Set(starts.map((s) => `${s.period}:${s.period_start}`));
  return (data ?? [])
    .map((row) => shapePlan(row as Record<string, unknown>))
    .filter((p): p is Plan => p !== null && wanted.has(`${p.period}:${p.period_start}`));
}

export type PlanResult = { ok: true } | { ok: false; reason: "forbidden" | "invalid" | "offline" | "failed" };

/**
 * Поставить или изменить план. Право проверяется здесь, а не в форме:
 * форму можно отправить и мимо кнопки.
 */
export async function setPlan(
  fields: { staffId: string; period: Period; periodStart: string; metric: string; target: number },
  staff: Staff,
  team: readonly string[],
  ip: string,
): Promise<PlanResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  if (!isMetric(fields.metric) || !Number.isFinite(fields.target) || fields.target < 0) return { ok: false, reason: "invalid" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.periodStart)) return { ok: false, reason: "invalid" };

  const { data: existing } = await db
    .from("plans")
    .select("id, target")
    .eq("staff_id", fields.staffId)
    .eq("period", fields.period)
    .eq("period_start", fields.periodStart)
    .eq("metric", fields.metric)
    .maybeSingle();

  if (!canSetPlan(staff, fields.staffId, team, Boolean(existing))) return { ok: false, reason: "forbidden" };

  const { error } = await db.from("plans").upsert(
    {
      staff_id: fields.staffId,
      period: fields.period,
      period_start: fields.periodStart,
      metric: fields.metric,
      target: fields.target,
      set_by: staff.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "staff_id,period,period_start,metric" },
  );
  if (error) return { ok: false, reason: "failed" };

  await record("plan.set", {
    actorStaffId: staff.id,
    targetType: "staff",
    targetId: fields.staffId,
    ip,
    meta: { period: fields.period, period_start: fields.periodStart, metric: fields.metric, from: existing?.target ?? null, to: fields.target },
  });
  return { ok: true };
}

/** Снять план — только владелец. */
export async function removePlan(planId: string, staff: Staff, ip: string): Promise<PlanResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  if (staff.role !== "admin") return { ok: false, reason: "forbidden" };

  const { data: plan } = await db.from("plans").select("id, staff_id, period, period_start, metric, target").eq("id", planId).maybeSingle();
  if (!plan) return { ok: false, reason: "failed" };

  const { error } = await db.from("plans").delete().eq("id", planId);
  if (error) return { ok: false, reason: "failed" };

  await record("plan.removed", {
    actorStaffId: staff.id,
    targetType: "staff",
    targetId: String(plan.staff_id),
    ip,
    meta: { period: plan.period, period_start: plan.period_start, metric: plan.metric, target: plan.target },
  });
  return { ok: true };
}

/* ── Договоры на подпись ───────────────────────────────────────────────── */

export type PendingContract = { id: string; number: string; client_name: string; amount_usd: number; sent_at: string | null };

export async function pendingContracts(): Promise<PendingContract[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("contracts")
    .select("id, number, client_name, amount_usd, sent_at")
    .eq("status", "pending")
    .order("sent_at", { ascending: true });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    number: String(row.number),
    client_name: String(row.client_name ?? ""),
    amount_usd: Number(row.amount_usd) || 0,
    sent_at: (row.sent_at as string | null) ?? null,
  }));
}
