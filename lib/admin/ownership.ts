import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { STATUSES } from "@/lib/admin/leads";
import { serviceClient } from "@/lib/supabase";

/**
 * Через сколько часов после взятия лида напомнить о нём, если менеджер
 * ничего не поменял.
 *
 * Четыре часа, а не сутки: лид, пришедший утром и не тронутый до вечера,
 * к следующему дню уже остыл — человек за это время написал ещё в три
 * места. Напоминание через сутки приходит вовремя только на бумаге.
 */
export const AUTO_REMINDER_HOURS = 4;

export type OwnershipResult =
  | { ok: true }
  | { ok: false; reason: "offline" | "taken" | "forbidden" | "gone" | "failed" };

/**
 * Право менять лид: владелец или админ.
 *
 * Админ здесь не «начальник имеет право на всё», а вполне конкретный
 * случай: менеджер ушёл в отпуск, лид висит за ним, и разгрести это должен
 * кто-то ещё. Каждое такое действие попадает в журнал именем админа.
 */
export function canEdit(
  lead: { assigned_staff_id: string | null },
  staff: Staff,
): boolean {
  if (staff.role === "admin") return true;
  return lead.assigned_staff_id === staff.id;
}

function handleOf(staff: Staff): string {
  return staff.username ? `@${staff.username}` : staff.display_name;
}

// ───────────────────────────────────────────────────────────────────────────
// Взять, отпустить, передать
// ───────────────────────────────────────────────────────────────────────────

/**
 * Взять лида себе.
 *
 * Условие `assigned_staff_id is null` стоит в самом update, а не в
 * отдельной проверке перед ним. Это и есть весь смысл: два менеджера,
 * нажавшие кнопку одновременно, — обычное дело в первые минуты после
 * горячего лида, и «прочитать, потом записать» отдало бы лида обоим.
 * Здесь проигравший получает честное «уже взят», а не молчаливую перезапись
 * чужого имени.
 */
export async function takeLead(leadId: string, staff: Staff, ip: string): Promise<OwnershipResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("leads")
    .update({
      assigned_staff_id: staff.id,
      assigned_to: handleOf(staff),
      assigned_at: now,
      status: "taken",
    })
    .eq("id", leadId)
    .is("assigned_staff_id", null)
    .select("id, auto_reminder")
    .maybeSingle();

  if (error) {
    console.error("admin: не взял лида", error.message);
    return { ok: false, reason: "failed" };
  }
  if (!data) return { ok: false, reason: "taken" };

  await record("lead.taken", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
  });

  // Автонапоминание ставится сразу, а не когда-нибудь потом: смысл его в
  // том, чтобы взятый и забытый лид всплыл сам.
  if (data.auto_reminder !== false) {
    await createReminder(leadId, staff, {
      dueAt: new Date(Date.now() + AUTO_REMINDER_HOURS * 3600_000).toISOString(),
      kind: "auto",
      note: "Взят в работу — что дальше?",
      ip,
    });
  }

  return { ok: true };
}

/** Отпустить лида обратно в общую очередь. */
export async function releaseLead(
  leadId: string,
  staff: Staff,
  ip: string,
): Promise<OwnershipResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const lead = await ownerOf(leadId);
  if (!lead) return { ok: false, reason: "gone" };
  if (!canEdit(lead, staff)) return { ok: false, reason: "forbidden" };

  const { error } = await db
    .from("leads")
    .update({
      assigned_staff_id: null,
      assigned_to: null,
      assigned_at: null,
      status: "new",
    })
    .eq("id", leadId);

  if (error) return { ok: false, reason: "failed" };

  // Висящие автонапоминания снимаются вместе с лидом: напоминать человеку
  // о том, что он больше не ведёт, — верный способ научить его не читать
  // напоминания вовсе.
  await cancelAutoReminders(leadId);

  await record("lead.released", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { previous_owner: lead.assigned_staff_id },
  });

  return { ok: true };
}

export async function setStatus(
  leadId: string,
  status: string,
  staff: Staff,
  ip: string,
): Promise<OwnershipResult> {
  if (!(STATUSES as readonly string[]).includes(status)) {
    return { ok: false, reason: "failed" };
  }

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const lead = await ownerOf(leadId);
  if (!lead) return { ok: false, reason: "gone" };
  if (!canEdit(lead, staff)) return { ok: false, reason: "forbidden" };

  const { error } = await db.from("leads").update({ status }).eq("id", leadId);
  if (error) return { ok: false, reason: "failed" };

  // Сделка закрыта в любую сторону — напоминать больше не о чем.
  if (status === "won" || status === "lost" || status === "dropped") {
    await cancelAutoReminders(leadId);
  }

  await record("lead.status_changed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { from: lead.status, to: status },
  });

  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────────────
// Контакт
// ───────────────────────────────────────────────────────────────────────────

export type Contact = { handle: string | null; kind: string | null };

/**
 * Показать контакт клиента.
 *
 * Отдельным действием, а не полем в общем запросе, — именно поэтому в
 * lib/admin/leads.ts контакта нет вовсе. Разница не косметическая: пока
 * контакт приезжает вместе со списком, «кто видел контакты» означает «все,
 * кто открывал панель», и журнал бесполезен. Здесь у каждого раскрытия
 * есть имя, время и лид.
 *
 * Смотреть может только владелец лида или админ.
 */
export async function revealContact(
  leadId: string,
  staff: Staff,
  ip: string,
): Promise<Contact | null> {
  const db = serviceClient();
  if (!db) return null;

  const lead = await ownerOf(leadId);
  if (!lead || !canEdit(lead, staff)) return null;

  const { data } = await db
    .from("leads")
    .select("contact_handle, contact_kind")
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;

  await db
    .from("leads")
    .update({ contact_revealed_at: new Date().toISOString(), contact_revealed_by: staff.id })
    .eq("id", leadId);

  await record("lead.contact_revealed", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
  });

  return {
    handle: (data.contact_handle as string | null) ?? null,
    kind: (data.contact_kind as string | null) ?? null,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Напоминания
// ───────────────────────────────────────────────────────────────────────────

export type Reminder = {
  id: string;
  lead_id: string;
  staff_id: string;
  due_at: string;
  note: string | null;
  kind: string;
  done_at: string | null;
  sent_at: string | null;
};

const REMINDER_COLUMNS = "id, lead_id, staff_id, due_at, note, kind, done_at, sent_at";

export async function createReminder(
  leadId: string,
  staff: Staff,
  options: { dueAt: string; note?: string | null; kind?: "manual" | "auto"; ip?: string },
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  const { error } = await db.from("lead_reminders").insert({
    lead_id: leadId,
    staff_id: staff.id,
    due_at: options.dueAt,
    note: options.note ?? null,
    kind: options.kind ?? "manual",
  });

  if (error) {
    console.error("admin: не поставил напоминание", error.message);
    return false;
  }

  await record("reminder.created", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip: options.ip ?? null,
    meta: { due_at: options.dueAt, kind: options.kind ?? "manual" },
  });
  return true;
}

/** Живые напоминания по лиду — то, что видно в карточке. */
export async function remindersFor(leadId: string): Promise<Reminder[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data } = await db
    .from("lead_reminders")
    .select(REMINDER_COLUMNS)
    .eq("lead_id", leadId)
    .is("cancelled_at", null)
    .order("due_at", { ascending: true });

  return (data ?? []) as unknown as Reminder[];
}

export async function completeReminder(
  reminderId: string,
  staff: Staff,
  ip: string,
): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  // Своё напоминание закрывает менеджер, чужое — только админ.
  let query = db
    .from("lead_reminders")
    .update({ done_at: new Date().toISOString() })
    .eq("id", reminderId)
    .is("done_at", null);

  if (staff.role !== "admin") query = query.eq("staff_id", staff.id);

  const { data, error } = await query.select("id, lead_id").maybeSingle();
  if (error || !data) return false;

  await record("reminder.done", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: data.lead_id as string,
    ip,
  });
  return true;
}

/**
 * Тумблер автонапоминаний у лида.
 *
 * Выключение снимает только автоматические: то, что менеджер поставил
 * руками, система отменять не вправе — он поставил это себе, а не ей.
 */
export async function setAutoReminder(
  leadId: string,
  enabled: boolean,
  staff: Staff,
  ip: string,
): Promise<OwnershipResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const lead = await ownerOf(leadId);
  if (!lead) return { ok: false, reason: "gone" };
  if (!canEdit(lead, staff)) return { ok: false, reason: "forbidden" };

  const { error } = await db
    .from("leads")
    .update({ auto_reminder: enabled })
    .eq("id", leadId);
  if (error) return { ok: false, reason: "failed" };

  if (!enabled) await cancelAutoReminders(leadId);

  await record("lead.auto_reminder_toggled", {
    actorStaffId: staff.id,
    targetType: "lead",
    targetId: leadId,
    ip,
    meta: { enabled },
  });

  return { ok: true };
}

async function cancelAutoReminders(leadId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  await db
    .from("lead_reminders")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("kind", "auto")
    .is("done_at", null)
    .is("sent_at", null)
    .is("cancelled_at", null);
}

// ───────────────────────────────────────────────────────────────────────────

type Owner = { assigned_staff_id: string | null; status: string };

async function ownerOf(leadId: string): Promise<Owner | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("leads")
    .select("assigned_staff_id, status")
    .eq("id", leadId)
    .maybeSingle();

  return (data as Owner | null) ?? null;
}
