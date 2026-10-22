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
 * Здесь — правила без базы; удаление — lead-trash-store.ts.
 */

export const TRASH_ROLES = ["admin", "head"] as const;

export function canTrash(role: string): boolean {
  return (TRASH_ROLES as readonly string[]).includes(role);
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
