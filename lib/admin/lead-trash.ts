/**
 * «🗑 Мусор» под карточкой лида в боте.
 *
 * Владелец, 22.10.2026: «Добавь руководителям и мне кнопку в боте на
 * лидах — мусор. Чтобы мы могли удалить и лид убрался из очереди». Повод —
 * заявки, которые лидами не были: сотрудник написал боту, спам, проверка.
 *
 * Кнопка — только владельцу и руководителю, и только в их личке: менеджеру
 * её не видно, а чужое нажатие сервер не примет. Лид удаляется из базы
 * целиком, вместе с предложениями очереди и копиями карточки; в журнале
 * остаётся строка `lead.trashed` — кто, когда и какой номер заявки.
 *
 * Владелец, 03.11.2026: «открой менеджерам кнопку „мусор“, чтобы лиды не
 * попадали в общую очередь». Менеджеру — тоже, но не на всё: ничей лид
 * (общая очередь, без хозяина) и свой. Чужой лид менеджер не удаляет.
 * Каждое его «Мусор» владелец и руководитель видят строкой в боте (днём) и в
 * журнале — с тем, что было в лиде, раз сам лид удалён.
 *
 * Здесь — правила без базы; удаление — lead-trash-store.ts.
 */

/** Удаляют любой лид. */
export const TRASH_ROLES = ["admin", "head"] as const;
/** Кнопка под карточкой лида в личке бота: всем, кому приходят карточки. */
export const TRASH_BUTTON_ROLES = ["admin", "head", "manager"] as const;

/** Полные права: владелец и руководитель. */
export function canTrash(role: string): boolean {
  return (TRASH_ROLES as readonly string[]).includes(role);
}

/** Кнопка вообще есть у этой роли (что именно можно — решает mayTrash по лиду). */
export function seesTrash(role: string): boolean {
  return (TRASH_BUTTON_ROLES as readonly string[]).includes(role);
}

/**
 * Можно ли этому человеку удалить этот лид: владелец и руководитель — любой,
 * менеджер — ничей (в общей очереди) или свой.
 */
export function mayTrash(staff: { id: string; role: string }, lead: { assigned_staff_id: string | null }): boolean {
  if (canTrash(staff.role)) return true;
  if (staff.role !== "manager") return false;
  return lead.assigned_staff_id === null || lead.assigned_staff_id === staff.id;
}

/** Строка владельцу и руководителю, когда «Мусор» нажал менеджер. */
export function managerTrashLine(
  who: { username: string | null; display_name: string },
  lead: { request_no: string | null; label: string; words: string | null },
): string {
  const name = who.username ? `@${who.username}` : who.display_name;
  const no = lead.request_no ? ` ${lead.request_no}` : "";
  const words = lead.words ? `\n«${lead.words.slice(0, 160)}»` : "";
  return `🗑 ${name} убрал лид как мусор${no}: ${lead.label}${words}`;
}

export const TRASH_BUTTON = "🗑 Мусор";

export function trashCallback(leadId: string): string {
  return `trash:${leadId}`;
}

/** Надпись вместо кнопок у всех копий карточки. */
export function trashedLabel(staff: { username: string | null; display_name: string }): string {
  const who = staff.username ? `@${staff.username}` : staff.display_name;
  return `🗑 Удалён как мусор — ${who}`;
}
