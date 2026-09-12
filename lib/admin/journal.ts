import { AUDIT_ACTIONS, type AuditAction } from "@/lib/admin/audit";
import { serviceClient } from "@/lib/supabase";

/**
 * Чтение журнала.
 *
 * Писать в audit_events умеет весь код панели, а читать до этого модуля
 * умел только тот, кто откроет SQL-редактор. Журнал, в который нельзя
 * заглянуть из панели, доказывает ровно столько же, сколько его
 * отсутствие: им никто не пользуется, пока не случится разбор, а на
 * разборе выясняется, что читать его некому и нечем.
 */

/** Человеческие подписи. Ключи те же, что и в AUDIT_ACTIONS. */
export const ACTION_LABEL: Record<AuditAction, string> = {
  "login.requested": "запросил ссылку входа",
  "login.succeeded": "вошёл в панель",
  "login.failed": "неудачный вход",
  logout: "вышел",
  "lead.viewed": "открыл карточку лида",
  "lead.taken": "взял лида",
  "lead.released": "отпустил лида",
  "lead.status_changed": "сменил статус лида",
  "lead.contact_revealed": "открыл контакт клиента",
  "lead.transcript_viewed": "прочитал переписку",
  "lead.auto_reminder_toggled": "переключил автонапоминание",
  "reminder.created": "поставил напоминание",
  "reminder.done": "закрыл напоминание",
  "reminder.sent": "напоминание отправлено",
  "message.posted": "написал в обсуждение",
  "project.created": "завёл проект",
  "project.updated": "поправил проект",
  "project.stage_changed": "сменил стадию проекта",
  "order.status_changed": "сменил статус заявки",
  "order.invoiced": "выставил счёт",
  "order.paid": "подтвердил оплату",
  "order.delivered": "отметил передачу кода",
  "order.cancelled": "отменил заявку",
  "order.reopened": "вернул заявку в работу",
  "order.amount_set": "проставил сумму сделки",
  "order.link_reissued": "перевыпустил ссылку покупателя",
  "release.published": "выложил релиз продукта",
  "download.served": "покупатель скачал файл",
  "download.refused": "выдача файла отклонена",
  "entitlement.revoked": "отозвал доступ к файлам",
  "order.nudged": "свип напомнил о заявке",
  "signal.status_changed": "разобрал сигнал поиска",
  "staff.invited": "завёл сотрудника",
  "staff.disabled": "отключил сотрудника",
  "staff.role_changed": "сменил роль сотрудника",
};

/**
 * Действия, которые видно и без разбора: раскрытие контакта, чтение
 * переписки, всё про сотрудников. Экран подсвечивает их отдельно —
 * не потому, что остальные не важны, а потому, что журнал листают
 * сверху вниз и глазами, и без подсветки чувствительное теряется
 * в потоке входов и просмотров.
 */
export const SENSITIVE: ReadonlySet<string> = new Set([
  "entitlement.revoked",
  "order.paid",
  "order.link_reissued",
  "lead.contact_revealed",
  "lead.transcript_viewed",
  "login.failed",
  "staff.invited",
  "staff.disabled",
  "staff.role_changed",
]);

export type JournalEntry = {
  id: number;
  created_at: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  actor_staff_id: string | null;
  actor: string;
};

export type JournalFilter = {
  actor?: string;
  action?: string;
  limit?: number;
  offset?: number;
};

export type JournalPage = {
  rows: JournalEntry[];
  total: number;
  /** База не настроена — это не «журнал пуст», и путать их нельзя. */
  offline: boolean;
};

export async function readJournal(filter: JournalFilter = {}): Promise<JournalPage> {
  const db = serviceClient();
  if (!db) return { rows: [], total: 0, offline: true };

  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  let query = db
    .from("audit_events")
    .select(
      "id, created_at, actor_staff_id, action, target_type, target_id, meta, ip, staff:actor_staff_id (display_name, username)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Значения фильтров приходят из строки запроса, то есть из рук кого
  // угодно, и сверяются со списком, а не подставляются как есть.
  if (filter.action && (AUDIT_ACTIONS as readonly string[]).includes(filter.action)) {
    query = query.eq("action", filter.action);
  }
  if (filter.actor) {
    query = filter.actor === "system"
      // Часть событий совершает не человек, а свип напоминаний. Отдельный
      // фильтр нужен ровно затем, чтобы отличить «сделала система» от
      // «сделал кто-то, и мы не знаем кто» — второго быть не должно.
      ? query.is("actor_staff_id", null)
      : query.eq("actor_staff_id", filter.actor);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("admin: не прочитал журнал", error.message);
    return { rows: [], total: 0, offline: false };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const staff = row.staff as { display_name?: string; username?: string | null } | null;
    return {
      id: row.id as number,
      created_at: row.created_at as string,
      action: row.action as string,
      target_type: (row.target_type as string | null) ?? null,
      target_id: (row.target_id as string | null) ?? null,
      meta: (row.meta as Record<string, unknown>) ?? {},
      ip: (row.ip as string | null) ?? null,
      actor_staff_id: (row.actor_staff_id as string | null) ?? null,
      actor: staff?.display_name ?? "система",
    };
  });

  return { rows, total: count ?? rows.length, offline: false };
}
