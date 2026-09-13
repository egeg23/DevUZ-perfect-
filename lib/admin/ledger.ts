import { record } from "@/lib/admin/audit";
import {
  canEditMoney,
  type DealKind,
  type Grade,
  type Purpose,
} from "@/lib/admin/finance";
import { projectsOwnedBy, type Project } from "@/lib/admin/projects";
import { notifyPartner, partnerById, partnersById, summarize, type Partner } from "@/lib/partners/store";
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

/** Процент по конкретной сделке, заданный владельцем вручную. */
export type Share = { project_id: string; staff_id: string; percent: number };

export type Ledger = {
  offline: boolean;
  projects: Project[];
  payments: Payment[];
  payouts: Payout[];
  people: Person[];
  shares: Share[];
  /** Партнёры, приведшие клиентов проектов в круге, и кто из них «прокачан». */
  partners: Map<string, Partner>;
  partnerProven: Map<string, boolean>;
};

const PEOPLE_COLUMNS = "id, display_name, role, grade, rate_percent, head_staff_id, is_active";
// Связь через колонку, а не через таблицу: у выплат две ссылки на staff, и
// PostgREST должен знать, по какой из них разворачивать имя.
const PAYMENT_COLUMNS =
  "id, project_id, amount_usd, paid_on, purpose, note, confirmed_by, confirmer:confirmed_by (display_name)";
const PAYOUT_COLUMNS =
  "id, staff_id, amount_usd, paid_on, note, created_by, person:staff_id (display_name)";
const SHARE_COLUMNS = "project_id, staff_id, percent";

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

export async function sharesFor(projectIds: readonly string[]): Promise<Share[]> {
  const db = serviceClient();
  if (!db || !projectIds.length) return [];

  const { data, error } = await db
    .from("project_shares")
    .select(SHARE_COLUMNS)
    .in("project_id", [...projectIds])
    .limit(4000);
  if (error) {
    console.error("admin: не прочитал проценты по сделкам", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    project_id: row.project_id as string,
    staff_id: row.staff_id as string,
    percent: row.percent as number,
  }));
}

/** Ручные проценты одного проекта — в форме, которую ждёт `accrualsOf`. */
export function sharesOf(projectId: string, shares: readonly Share[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of shares) if (s.project_id === projectId) out.set(s.staff_id, s.percent);
  return out;
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
  if (!db) {
    return {
      offline: true, projects: [], payments: [], payouts: [], people: [], shares: [],
      partners: new Map(), partnerProven: new Map(),
    };
  }

  const [people, projects, payouts] = await Promise.all([
    loadPeople(),
    projectsOwnedBy(scope),
    payoutsFor(scope),
  ]);
  const ids = projects.map((p) => p.id);
  const partnerIds = [...new Set(projects.map((p) => p.partner_id).filter((id): id is string => id !== null))];
  const [payments, shares, partners] = await Promise.all([
    paymentsFor(ids),
    sharesFor(ids),
    partnersById(partnerIds),
  ]);
  // Ступень партнёра считается по всем его проектам, не только по кругу.
  const partnerProven = new Map<string, boolean>();
  for (const s of await summarize([...partners.values()])) partnerProven.set(s.partner.id, s.proven);

  return { offline: false, projects, payments, payouts, people, shares, partners, partnerProven };
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

  const { data: project } = await db
    .from("projects")
    .select("id, client, amount_usd, partner_id")
    .eq("id", projectId)
    .maybeSingle();
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

  // Уведомление партнёру не должно ронять запись платежа.
  try {
    await notifyPartnerIfPaid(project as Record<string, unknown>, projectId);
  } catch (error) {
    console.error("partners: уведомление об оплате", error);
  }
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

/**
 * Процент по конкретной сделке.
 *
 * Только владелец, и только тем, кто к сделке закреплён: ведущему проект и
 * его руководителю. `null` снимает ручной процент — дальше по грейду.
 * Постороннему процент не задать даже мимо формы: закреплённых определяет
 * сама сделка, а не то, что пришло в POST.
 */
export async function setProjectShare(
  projectId: string,
  staffId: string,
  percent: number | null,
  staff: Staff,
  ip: string,
): Promise<MoneyResult> {
  if (staff.role !== "admin") return fail("forbidden");
  if (percent !== null && (!Number.isInteger(percent) || percent < 0 || percent > 100)) {
    return fail("invalid");
  }

  const db = serviceClient();
  if (!db) return fail("offline");

  const { data: project } = await db
    .from("projects")
    .select("id, owner_staff_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return fail("gone");

  const ownerId = (project.owner_staff_id as string | null) ?? null;
  if (!ownerId) return fail("invalid");

  const { data: owner } = await db
    .from("staff")
    .select("id, head_staff_id")
    .eq("id", ownerId)
    .maybeSingle();
  const attached = new Set<string>([ownerId]);
  const headId = (owner?.head_staff_id as string | null) ?? null;
  if (headId) attached.add(headId);
  if (!attached.has(staffId)) return fail("invalid");

  const { data: before } = await db
    .from("project_shares")
    .select("percent")
    .eq("project_id", projectId)
    .eq("staff_id", staffId)
    .maybeSingle();
  const previous = (before?.percent as number | undefined) ?? null;
  if (previous === percent) return OK;

  if (percent === null) {
    const { error } = await db
      .from("project_shares")
      .delete()
      .eq("project_id", projectId)
      .eq("staff_id", staffId);
    if (error) return fail("failed");
  } else {
    const { error } = await db
      .from("project_shares")
      .upsert(
        { project_id: projectId, staff_id: staffId, percent, set_by: staff.id, updated_at: new Date().toISOString() },
        { onConflict: "project_id,staff_id" },
      );
    if (error) return fail("failed");
  }

  await record("project.share_set", {
    actorStaffId: staff.id,
    targetType: "project",
    targetId: projectId,
    ip,
    meta: { staff_id: staffId, from: previous, to: percent },
  });
  return OK;
}

/**
 * Платёж закрыл проект целиком — партнёру, если он есть, пора сказать о
 * начислении. Считается той же функцией, что и на страницах: сообщение не
 * должно расходиться с тем, что партнёр увидит в /ref.
 */
async function notifyPartnerIfPaid(project: Record<string, unknown>, projectId: string): Promise<void> {
  const partnerId = (project.partner_id as string | null) ?? null;
  const amount = (project.amount_usd as number | null) ?? null;
  if (!partnerId || amount === null || amount <= 0) return;

  const paid = await paidTotal(projectId);
  if (paid < amount) return;

  const partner = await partnerById(partnerId);
  if (!partner) return;
  const [summary] = await summarize([partner]);
  const line = summary?.accruals.find((a) => a.project_id === projectId);
  if (!line || line.state !== "earned" || line.amount_usd <= 0) return;

  const client = (project.client as string | null)?.trim();
  const sum = line.amount_usd.toLocaleString("ru-RU");
  await notifyPartner(
    partner,
    `✅ Проект${client ? ` клиента «${client}»` : ""} оплачен целиком. Вам начислено <b>${sum} $</b> (${line.percent} %). Баланс и вывод: /ref, /payout.`,
  );
}
