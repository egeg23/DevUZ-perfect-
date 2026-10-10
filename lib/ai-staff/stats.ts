import type { Conversation, Lead } from "@/lib/ai-staff/store";

/**
 * Цифры обзора кабинета и панели студии — из разговоров и заявок, без
 * базы. Это и есть отчёт, ради которого платят (research.md, 2.3, п. 7–8):
 * сколько заявок, как быстро ответили, сколько пришло ночью, на что ИИ не
 * знал ответа.
 */

export type Overview = {
  dialogs: number;
  leads: number;
  /** Медиана первого ответа, секунды; null — ответов ещё не было. */
  firstReplySec: number | null;
  offHoursLeads: number;
  unanswered: number;
  /** Доля заявок, дошедших до сделки, среди закрытых (сделка или отказ). */
  wonShare: number | null;
};

export function overview(convs: readonly Conversation[], leads: readonly Lead[], month: string): Overview {
  const counted = convs.filter((c) => c.counted_month === month);
  const times = counted.map((c) => c.first_reply_ms).filter((v): v is number => typeof v === "number").sort((a, b) => a - b);
  const median = times.length ? times[Math.floor((times.length - 1) / 2)] : null;
  const real = leads.filter((l) => !l.test);
  const byConv = new Map(convs.map((c) => [c.id, c]));
  const closed = real.filter((l) => l.status === "won" || l.status === "lost");
  return {
    dialogs: counted.length,
    leads: real.length,
    firstReplySec: median === null ? null : Math.round(median / 100) / 10,
    offHoursLeads: real.filter((l) => (l.conversation_id ? byConv.get(l.conversation_id)?.off_hours : false)).length,
    unanswered: counted.reduce((sum, c) => sum + (c.unanswered ?? 0), 0),
    wonShare: closed.length ? closed.filter((l) => l.status === "won").length / closed.length : null,
  };
}
