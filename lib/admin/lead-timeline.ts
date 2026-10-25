/**
 * Лента карточки лида: всё, что было с клиентом, одним списком по времени.
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Kommo и Pipedrive»:
 * «Погнали по порядку». До этого разговор с клиентом лежал в трёх блоках —
 * «Первичка по касанию», «Переписка с клиентом», «Обсуждение», — а когда
 * дошли ступени и напоминания, приходилось листать ещё два. Теперь одна
 * лента и одно поле ответа (components/admin/lead-timeline.tsx).
 *
 * Здесь — только раскладка, без базы: что и в каком порядке. Кто что
 * видит, решает страница карточки так же, как раньше решала для каждого
 * блока: переписку касания — тот, за кем лид; напоминания — он же;
 * обсуждение и ступени — все, кто открыл карточку.
 */
import type { TalkLine } from "@/lib/admin/outreach-talk-store";
import type { Deal, Stage } from "@/lib/admin/sales-stages";

/** Заметка команды из бывшего «Обсуждения» (lead_messages): клиенту не уходит. */
export type TimelineNote = {
  id: string;
  author: string;
  admin: boolean;
  own: boolean;
  body: string;
  edited: boolean;
};

/** Отметка в ленте: пришёл лид, дошли до ступени, напоминание. */
export type TimelineEvent =
  | { kind: "created" }
  | { kind: "stage"; stage: Stage; by: string | null }
  | { kind: "reminder"; due: string; note: string | null; done: boolean };

export type TimelineItem =
  | { type: "touch"; id: string; at: string; line: TalkLine }
  | { type: "note"; id: string; at: string; note: TimelineNote }
  | { type: "event"; id: string; at: string; event: TimelineEvent };

/**
 * Ступени, которые в ленте — отдельной строкой. «Написали» и «ответил» —
 * сами реплики касания, их второй раз не повторяем; поздняя ступень, из
 * которой база вывела раннюю, тоже не строка: в ленте только то, что
 * случилось на самом деле (`deal.own`).
 */
export const TIMELINE_STAGES: readonly Stage[] = ["interest", "mockup", "shown", "priced", "paid"];

export function stageEvents(deal: Pick<Deal, "own"> | null): TimelineItem[] {
  if (!deal) return [];
  return TIMELINE_STAGES.flatMap((stage) => {
    const own = deal.own[stage];
    return own ? [{ type: "event" as const, id: `stage:${stage}`, at: own.at, event: { kind: "stage" as const, stage, by: own.by } }] : [];
  });
}

/**
 * Напоминание — строкой на тот день, на который его поставили: закрытое —
 * когда закрыли. Открытое в будущем стоит в конце ленты: «что дальше».
 */
export function reminderEvents(
  reminders: readonly { id: string; due_at: string; note: string | null; done_at: string | null }[],
): TimelineItem[] {
  return reminders.map((r) => ({
    type: "event" as const,
    id: `reminder:${r.id}`,
    at: r.done_at ?? r.due_at,
    event: { kind: "reminder" as const, due: r.due_at, note: r.note, done: Boolean(r.done_at) },
  }));
}

/**
 * Всё вместе по времени, старое сверху — как переписка в мессенджере.
 * Одинаковое время — в том порядке, в каком пришло: реплики касания не
 * перемешиваются между собой.
 */
export function buildTimeline(parts: {
  created: string;
  touch?: readonly TalkLine[];
  notes?: readonly (TimelineNote & { at: string })[];
  events?: readonly TimelineItem[];
}): TimelineItem[] {
  const items: TimelineItem[] = [
    { type: "event", id: "created", at: parts.created, event: { kind: "created" } },
    ...(parts.touch ?? []).map((line) => ({ type: "touch" as const, id: `touch:${line.id}`, at: line.created_at, line })),
    ...(parts.notes ?? []).map(({ at, ...note }) => ({ type: "note" as const, id: `note:${note.id}`, at, note })),
    ...(parts.events ?? []),
  ];
  return items
    .map((item, index) => ({ item, index, ms: Date.parse(item.at) }))
    .sort((a, b) => (Number.isNaN(a.ms) || Number.isNaN(b.ms) ? a.index - b.index : a.ms - b.ms || a.index - b.index))
    .map((x) => x.item);
}

/** Свежие реплики касания (чат спрашивает их сам) — вместо старых, остальное как было. */
export function withTouch(items: readonly TimelineItem[], touch: readonly TalkLine[]): TimelineItem[] {
  const rest = items.filter((item) => item.type !== "touch");
  const created = rest.find((item) => item.type === "event" && item.event.kind === "created")?.at ?? "";
  return buildTimeline({
    created,
    touch,
    notes: rest.flatMap((item) => (item.type === "note" ? [{ ...item.note, at: item.at }] : [])),
    events: rest.filter((item) => item.type === "event" && item.event.kind !== "created"),
  });
}

/**
 * Куда уйдёт ответ из поля под лентой. Клиенту — первым, если есть чем:
 * с рабочего аккаунта касания или от бота студии. Заметка команде — всегда.
 */
export type TimelineChannel = "touch" | "bot" | "note";

export function channelsOf(can: { touch: boolean; bot: boolean }): TimelineChannel[] {
  return [...(can.touch ? (["touch"] as const) : []), ...(can.bot ? (["bot"] as const) : []), "note"];
}
