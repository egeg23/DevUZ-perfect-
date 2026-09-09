import { serviceClient } from "@/lib/supabase";

/**
 * Действия, которые журналируются. Обычный union, не enum: Node запускает
 * наши .ts без компиляции, только срезая типы, и enum — единственная
 * конструкция TypeScript, которая после среза должна была бы оставить
 * код. Он падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX, хотя tsc и next
 * build принимают его молча.
 */
export type AuditAction =
  | "login.requested"
  | "login.succeeded"
  | "login.failed"
  | "logout"
  | "lead.viewed"
  | "lead.taken"
  | "lead.released"
  | "lead.status_changed"
  | "lead.contact_revealed"
  | "lead.auto_reminder_toggled"
  | "reminder.created"
  | "reminder.done"
  | "reminder.sent"
  | "message.posted"
  | "project.created"
  | "project.updated"
  | "project.stage_changed"
  | "staff.invited"
  | "staff.disabled";

/** inet в базе не примет «unknown» — только то, что похоже на адрес. */
function asInet(value: string | null): string | null {
  if (!value) return null;
  const looksLikeIp = /^[0-9.]+$/.test(value) || /^[0-9a-f:]+$/i.test(value);
  return looksLikeIp ? value : null;
}

/**
 * Запись в журнал.
 *
 * Молчит при любой ошибке и никогда не бросает: журнал не должен ронять
 * действие, которое он описывает. Обратное — прямой путь к тому, что
 * первый же сбой журналирования выключает панель целиком.
 *
 * Строку отсюда уже нельзя ни изменить, ни удалить: на таблице стоит
 * триггер, а принадлежит она роли postgres, поэтому его не снимет и наш
 * собственный сервер со service_role.
 */
export async function record(
  action: AuditAction,
  detail: {
    actorStaffId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    meta?: Record<string, unknown>;
    ip?: string | null;
  } = {},
): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  try {
    const { error } = await db.from("audit_events").insert({
      actor_staff_id: detail.actorStaffId ?? null,
      action,
      target_type: detail.targetType ?? null,
      target_id: detail.targetId ?? null,
      meta: detail.meta ?? {},
      ip: asInet(detail.ip ?? null),
    });
    if (error) console.error("audit", action, error.message);
  } catch (error) {
    console.error("audit", action, error);
  }
}
