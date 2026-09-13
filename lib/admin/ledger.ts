import { record } from "@/lib/admin/audit";
import {
  canEditMoney,
  type DealKind,
  type Grade,
  type Purpose,
} from "@/lib/admin/finance";
import { projectsOwnedBy, type Project } from "@/lib/admin/projects";
import type { Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { serviceClient } from "@/lib/supabase";

/**
 * Книга: чтение денег из базы и записи, которые их меняют.
 *
 * В базе только факты — сумма и себестоимость при проекте, платежи
 * клиента, выплаты сотрудникам. Всё, что из них следует (налог, прибыль,
 * начисления, заморозка, балансы), считается в `finance.ts` и здесь не
 * хранится. Поэтому чтение — это три списка и люди, а страница складывает
 * их сама.
 *
 * Права проверяются здесь, а не только на странице: действие сервера — это
 * обычный POST, и форму можно отправить мимо кнопки.
 */

export type Payment = {
  id: string;
  project_id: string;
  amount_usd: number;
  /** Дата платежа, YYYY-MM-DD. */
  paid_on: string;
  purpose: Purpose;
  note: string | null;
  confirmed_by: string | null;
  confirmed_name: string | null;
};

export type Payout = {
  id: string;
  staff_id: string;
  staff_name: string | null;
  amount_usd: number;
  paid_on: string;
  note: string | null;
  created_by: string | null;
};

export type Person = {
  id: string;
  display_name: string;
  role: Role;
  grade: Grade;
  rate_percent: number | null;
  head_staff_id: string | null;
  is_active: boolean;
};

export type Ledger = {
  offline: boolean;
  projects: Project[];
  payments: Payment[];
  payouts: Payout[];
  people: Person[];
};

const PEOPLE_COLUMNS = "id, display_name, role, grade, rate_percent, head_staff_id, is_active";
// Связь через колонку, а не через таблицу: у выплат две ссылки на staff, и
// PostgREST должен знать, по какой из них разворачивать имя.
const PAYMENT_COLUMNS =
  "id, project_id, amount_usd, paid_on, purpose, note, confirmed_by, confirmer:confirmed_by (display_name)";
const PAYOUT_COLUMNS =
  "id, staff_id, amount_usd, paid_on, note, created_by, person:staff_id (display_name)";

function nameOf(joined: unknown): string | null {
  const one = (Array.isArray(joined) ? joined[0] : joined) as
    | { display_name?: string }
    | null
    | undefined;
  return one?.display_name ?? null;
}

function shapePayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    amount_usd: row.amount_usd as number,
    paid_on: String(row.paid_on),
    purpose: row.purpose as Purpose,
    note: (row.note as string | null) ?? null,
    confirmed_by: (row.confirmed_by as string | null) ?? null,
    confirmed_name: nameOf(row.confirmer),
  };
}

function shapePayout(row: Record<string, unknown>): Payout {
  return {
    id: row.id as string,
    staff_id: row.staff_id as string,
    staff_name: nameOf(row.person),
    amount_usd: row.amount_usd as number,
    paid_on: String(row.paid_on),
    note: (row.note as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
  };
}

function shapePerson(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    display_name: row.display_name as string,
    role: row.role as Role,
    grade: row.grade as Grade,
    rate_percent: (row.rate_percent as number | null) ?? null,
    head_staff_id: (row.head_staff_id as string | null) ?? null,
    is_active: Boolean(row.is_active),
  };
}

/** Все сотрудники, включая отключённых: их старые проекты считаются по-прежнему. */
export async function loadPeople(): Promise<Person[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db.from("staff").select(PEOPLE_COLUMNS).order("display_name");
  if (error) {
    console.error("admin: не прочитал людей для финансов", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapePerson(row as Record<string, unknown>));
}

export async function paymentsFor(projectIds: readonly string[]): Promise<Payment[]> {
  const db = serviceClient();
  if (!db || !projectIds.length) return [];

  const { data, error } = await db
    .from("project_payments")
    .select(PAYMENT_COLUMNS)
    .in("project_id", [...projectIds])
    .order("paid_on", { ascending: true })
    .limit(2000);
  if (error) {
    console.error("admin: не прочитал платежи", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapePayment(row as Record<string, unknown>));
}

export async function payoutsFor(scope: "all" | readonly string[]): Promise<Payout[]> {
  const db = serviceClient();
  if (!db) return [];
  if (scope !== "all" && !scope.length) return [];

  let query = db.from("payouts").select(PAYOUT_COLUMNS).order("paid_on", { ascending: false });
  if (scope !== "all") query = query.in("staff_id", [...scope]);

  const { data, error } = await query.limit(2000);
  if (error) {
    console.error("admin: не прочитал выплаты", error.message);
    return [];
  }
  return (data ?? []).map((row) => shapePayout(row as Record<string, unknown>));
}

/**
 * Всё, что нужно странице финансов, в границах круга.
 *
 * Круг — «чьи проекты и балансы видны»: `all` для владельца, список id для
 * руководителя и менеджера. Люди читаются целиком в любом случае: чтобы
 * посчитать долю руководителя, нужно знать, кто чей, а не только тех, кого
 * показываем.
 */
export async function loadLedger(scope: "all" | readonly string[]): Promise<Ledger> {
  const db = serviceClient();
  if (!db) return { offline: true, projects: [], payments: [], payouts: [], people: [] };

  const [people, projects, payouts] = await Promise.all([
    loadPeople(),
    projectsOwnedBy(scope),
    payoutsFor(scope),
  ]);
  const payments = await paymentsFor(projects.map((p) => p.id));

  return { offline: false, projects, payments, payouts, people };
}

/* ── Записи ─────────────────────────────────────────────────────────────── */

export type MoneyResult =
  | { ok: true }
  | { ok: false; reason: "offline" | "forbidden" | "gone" | "invalid" | "failed" };

const OK: MoneyResult = { ok: true };
const fail = (reason: Exclude<MoneyResult, { ok: true }>["reason"]): MoneyResult => ({ ok: false, reason });

const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function paidTotal(projectId: string): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("project_payments").select("amount_usd").eq("project_id", projectId);
  return (data ?? []).reduce((sum, row) => sum + ((row.amount_usd as number) ?? 0), 0);
}

/**
 * Сумма, вид, налог, себестоимость.
 *
 * Сумму и вид правит тот, кто ведёт проект, пока по нему нет платежей, и
 * владелец — всегда. Налог и себестоимость — только владелец: это его
 * деньги и его налоги, и менеджер не должен иметь возможности поднять
 * себе начисление, уменьшив себестоимость.
 */
export async function setProjectMoney(
  projectId: string,
  fields: {
    kind?: DealKind;
    amountUsd?: number | null;
    taxPercent?: number;
    devCostUsd?: number | null;
  },
  staff: Staff,
  ip: string,
): Promise<MoneyResult> {
  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: project } = await db
    .from("projects")
    .select("id, owner_staff_id, stage, kind, amount_usd, tax_percent, dev_cost_usd")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return fail("gone");

  const paid = await paidTotal(projectId);
  const view = {
    owner_staff_id: (project.owner_staff_id as string | null) ?? null,
    stage: project.stage as string,
  };
  if (!canEditMoney(staff, view, paid)) return fail("forbidden");

  const patch: Record<string, unknown> = {};
  if (fields.kind !== undefined) patch.kind = fields.kind;
  if (fields.amountUsd !== undefined) patch.amount_usd = fields.amountUsd;
  if (fields.taxPercent !== undefined || fields.devCostUsd !== undefined) {
    if (staff.role !== "admin") return fail("forbidden");
    if (fields.taxPercent !== undefined) patch.tax_percent = fields.taxPercent;
    if (fields.devCostUsd !== undefined) patch.dev_cost_usd = fields.devCostUsd;
  }
  if (!Object.keys(patch).length) return OK;

  const { error } = await db.from("projects").update(patch).eq("id", projectId);
  if (error) return fail("failed");

  const before: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) before[key] = (project as Record<string, unknown>)[key] ?? null;

  await record("project.money_set", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: { from: before, to: patch },
  });
  return OK;
}

/** Платёж клиента. Подтверждает только владелец. */
export async function addPayment(
  projectId: string,
  fields: { amountUsd: number | null; paidOn: string | null; purpose: Purpose; note: string | null },
  staff: Staff,
  ip: string,
): Promise<MoneyResult> {
  if (staff.role !== "admin") return fail("forbidden");
  if (fields.amountUsd === null || !Number.isInteger(fields.amountUsd) || fields.amountUsd <= 0) {
    return fail("invalid");
  }
  if (fields.paidOn !== null && !DATE.test(fields.paidOn)) return fail("invalid");

  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: project } = await db.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (!project) return fail("gone");

  const row: Record<string, unknown> = {
    project_id: projectId,
    amount_usd: fields.amountUsd,
    purpose: fields.purpose,
    note: fields.note?.trim().slice(0, 500) || null,
    confirmed_by: staff.id,
  };
  if (fields.paidOn) row.paid_on = fields.paidOn;

  const { data, error } = await db.from("project_payments").insert(row).select("id").maybeSingle();
  if (error || !data) return fail("failed");

  await record("project.payment_added", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: { payment_id: data.id, amount_usd: fields.amountUsd, purpose: fields.purpose, paid_on: fields.paidOn },
  });
  return OK;
}

export async function removePayment(paymentId: string, staff: Staff, ip: string): Promise<MoneyResult> {
  if (staff.role !== "admin") return fail("forbidden");

  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: payment } = await db
    .from("project_payments")
    .select("id, project_id, amount_usd, paid_on")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return fail("gone");

  const { error } = await db.from("project_payments").delete().eq("id", paymentId);
  if (error) return fail("failed");

  await record("project.payment_removed", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: payment.project_id as string,
    ip,
    meta: { payment_id: paymentId, amount_usd: payment.amount_usd, paid_on: payment.paid_on },
  });
  return OK;
}

/**
 * Выплата сотруднику. Только владелец; себе — нельзя: владельцу остаётся
 * остаток, а не выплата, и запись «выплатил себе» ничего не уравновешивает.
 */
export async function recordPayout(
  staffId: string,
  fields: { amountUsd: number | null; paidOn: string | null; note: string | null },
  staff: Staff,
  ip: string,
): Promise<MoneyResult> {
  if (staff.role !== "admin") return fail("forbidden");
  if (fields.amountUsd === null || !Number.isInteger(fields.amountUsd) || fields.amountUsd <= 0) {
    return fail("invalid");
  }
  if (fields.paidOn !== null && !DATE.test(fields.paidOn)) return fail("invalid");

  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: target } = await db.from("staff").select("id, role").eq("id", staffId).maybeSingle();
  if (!target) return fail("gone");
  if (target.role === "admin") return fail("invalid");

  const row: Record<string, unknown> = {
    staff_id: staffId,
    amount_usd: fields.amountUsd,
    note: fields.note?.trim().slice(0, 500) || null,
    created_by: staff.id,
  };
  if (fields.paidOn) row.paid_on = fields.paidOn;

  const { data, error } = await db.from("payouts").insert(row).select("id").maybeSingle();
  if (error || !data) return fail("failed");

  await record("payout.recorded", {
    actorStaffId: staff.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { payout_id: data.id, amount_usd: fields.amountUsd, paid_on: fields.paidOn },
  });
  return OK;
}

export async function removePayout(payoutId: string, staff: Staff, ip: string): Promise<MoneyResult> {
  if (staff.role !== "admin") return fail("forbidden");

  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: payout } = await db
    .from("payouts")
    .select("id, staff_id, amount_usd, paid_on")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return fail("gone");

  const { error } = await db.from("payouts").delete().eq("id", payoutId);
  if (error) return fail("failed");

  await record("payout.removed", {
    actorStaffId: staff.id,
    targetType: "staff",
    targetId: payout.staff_id as string,
    ip,
    meta: { payout_id: payoutId, amount_usd: payout.amount_usd, paid_on: payout.paid_on },
  });
  return OK;
}
