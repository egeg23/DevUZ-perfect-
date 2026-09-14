import { record } from "@/lib/admin/audit";
import { AUTO_REMINDER_HOURS, createReminder, handleOf } from "@/lib/admin/ownership";
import type { Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Передача лида другому сотруднику.
 *
 * Владелец: «сотрудник может передать его другому сотруднику с
 * подтверждением руководителя или мной». Отсюда две дороги, и они не
 * одинаковые.
 *
 * Менеджер просит. Лид при этом остаётся у него: просьба ничего не двигает,
 * пока её не решили. Иначе отказ пришлось бы откатывать, а всё это время
 * лид висел бы между двумя людьми, и оба считали бы, что пишет другой.
 *
 * Руководитель и владелец передают сразу — им и подтверждать. Просить
 * разрешения у самого себя незачем.
 *
 * Правила — чистые функции, чтобы их закрывали тесты; всё, что ходит в
 * базу, ниже и построено на них.
 */

/* ── Правила ────────────────────────────────────────────────────────────── */

/** Кто решает по просьбам: руководитель отдела и владелец. */
export function approves(role: Role): boolean {
  return role === "admin" || role === "head";
}

/** Кому нужно подтверждение, чтобы отдать лид. */
export function needsApproval(role: Role): boolean {
  return !approves(role);
}

export type TransferVerdict =
  | "ok"
  /** Лид не у просящего, а он не руководитель и не владелец. */
  | "not_mine"
  /** Лид ничей — его не передают, а берут. */
  | "free"
  /** Себе же. */
  | "self"
  /** Такого сотрудника нет или он отключён. */
  | "gone"
  /** По этому лиду уже ждёт решения другая просьба. */
  | "pending";

/**
 * Можно ли просить о передаче — до всякой записи в базу.
 *
 * Свободный лид не передают: его берут кнопкой «Взять себе», и лишняя
 * дорога к тому же результату — это лишний способ ошибиться.
 */
export function transferVerdict(input: {
  actor: { id: string; role: Role };
  holderId: string | null;
  targetId: string;
  targetActive: boolean;
  hasPending: boolean;
}): TransferVerdict {
  if (input.hasPending) return "pending";
  if (!input.holderId) return "free";
  if (!input.targetActive) return "gone";
  if (input.targetId === input.holderId) return "self";
  if (input.holderId !== input.actor.id && !approves(input.actor.role)) return "not_mine";
  return "ok";
}

export type TransferStatus = "requested" | "approved" | "declined";

export const TRANSFER_TITLE: Record<TransferStatus, string> = {
  requested: "ждёт подтверждения",
  approved: "подтверждена",
  declined: "отклонена",
};

export type Transfer = {
  id: string;
  created_at: string;
  lead_id: string;
  from_staff_id: string | null;
  from_name: string | null;
  to_staff_id: string;
  to_name: string | null;
  requested_by: string;
  requested_name: string | null;
  note: string | null;
  status: TransferStatus;
  decided_by: string | null;
  decided_at: string | null;
  /** Номер заявки — чтобы в очереди на решение было видно, о ком речь. */
  request_no: string | null;
  company: string | null;
};

/* ── Чтение ─────────────────────────────────────────────────────────────── */

// Связи названы по ключу: у таблицы четыре дороги к staff, и без имени
// PostgREST не угадает нужную (см. tests/postgrest-embeds).
const COLUMNS = [
  "id, created_at, lead_id, from_staff_id, to_staff_id, requested_by, note, status, decided_by, decided_at",
  "from_staff:from_staff_id (display_name)",
  "to_staff:to_staff_id (display_name)",
  "author:requested_by (display_name)",
  "lead:lead_id (request_no, company)",
].join(", ");

function nameOf(joined: unknown): string | null {
  const one = (Array.isArray(joined) ? joined[0] : joined) as { display_name?: string } | null | undefined;
  return one?.display_name ?? null;
}

function shape(row: Record<string, unknown>): Transfer {
  const lead = (Array.isArray(row.lead) ? row.lead[0] : row.lead) as
    | { request_no?: string | null; company?: string | null }
    | null
    | undefined;

  return {
    id: row.id as string,
    created_at: row.created_at as string,
    lead_id: row.lead_id as string,
    from_staff_id: (row.from_staff_id as string | null) ?? null,
    from_name: nameOf(row.from_staff),
    to_staff_id: row.to_staff_id as string,
    to_name: nameOf(row.to_staff),
    requested_by: row.requested_by as string,
    requested_name: nameOf(row.author),
    note: (row.note as string | null) ?? null,
    status: row.status as TransferStatus,
    decided_by: (row.decided_by as string | null) ?? null,
    decided_at: (row.decided_at as string | null) ?? null,
    request_no: lead?.request_no ?? null,
    company: lead?.company ?? null,
  };
}

/** Открытая просьба по лиду или null. */
export async function openTransferFor(leadId: string): Promise<Transfer | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("lead_transfers")
    .select(COLUMNS)
    .eq("lead_id", leadId)
    .eq("status", "requested")
    .maybeSingle();

  return data ? shape(data as unknown as Record<string, unknown>) : null;
}

/** Очередь на решение — для руководителя и владельца. */
export async function pendingTransfers(): Promise<Transfer[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("lead_transfers")
    .select(COLUMNS)
    .eq("status", "requested")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("admin: не прочитал просьбы о передаче", error.message);
    return [];
  }
  return (data ?? []).map((row) => shape(row as unknown as Record<string, unknown>));
}

/* ── Записи ─────────────────────────────────────────────────────────────── */

export type TransferResult =
  | { ok: true; moved: boolean }
  | { ok: false; reason: TransferVerdict | "offline" | "failed" };

async function staffRow(id: string) {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("staff")
    .select("id, display_name, username, telegram_user_id, is_active, head_staff_id")
    .eq("id", id)
    .maybeSingle();
  return data as
    | {
        id: string;
        display_name: string;
        username: string | null;
        telegram_user_id: number;
        is_active: boolean;
        head_staff_id: string | null;
      }
    | null;
}

async function tell(telegramId: number | null | undefined, text: string): Promise<void> {
  if (!telegramId) return;
  try {
    await sendMessage(telegramId, text);
  } catch (error) {
    console.error("admin: не уведомил о передаче", error);
  }
}

/** Как лид называется в сообщении: номером заявки, иначе компанией. */
function leadTitle(lead: { request_no: string | null; company: string | null }, leadId: string): string {
  return lead.request_no ?? lead.company ?? leadId.slice(0, 8);
}

/**
 * Передать лида: сразу, если решает сам, иначе — просьбой.
 *
 * Возвращает `moved: true`, когда лид уже сменил хозяина, и `false`, когда
 * создана просьба: страница по этому и различает сообщения.
 */
export async function requestTransfer(
  leadId: string,
  targetId: string,
  note: string | null,
  staff: Staff,
  ip: string,
): Promise<TransferResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data: lead } = await db
    .from("leads")
    .select("id, assigned_staff_id, request_no, company")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, reason: "failed" };

  const target = await staffRow(targetId);
  const pending = await openTransferFor(leadId);

  const verdict = transferVerdict({
    actor: { id: staff.id, role: staff.role },
    holderId: (lead.assigned_staff_id as string | null) ?? null,
    targetId,
    targetActive: Boolean(target?.is_active),
    hasPending: pending !== null,
  });
  if (verdict !== "ok") return { ok: false, reason: verdict };

  const holderId = lead.assigned_staff_id as string;
  const title = leadTitle(
    { request_no: (lead.request_no as string | null) ?? null, company: (lead.company as string | null) ?? null },
    leadId,
  );

  const { data: created, error } = await db
    .from("lead_transfers")
    .insert({
      lead_id: leadId,
      from_staff_id: holderId,
      to_staff_id: targetId,
      requested_by: staff.id,
      note: note?.trim().slice(0, 500) || null,
      // Кто решает сам — тот сразу и решил: строка сохраняется подтверждённой,
      // чтобы история передач была полной, а не только спорной её частью.
      ...(needsApproval(staff.role)
        ? {}
        : { status: "approved", decided_by: staff.id, decided_at: new Date().toISOString() }),
    })
    .select("id")
    .maybeSingle();

  if (error || !created) {
    console.error("admin: не записал передачу", error?.message);
    return { ok: false, reason: "failed" };
  }

  await record("lead.transfer_requested", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { transfer_id: created.id, from: holderId, to: targetId, immediate: !needsApproval(staff.role) },
  });

  if (!needsApproval(staff.role)) {
    const moved = await move(leadId, targetId, staff, ip);
    if (!moved) return { ok: false, reason: "failed" };
    await tell(
      target?.telegram_user_id,
      `<b>${staff.display_name}</b> передал вам лид <b>${title}</b>. Он уже ваш — откройте панель.`,
    );
    return { ok: true, moved: true };
  }

  // Решать будут руководитель просящего и владельцы. Пишем всем, кто может:
  // ждать ответа от одного человека, который сегодня не в сети, — это день
  // простоя по живому лиду.
  const me = await staffRow(staff.id);
  const { data: approvers } = await db
    .from("staff")
    .select("id, telegram_user_id, role, is_active")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);

  for (const row of approvers ?? []) {
    const id = row.id as string;
    const isHeadOfRequester = me?.head_staff_id === id;
    if (row.role !== "admin" && !isHeadOfRequester) continue;
    await tell(
      row.telegram_user_id as number,
      [
        `🔁 <b>${staff.display_name}</b> просит передать лид <b>${title}</b>`,
        `Кому: ${target?.display_name ?? "—"}`,
        note?.trim() ? `Причина: ${note.trim().slice(0, 300)}` : "",
        "",
        "Подтвердить или отклонить — на странице лида в панели.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return { ok: true, moved: false };
}

/** Собственно смена хозяина: одинаково и при передаче сразу, и при подтверждении. */
async function move(leadId: string, toStaffId: string, actor: Staff, ip: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const target = await staffRow(toStaffId);
  if (!target) return false;

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("leads")
    .update({
      assigned_staff_id: toStaffId,
      assigned_to: handleOf({
        id: target.id,
        display_name: target.display_name,
        username: target.username,
      } as Staff),
      assigned_at: now,
      status: "taken",
    })
    .eq("id", leadId)
    .select("id, auto_reminder")
    .maybeSingle();

  if (error || !data) {
    console.error("admin: не передал лида", error?.message);
    return false;
  }

  // Новому владельцу — своё напоминание: у прежнего оно осталось на его
  // имени и ему же и придёт, а лид теперь не его.
  if (data.auto_reminder !== false) {
    await createReminder(
      leadId,
      { id: target.id, display_name: target.display_name } as Staff,
      {
        dueAt: new Date(Date.now() + AUTO_REMINDER_HOURS * 3600_000).toISOString(),
        kind: "auto",
        note: "Лид передан вам — что дальше?",
        ip,
      },
    );
  }

  await record("lead.transferred", {
    actorStaffId: actor.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { to: toStaffId },
  });
  return true;
}

/** Решение руководителя или владельца по открытой просьбе. */
export async function decideTransfer(
  transferId: string,
  decision: "approved" | "declined",
  staff: Staff,
  ip: string,
): Promise<TransferResult> {
  if (!approves(staff.role)) return { ok: false, reason: "not_mine" };

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  // Решение записывается только поверх открытой просьбы: два нажатия на одну
  // кнопку не должны дать два решения.
  const { data, error } = await db
    .from("lead_transfers")
    .update({ status: decision, decided_by: staff.id, decided_at: new Date().toISOString() })
    .eq("id", transferId)
    .eq("status", "requested")
    .select("id, lead_id, to_staff_id, requested_by")
    .maybeSingle();

  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "pending" };

  const leadId = data.lead_id as string;
  const toId = data.to_staff_id as string;

  const { data: lead } = await db
    .from("leads")
    .select("request_no, company")
    .eq("id", leadId)
    .maybeSingle();
  const title = leadTitle(
    {
      request_no: (lead?.request_no as string | null) ?? null,
      company: (lead?.company as string | null) ?? null,
    },
    leadId,
  );

  const [asker, target] = await Promise.all([staffRow(data.requested_by as string), staffRow(toId)]);

  if (decision === "declined") {
    await record("lead.transfer_decided", {
      actorStaffId: staff.id,
      targetType: "lead",
      targetId: leadId,
      ip,
      meta: { transfer_id: transferId, decision },
    });
    await tell(
      asker?.telegram_user_id,
      `Передачу лида <b>${title}</b> не подтвердили. Лид остаётся у вас.`,
    );
    return { ok: true, moved: false };
  }

  const moved = await move(leadId, toId, staff, ip);
  if (!moved) return { ok: false, reason: "failed" };

  await record("lead.transfer_decided", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { transfer_id: transferId, decision, to: toId },
  });

  await tell(target?.telegram_user_id, `Вам передали лид <b>${title}</b>. Он уже ваш — откройте панель.`);
  if (asker && asker.id !== toId) {
    await tell(asker.telegram_user_id, `Передачу лида <b>${title}</b> подтвердили. Теперь он у ${target?.display_name ?? "коллеги"}.`);
  }

  return { ok: true, moved: true };
}
