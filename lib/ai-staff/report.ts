import { TASHKENT_OFFSET_MS } from "@/lib/ai-staff/plans";
import { botToken } from "@/lib/ai-staff/service";
import * as store from "@/lib/ai-staff/store";
import { esc, sendHtml } from "@/lib/ai-staff/telegram";
import { siteUrl } from "@/lib/seo";

/**
 * Отчёт дня владельцу клиента — в Telegram, в 19:00 по Ташкенту.
 *
 * Самое наглядное, за что платят (research.md, 2.3, п. 7–8): сколько
 * покупателей написали, сколько заявок ушло менеджерам, сколько из них
 * пришло в нерабочее время и на какие вопросы ИИ не нашёл ответа в базе —
 * с ссылкой туда, где базу дописать.
 *
 * Дня без разговоров нет в отчёте: пустое сообщение каждый вечер учит
 * не читать бота. Один отчёт в день — по report_sent_on клиента.
 */

export const REPORT_HOUR = 19;

/** Сегодняшняя дата по Ташкенту и начало дня в UTC. */
export function tashkentDay(now: Date): { day: string; start: Date; hour: number } {
  const local = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const day = local.toISOString().slice(0, 10);
  const start = new Date(Date.parse(`${day}T00:00:00Z`) - TASHKENT_OFFSET_MS);
  return { day, start, hour: local.getUTCHours() };
}

export type DayStats = { talks: number; leads: number; offHours: number; unanswered: string[] };

export function dayStats(convs: readonly store.Conversation[], leads: readonly store.Lead[], start: Date): DayStats {
  const since = start.getTime();
  const today = convs.filter((c) => c.kind !== "test" && c.messages.some((m) => m.role === "ai" && m.at && Date.parse(m.at) >= since));
  const unanswered: string[] = [];
  for (const c of today) {
    c.messages.forEach((m, i) => {
      if (m.role !== "ai" || !m.fallback || !m.at || Date.parse(m.at) < since) return;
      const asked = [...c.messages.slice(0, i)].reverse().find((t) => t.role === "customer");
      if (asked) unanswered.push(asked.text.slice(0, 120));
    });
  }
  const byConv = new Map(convs.map((c) => [c.id, c]));
  const real = leads.filter((l) => !l.test && Date.parse(l.created_at) >= since);
  return {
    talks: today.length,
    leads: real.length,
    offHours: real.filter((l) => (l.conversation_id ? byConv.get(l.conversation_id)?.off_hours : false)).length,
    unanswered: unanswered.slice(0, 5),
  };
}

export function reportText(name: string, s: DayStats, lang: "ru" | "uz"): string {
  const lines =
    lang === "uz"
      ? [
          `<b>«${esc(name)}»: bugungi hisobot</b>`,
          `Sun'iy intellekt javob bergan xaridorlar: ${s.talks}`,
          `Menejerlarga topshirilgan arizalar: ${s.leads}${s.offHours ? `, shundan ish vaqtidan tashqari: ${s.offHours}` : ""}`,
        ]
      : [
          `<b>«${esc(name)}»: итоги дня</b>`,
          `Покупателей, которым ответил ИИ: ${s.talks}`,
          `Заявок передано менеджерам: ${s.leads}${s.offHours ? `, из них в нерабочее время: ${s.offHours}` : ""}`,
        ];
  if (s.unanswered.length) {
    lines.push(
      "",
      lang === "uz" ? "Bazada javobi yo'q savollar, ularni qo'shing:" : "Вопросы, на которые не нашлось ответа в базе. Допишите их:",
      ...s.unanswered.map((q) => `• ${esc(q)}`),
    );
  }
  lines.push("", `${siteUrl}/cabinet`);
  return lines.join("\n");
}

/** Проход свипа: до 30 клиентов за раз, только после 19:00 и до полуночи. */
export async function runDailyReports(now = new Date()): Promise<{ sent: number }> {
  if (!(await store.serviceEnabled())) return { sent: 0 };
  const { day, start, hour } = tashkentDay(now);
  if (hour < REPORT_HOUR) return { sent: 0 };
  const token = await botToken();
  if (!token) return { sent: 0 };
  let sent = 0;
  const due = (await store.allTenants()).filter((t) => t.status === "active" && t.report_sent_on !== day && !t.demo).slice(0, 30);
  for (const tenant of due) {
    await store.markReportSent(tenant.id, day);
    const [convs, leads] = await Promise.all([store.conversationsSince(tenant.id, start), store.leadsSince(tenant.id, start)]);
    const stats = dayStats(convs, leads, start);
    if (!stats.talks) continue;
    const text = reportText(tenant.name, stats, tenant.locale);
    for (const member of await store.members(tenant.id)) {
      if (member.role === "owner" && (await sendHtml(token, member.telegram_user_id, text))) sent++;
    }
  }
  return { sent };
}
