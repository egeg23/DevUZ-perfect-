import { money } from "@/lib/ads/negatives";
import { accountsOf, actionsOf, connectorFor, markReportSent, membersOf, proposalsOf, type Account, type Action, type Workspace } from "@/lib/ads/store";
import type { Campaign } from "@/lib/ads/types";

/**
 * Недельный отчёт — простыми словами, в Telegram каждому в кабинете.
 *
 * Понедельник, после 09:00 по Ташкенту, один раз в неделю на кабинет. Что в
 * нём: сколько потрачено и сколько заявок за неделю против прошлой, цена
 * заявки, что автопилот сделал (и сколько денег в месяц отрезано
 * минус-словами), сколько предложений ждут решения. Без «CTR» и «ROAS»:
 * маркетолог перешлёт его владельцу бизнеса как есть.
 */

export type WeekNumbers = { cost: number; conversions: number; prevCost: number; prevConversions: number };

export function weekNumbers(thisWeek: Campaign[], lastWeek: Campaign[]): WeekNumbers {
  const sum = (list: Campaign[], key: "cost" | "conversions") => list.reduce((s, c) => s + c[key], 0);
  return { cost: sum(thisWeek, "cost"), conversions: sum(thisWeek, "conversions"), prevCost: sum(lastWeek, "cost"), prevConversions: sum(lastWeek, "conversions") };
}

/** Сколько в месяц отрезали минус-слова, применённые за неделю (и не откаченные). */
export function savedMonthly(actions: Action[], numbersOf: (proposalId: number) => number): number {
  return actions
    .filter((a) => a.kind === "negatives" && a.rollback_of === null && !a.rolled_back_at && a.proposal_id)
    .reduce((s, a) => s + numbersOf(a.proposal_id!), 0);
}

export function reportText(input: {
  locale: "ru" | "uz";
  account: Pick<Account, "name" | "external_id" | "currency">;
  week: WeekNumbers | null;
  applied: number;
  saved: number;
  waiting: number;
}): string {
  const { week, currency } = { week: input.week, currency: input.account.currency };
  const m = (n: number) => money(n, currency, input.locale);
  const cpa = (cost: number, conv: number) => (conv > 0 ? m(cost / conv) : "—");
  const name = input.account.name || input.account.external_id;
  if (input.locale === "uz") {
    return [
      `<b>«${name}»: hafta hisoboti</b>`,
      week
        ? `Sarflandi: ${m(week.cost)} (o‘tgan hafta ${m(week.prevCost)}). Arizalar: ${week.conversions} (o‘tgan hafta ${week.prevConversions}). Bitta ariza narxi: ${cpa(week.cost, week.conversions)} (edi ${cpa(week.prevCost, week.prevConversions)}).`
        : "Hafta raqamlarini olib bo‘lmadi.",
      `Avtopilot qo‘llagan o‘zgarishlar: ${input.applied}.` + (input.saved > 0 ? ` Minus-so‘zlar oyiga taxminan ${m(input.saved)} ni keraksiz so‘rovlardan saqlaydi.` : ""),
      input.waiting ? `Qaroringizni kutmoqda: ${input.waiting}.` : "Kutayotgan takliflar yo‘q.",
    ].join("\n");
  }
  return [
    `<b>«${name}»: итоги недели</b>`,
    week
      ? `Потрачено: ${m(week.cost)} (неделей раньше ${m(week.prevCost)}). Заявок: ${week.conversions} (было ${week.prevConversions}). Цена заявки: ${cpa(week.cost, week.conversions)} (была ${cpa(week.prevCost, week.prevConversions)}).`
      : "Цифры недели забрать не удалось.",
    `Изменений применено: ${input.applied}.` + (input.saved > 0 ? ` Минус-слова больше не пускают деньги на мусорные запросы: около ${m(input.saved)} в месяц.` : ""),
    input.waiting ? `Ждут вашего решения: ${input.waiting}.` : "Нерешённых предложений нет.",
  ].join("\n");
}

/** Пора ли: понедельник, 09:00+ по Ташкенту, и на этой неделе ещё не отправляли. */
export function reportDue(now: Date, lastReportAt: string | null): boolean {
  const local = new Date(now.getTime() + 5 * 3600_000);
  if (local.getUTCDay() !== 1 || local.getUTCHours() < 9) return false;
  if (!lastReportAt) return true;
  return now.getTime() - Date.parse(lastReportAt) > 6 * 24 * 3600_000;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function sendWeeklyReports(now: Date, workspaces: Workspace[]): Promise<number> {
  let sent = 0;
  for (const ws of workspaces) {
    if (!reportDue(now, ws.last_report_at)) continue;
    const members = (await membersOf(ws.id)).filter((m) => m.notify);
    const parts: string[] = [];
    for (const account of await accountsOf(ws.id)) {
      if (account.status === "disconnected") continue;
      parts.push(await accountReport(account, ws.locale, now));
    }
    // Отметка — до отправки: сбой Telegram не должен превратить отчёт в рассылку каждые пять минут.
    await markReportSent(ws.id, now);
    if (!parts.length || !members.length) continue;
    const { sendMessage } = await import("@/lib/qualify/telegram");
    for (const member of members) await sendMessage(member.telegram_user_id, parts.join("\n\n"));
    sent += 1;
  }
  return sent;
}

export async function accountReport(account: Account, locale: "ru" | "uz", now: Date): Promise<string> {
  const day = 24 * 3600_000;
  const connector = await connectorFor(account);
  let week: WeekNumbers | null = null;
  if (connector) {
    try {
      const [thisWeek, lastWeek] = await Promise.all([
        connector.campaigns({ from: iso(new Date(now.getTime() - 7 * day)), to: iso(new Date(now.getTime() - day)) }),
        connector.campaigns({ from: iso(new Date(now.getTime() - 14 * day)), to: iso(new Date(now.getTime() - 8 * day)) }),
      ]);
      week = weekNumbers(thisWeek, lastWeek);
    } catch {
      week = null;
    }
  }
  const since = now.getTime() - 7 * day;
  const actions = (await actionsOf(account.id, 200)).filter((a) => Date.parse(a.at) >= since);
  const applied = await proposalsOf(account.id, ["applied"], 200);
  const monthly = new Map(applied.map((p) => [p.id, Number(p.numbers.monthly ?? 0)]));
  return reportText({
    locale,
    account,
    week,
    applied: actions.filter((a) => a.rollback_of === null && !a.rolled_back_at).length,
    saved: savedMonthly(actions, (id) => monthly.get(id) ?? 0),
    waiting: (await proposalsOf(account.id, ["new"])).length,
  });
}
