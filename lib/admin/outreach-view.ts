import type { Prospect } from "@/lib/admin/outreach-store";

/**
 * Какие карточки «Разобранных сайтов» рисовать сразу.
 *
 * Владелец, 29.09: «у некоторых сотрудников зависает страница в касаниях,
 * когда они копируют текст». Замер на тех же 200 строках: страница весила
 * около 2 МБ (562 формы, 573 кнопки), а на слабом процессоре открывалась
 * 18 секунд с замираниями по 2–4,5 секунды — и так после каждого
 * «Связаться», потому что действие возвращает на эту же страницу. Копирование
 * попадало в замирание, и браузер писал «Страница не отвечает».
 *
 * Поэтому сразу — только то, с чем работают: строки в работе, отправленные
 * за неделю (кроме закрытых «Клиент отказался» / «Игнорирует»), порция дня
 * и открытая карточка. Остальное — по REST_PAGE,
 * кнопкой «Показать ещё».
 */

export const REST_PAGE = 20;
export const SENT_FRESH_DAYS = 7;
/** Потолок `?more=`: больше, чем грузит listProspects, показывать нечего. */
const MORE_CAP = 500;

const IN_WORK: ReadonlySet<Prospect["status"]> = new Set(["contacting", "sending", "manual"]);

/** `?more=` из адреса: сколько карточек из остальных показать. Мусор — REST_PAGE. */
export function parseMore(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < REST_PAGE) return REST_PAGE;
  return Math.min(n, MORE_CAP);
}

export type ProspectView = {
  /** Что рисовать, в исходном порядке списка (новые сверху). */
  shown: Prospect[];
  /** Сколько карточек из «остальных» ещё скрыто. */
  hidden: number;
  /** Первая скрытая карточка — на неё ведёт «Показать ещё», чтобы не листать с начала. */
  nextId: string | null;
};

export function visibleProspects(
  rows: readonly Prospect[],
  options: { keep: ReadonlySet<string>; more: number; now: Date },
): ProspectView {
  const freshSince = options.now.getTime() - SENT_FRESH_DAYS * 24 * 60 * 60 * 1000;
  const pinned = (row: Prospect) =>
    IN_WORK.has(row.status) ||
    options.keep.has(row.id) ||
    // «Клиент отказался» / «Игнорирует» — уже не в работе, сколько бы
    // дней ни прошло: владелец просил, чтобы такие «вылетали из очереди».
    (row.status === "sent" && !row.closed_reason && row.sent_at !== null && Date.parse(row.sent_at) >= freshSince);

  const rest = rows.filter((row) => !pinned(row));
  const restShown = new Set(rest.slice(0, options.more).map((row) => row.id));
  return {
    shown: rows.filter((row) => pinned(row) || restShown.has(row.id)),
    hidden: Math.max(0, rest.length - options.more),
    nextId: rest[options.more]?.id ?? null,
  };
}
