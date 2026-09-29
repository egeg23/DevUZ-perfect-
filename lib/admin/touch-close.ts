import type { Role } from "@/lib/admin/roles";

/**
 * «Клиент отказался» и «Игнорирует» — правила. База — в outreach-store
 * (closeTouch), кнопки — в «Касаниях» и в боте.
 *
 * Владелец, 29.09: «если лид отказался к примеру, который был в касаниях —
 * сделать кнопку в тг и на сайте — клиент отказался / игнорирует. Чтобы он
 * вылетал из очереди».
 *
 * Закрытое касание уходит отовсюду, где его ещё ждут: бот его больше не
 * дожимает, модель не отвечает, лид закрывается «проиграли» и напоминания
 * по нему снимаются, в «Касаниях» карточка уходит из тех, что в работе.
 * Само касание при этом остаётся сделанным — в порции, в недельном плане и
 * в «двух в час»: написали человеку на самом деле.
 */

export const CLOSE_REASONS = ["refused", "ignored"] as const;
export type CloseReason = (typeof CLOSE_REASONS)[number];

export function isCloseReason(value: string): value is CloseReason {
  return (CLOSE_REASONS as readonly string[]).includes(value);
}

export const CLOSE_TEXT: Record<
  CloseReason,
  {
    /** Кнопка — в панели и в боте одинаково. */
    button: string;
    /** Что стоит на карточке после нажатия. */
    label: string;
    /** Надпись вместо кнопок в боте и ответ под нажатием. */
    done: string;
    /** Причина в карточке лида: «отвечаете вы — …». */
    handover: string;
  }
> = {
  refused: {
    button: "🙅 Клиент отказался",
    label: "клиент отказался",
    done: "🙅 Отказался · убрано из работы",
    handover: "клиент отказался — касание закрыто",
  },
  ignored: {
    button: "🔇 Игнорирует",
    label: "игнорирует",
    done: "🔇 Игнорирует · убрано из работы",
    handover: "клиент не отвечает — касание закрыто",
  },
};

/**
 * Можно ли закрыть: только после того, как написали.
 *
 * «Отказался» до касания не бывает — до него это «не пишем». Письмо в
 * очереди бота («sending») тоже ещё не дошло: сначала пусть уйдёт.
 */
export function canClose(p: { status: string; closed_reason?: string | null }): boolean {
  return p.status === "sent" && !p.closed_reason;
}

/**
 * Кто вправе: тот, кто касание ведёт, — и руководитель с владельцем.
 *
 * Ведёт — кто написал (touched_by), за кем карточка (claimed_by; после
 * передачи лида она переходит новому хозяину) и кто нажал «Отвечать самому»
 * (handled_by).
 */
export function mayClose(
  p: { claimed_by: string | null; touched_by: string | null; handled_by?: string | null },
  staff: { id: string; role: Role },
): boolean {
  if (staff.role === "admin" || staff.role === "head") return true;
  return [p.claimed_by, p.touched_by, p.handled_by ?? null].includes(staff.id);
}

/** Лид закрывается, только если он ещё в работе: выигранный отказ касания не отменяет. */
export function closesLead(status: string | null | undefined): boolean {
  return status === "new" || status === "taken";
}

/** Callback кнопки в боте: `tc:refused:<id>`. До 64 байт — uuid помещается. */
export const closeCallback = (reason: CloseReason, prospectId: string): string => `tc:${reason}:${prospectId}`;
