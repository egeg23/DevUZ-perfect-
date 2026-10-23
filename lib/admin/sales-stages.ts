/**
 * Ступени продажи — честный счёт (CLAUDE.md, «Ступени продажи»).
 *
 * Владелец, 17.10.2026: «Делаем все по твоим рекомендациям, они правдивые».
 * За 30 дней в базе 886 «лидов» и 0 «Выиграли»: лидом считалось почти каждое
 * касание, и число ничего не говорило. Настоящая воронка с 07.10: 453
 * «Здравствуйте» → 206 ответили; 188 получили кружок → 63 ответили после
 * него; 5 «+»; 41 макет за 30 дней → 0 оплат.
 *
 * Здесь — ступени каждой компании и лида по факту из базы:
 *
 *   написали → ответил → интерес → макет → показ → цена названа → оплата
 *
 * - **написали** — ушло «Здравствуйте» или касание (только наши касания;
 *   клиент, который пришёл сам, этой ступени не проходит);
 * - **ответил** — живой входящий ответ (`prospects.replied_at`); заявка с
 *   сайта, из чата или бота — сама по себе ответ;
 * - **интерес** — «+» и просьба прототипа (`proto_requested_at`), лид
 *   автопрогона по согласию, «позвоните» или «пришлите» (LEAD_ON — тогда
 *   ставится `autopilot_replied_at`), заявка, которую клиент оставил сам
 *   или менеджер завёл руками, или отметка «Есть интерес»;
 * - **макет** — первая отправка ссылки на макет (`mockup_offers.sent_at`);
 * - **показ** — отметка «Показал макет» (по видео или вживую): сама база
 *   этого не знает, отмечает человек;
 * - **цена названа** — исходящее с kind = 'price' (строка цены после «+») или
 *   отметка «Назвал цену» с суммой;
 * - **оплата** — платёж по проекту из лида (`project_payments`) или статус
 *   «Выиграли».
 *
 * Дошёл до поздней ступени — прошёл и ранние: макет без записанного ответа
 * всё равно значит, что клиент отвечал. Такая ступень получает время самой
 * ранней из поздних, но в зачёт человеку не идёт — только то, что сделано на
 * самом деле (`own`).
 *
 * Только арифметика над строками из базы, без запросов и без модели: одни и
 * те же строки дают одни и те же числа (tests/sales-stages.test.ts). Строки
 * собирает lib/admin/sales-stages-store.ts.
 */

import { trendOf, type Trend } from "@/lib/admin/hq";
import { TASHKENT_OFFSET_MS, periodStart, tashkentDate, tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";

const DAY_MS = 24 * 3600_000;

export const STAGES = ["written", "replied", "interest", "mockup", "shown", "priced", "paid"] as const;
export type Stage = (typeof STAGES)[number];

/** Ступени, которые отмечает человек. «Показ» база сама не узнает никогда. */
export const MARK_KINDS = ["interest", "shown", "priced"] as const;
export type MarkKind = (typeof MARK_KINDS)[number];
export const SHOWN_VIA = ["video", "live"] as const;
export type ShownVia = (typeof SHOWN_VIA)[number];

/** Заявки, которые клиент оставил сам или менеджер завёл руками: это уже ответ и интерес. */
export const INBOUND_SOURCES: readonly string[] = ["chat", "form", "telegram", "manual"];

/** Сколько дней смотрим назад: «за 30 дней» и «7 против 7 до них» помещаются. */
export const STAGES_DAYS = 30;

/** Норма менеджера — показов макета в неделю (с понедельника). */
export const SHOW_NORM = 2;
/** С этого дня недели (5 — пятница) ноль показов — «горит». */
export const SHOW_HOT_WEEKDAY = 5;

/* ── Строки из базы ──────────────────────────────────────────────────── */

export type StageProspect = {
  id: string;
  label: string;
  status: string;
  touched_by: string | null;
  touched_at: string | null;
  handled_by?: string | null;
  claimed_by?: string | null;
  sent_at: string | null;
  hello_at: string | null;
  replied_at: string | null;
  proto_requested_at: string | null;
  autopilot_replied_at: string | null;
  lead_id: string | null;
};

export type StageLead = {
  id: string;
  created_at: string;
  source: string | null;
  status: string;
  assigned_staff_id: string | null;
  label: string;
};

export type StageMockup = {
  lead_id: string | null;
  prospect_id: string | null;
  sent_at: string;
  /**
   * Кому — для макета без лида и касания (так их часто находит скан макетов):
   * такой макет — своя строка по клиенту, иначе ступень «макет» занижена.
   */
  client?: string | null;
  /** «p:<id>» или «s:<проект>» — ведёт к строке в «Макетах». */
  ref?: string | null;
};

export type StageMark = {
  kind: MarkKind;
  lead_id: string | null;
  prospect_id: string | null;
  staff_id: string | null;
  created_at: string;
  via?: string | null;
  amount_usd?: number | null;
};

/** Строка цены после «+»: исходящее outreach_messages с kind = 'price'. */
export type StagePrice = { lead_id: string | null; prospect_id: string | null; at: string };

/** Платёж по проекту, у которого есть лид. */
export type StagePayment = { lead_id: string; paid_on: string; amount_usd: number };

/** «Выиграли» по журналу смены статуса. */
export type StageWin = { lead_id: string; at: string; by: string | null };

export type StageInput = {
  prospects: readonly StageProspect[];
  leads: readonly StageLead[];
  mockups: readonly StageMockup[];
  marks: readonly StageMark[];
  prices: readonly StagePrice[];
  payments: readonly StagePayment[];
  wins: readonly StageWin[];
};

/* ── Сделка: компания или лид со своими ступенями ────────────────────── */

export type Deal = {
  /** «p:<касание>» или «l:<лид>»: одна компания — одна строка. */
  key: string;
  prospectId: string | null;
  leadId: string | null;
  label: string;
  /** Чья: хозяин лида, иначе кто ведёт касание — как mineReply на «Главной» менеджера. */
  ownerId: string | null;
  /** Когда дошла до ступени — с теми, что следуют из поздних. */
  at: Partial<Record<Stage, string>>;
  /** Ступени, записанные на самом деле, и кто их сделал. */
  own: Partial<Record<Stage, { at: string; by: string | null }>>;
  /** Поступило по проекту из лида, $. Видит только владелец. */
  paidUsd: number;
  /** Названная цена, $, — последняя отметка «Назвал цену». */
  priceUsd: number | null;
  /** Макет без лида и касания — его строка в «Макетах». */
  mockupRef?: string | null;
};

const ms = (at: string | null | undefined) => (at ? Date.parse(at) : Number.NaN);
const valid = (at: string | null | undefined): at is string => Number.isFinite(ms(at));

/** Касание ушло: «Здравствуйте», письмо автопрогона или касание человека. Неудавшееся — нет. */
export function writtenAt(p: StageProspect): string | null {
  if (p.status === "failed") return null;
  const first = [p.hello_at, p.sent_at, p.touched_by ? p.touched_at : null].filter(valid).sort((a, b) => ms(a) - ms(b))[0];
  return first ?? null;
}

/** Оплата по дате без времени — полдень по Ташкенту, чтобы день не съезжал. */
const paidAt = (day: string) => new Date(tashkentMidnight(day).getTime() + 12 * 3600_000).toISOString();

export function dealsOf(input: StageInput): Deal[] {
  const deals = new Map<string, Deal>();
  const leadToProspect = new Map<string, string>();
  for (const p of input.prospects) if (p.lead_id) leadToProspect.set(p.lead_id, p.id);
  const leadById = new Map(input.leads.map((l) => [l.id, l]));
  const prospectById = new Map(input.prospects.map((p) => [p.id, p]));

  const keyOf = (prospectId: string | null, leadId: string | null): string | null => {
    if (prospectId) return `p:${prospectId}`;
    if (leadId) return leadToProspect.has(leadId) ? `p:${leadToProspect.get(leadId)}` : `l:${leadId}`;
    return null;
  };
  const deal = (prospectId: string | null, leadId: string | null): Deal | null => {
    const key = keyOf(prospectId, leadId);
    if (!key) return null;
    let d = deals.get(key);
    if (!d) {
      d = {
        key,
        prospectId: key.startsWith("p:") ? key.slice(2) : null,
        leadId: leadId ?? null,
        label: "",
        ownerId: null,
        at: {},
        own: {},
        paidUsd: 0,
        priceUsd: null,
      };
      deals.set(key, d);
    }
    if (!d.leadId && leadId) d.leadId = leadId;
    return d;
  };
  /** Записать ступень: самое раннее время; кто — у самого раннего. */
  const put = (d: Deal | null, stage: Stage, at: string | null | undefined, by: string | null) => {
    if (!d || !valid(at)) return;
    const cur = d.own[stage];
    if (!cur || ms(at) < ms(cur.at)) d.own[stage] = { at, by };
  };

  for (const p of input.prospects) {
    const d = deal(p.id, p.lead_id);
    if (!d) continue;
    d.label = p.label;
    put(d, "written", writtenAt(p), p.touched_by);
    put(d, "replied", p.replied_at, null);
    put(d, "interest", p.proto_requested_at, null);
    // Лид автопрогона заводится только по согласию, «позвоните», «пришлите»
    // (LEAD_ON) или когда модель отпустила разговор — тогда стоит эта метка.
    if (p.lead_id) put(d, "interest", p.autopilot_replied_at, null);
  }
  for (const l of input.leads) {
    const d = deal(null, l.id);
    if (!d) continue;
    if (!d.label) d.label = l.label;
    if (l.source && INBOUND_SOURCES.includes(l.source)) {
      put(d, "replied", l.created_at, null);
      put(d, "interest", l.created_at, null);
    }
  }
  for (const m of input.mockups) {
    if (m.prospect_id || m.lead_id) {
      put(deal(m.prospect_id, m.lead_id), "mockup", m.sent_at, null);
      continue;
    }
    const who = (m.client ?? "").trim() || m.ref || "";
    if (!who) continue;
    const key = `m:${who.toLowerCase()}`;
    let d = deals.get(key);
    if (!d) {
      d = { key, prospectId: null, leadId: null, label: who, ownerId: null, at: {}, own: {}, paidUsd: 0, priceUsd: null, mockupRef: m.ref ?? null };
      deals.set(key, d);
    }
    put(d, "mockup", m.sent_at, null);
  }
  for (const p of input.prices) put(deal(p.prospect_id, p.lead_id), "priced", p.at, null);
  for (const w of input.wins) put(deal(null, w.lead_id), "paid", w.at, w.by);
  for (const pay of input.payments) {
    const d = deal(null, pay.lead_id);
    if (!d) continue;
    d.paidUsd += Number(pay.amount_usd) || 0;
    put(d, "paid", paidAt(pay.paid_on), null);
  }
  const marks = [...input.marks].sort((a, b) => ms(a.created_at) - ms(b.created_at));
  for (const m of marks) {
    const d = deal(m.prospect_id, m.lead_id);
    put(d, m.kind, m.created_at, m.staff_id);
    if (d && m.kind === "priced" && m.amount_usd) d.priceUsd = Number(m.amount_usd);
  }

  for (const d of deals.values()) {
    const lead = d.leadId ? leadById.get(d.leadId) : undefined;
    const prospect = d.prospectId ? prospectById.get(d.prospectId) : undefined;
    d.ownerId = lead?.assigned_staff_id ?? prospect?.handled_by ?? prospect?.claimed_by ?? prospect?.touched_by ?? null;
    if (!d.label) d.label = lead?.label ?? (d.leadId ?? d.prospectId ?? "").slice(0, 8);
    // Кто сделал: отмеченное — кто отметил, остальное — чья сделка.
    for (const s of STAGES) {
      const o = d.own[s];
      if (o && !o.by) o.by = s === "written" && prospect?.touched_by ? prospect.touched_by : d.ownerId;
    }
    // Поздняя ступень подразумевает ранние. «Написали» — только наши касания.
    let later: string | null = null;
    for (let i = STAGES.length - 1; i >= 0; i -= 1) {
      const s = STAGES[i];
      const own = d.own[s]?.at ?? null;
      const at = own ?? (s === "written" ? null : later);
      if (at) d.at[s] = at;
      if (own && (!later || ms(own) < ms(later))) later = own;
    }
  }
  return [...deals.values()];
}

/* ── Счёт по периодам ───────────────────────────────────────────────── */

const inWindow = (at: string | undefined, from: number, to: number) => valid(at) && ms(at) >= from && ms(at) < to;

/** Сколько сделок дошло до каждой ступени за период [from, to). */
export function stageCounts(deals: readonly Deal[], from: number, to: number): Record<Stage, number> {
  const out = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const d of deals) for (const s of STAGES) if (inWindow(d.at[s], from, to)) out[s] += 1;
  return out;
}

/** Переход между соседними ступенями: из `base`, дошедших до `from` за период, до `to` дошли `reached` (к сегодняшнему дню). */
export type StageStep = { from: Stage; to: Stage; base: number; reached: number };

export function stepsOf(deals: readonly Deal[], from: number, to: number): StageStep[] {
  return STAGES.slice(0, -1).map((s, i) => {
    const next = STAGES[i + 1];
    const base = deals.filter((d) => inWindow(d.at[s], from, to));
    return { from: s, to: next, base: base.length, reached: base.filter((d) => valid(d.at[next])).length };
  });
}

/** Сколько отвалилось между соседними ступенями. */
export function dropOf(step: StageStep): number {
  return Math.max(0, step.base - step.reached);
}

/** Сделки ступени за период — для списка, свежие сверху. */
export function stageList(deals: readonly Deal[], stage: Stage, from: number, to: number): Deal[] {
  return deals
    .filter((d) => inWindow(d.at[stage], from, to))
    .sort((a, b) => ms(b.at[stage]) - ms(a.at[stage]));
}

export type StagesPeriod = "7" | "prev7" | "30" | "week";
export const STAGES_PERIODS: readonly StagesPeriod[] = ["7", "prev7", "30", "week"];

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}
export function isStagesPeriod(v: unknown): v is StagesPeriod {
  return typeof v === "string" && (STAGES_PERIODS as readonly string[]).includes(v);
}

/** Понедельник 00:00 этой недели по Ташкенту — момент времени. */
export function weekStartOf(now: Date): number {
  return tashkentMidnight(periodStart("week", now)).getTime();
}

/** Границы периода: «7» — последние 7 × 24 часа, «prev7» — 7 до них, «30», «week» — с понедельника. */
export function periodRange(period: StagesPeriod, now: Date): { from: number; to: number } {
  const end = now.getTime() + 1;
  switch (period) {
    case "7":
      return { from: end - 7 * DAY_MS, to: end };
    case "prev7":
      return { from: end - 14 * DAY_MS, to: end - 7 * DAY_MS };
    case "30":
      return { from: end - STAGES_DAYS * DAY_MS, to: end };
    case "week":
      return { from: weekStartOf(now), to: end };
  }
}

/** Куда ведёт число ступени: список компаний и лидов этой ступени за период. */
export function stageHref(stage: Stage, period: StagesPeriod, owner?: string | null): string {
  return `/admin/stages?stage=${stage}&period=${period}${owner ? `&owner=${owner}` : ""}`;
}

/** Где открыть сделку: лид — его карточка, касание — его строка. */
export function dealHref(d: Pick<Deal, "leadId" | "prospectId" | "mockupRef">): string {
  if (d.leadId) return `/admin/leads/${d.leadId}`;
  if (!d.prospectId) return d.mockupRef ? `/admin/mockups#mockup-${d.mockupRef.replace(/[^a-z0-9-]/gi, "-")}` : "/admin/mockups";
  return `/admin/prospect?open=${d.prospectId}#p-${d.prospectId}`;
}

/* ── Блок «Ступени продажи» на «Главной» ─────────────────────────────── */

export type StagesPulse = {
  trend: Record<Stage, Trend>;
  month: Record<Stage, number>;
  steps30: StageStep[];
  /** Поступило по сделкам, дошедшим до оплаты за 30 дней, $; null — не владельцу. */
  paidUsd30: number | null;
};

/** Деньги — только владельцу: руководитель долю студии не видит (seesHqMoney). */
export function seesStagesMoney(role: Role): boolean {
  return role === "admin";
}

export function stagesPulse(deals: readonly Deal[], role: Role, now: Date): StagesPulse {
  const trend = Object.fromEntries(STAGES.map((s) => [s, trendOf(deals.map((d) => d.at[s]), now)])) as Record<Stage, Trend>;
  const { from, to } = periodRange("30", now);
  return {
    trend,
    month: stageCounts(deals, from, to),
    steps30: stepsOf(deals, from, to),
    paidUsd30: seesStagesMoney(role)
      ? deals.filter((d) => inWindow(d.at.paid, from, to)).reduce((s, d) => s + d.paidUsd, 0)
      : null,
  };
}

/** Убрать деньги из сделок для того, кому они не положены. */
export function withoutMoney(deals: readonly Deal[], role: Role): Deal[] {
  if (seesStagesMoney(role)) return [...deals];
  return deals.map((d) => ({ ...d, paidUsd: 0, priceUsd: null }));
}

/* ── Человек: показы, цены, оплаты и норма ───────────────────────────── */

export type PersonSales = { shown: number; priced: number; paid: number };

/** Что человек сделал сам за период: показы, названные цены, оплаты. */
export function personSales(deals: readonly Deal[], staffId: string, from: number, to: number): PersonSales {
  const count = (s: Stage) => deals.filter((d) => d.own[s]?.by === staffId && inWindow(d.own[s]?.at, from, to)).length;
  return { shown: count("shown"), priced: count("priced"), paid: count("paid") };
}

/** Мои ступени за период: по сделкам, которые ведёт этот человек. */
export function myDeals(deals: readonly Deal[], staffId: string): Deal[] {
  return deals.filter((d) => d.ownerId === staffId || STAGES.some((s) => d.own[s]?.by === staffId && (s === "shown" || s === "priced")));
}

export type ShowNorm = { done: number; target: number; hot: boolean };

/** Норма «2 показа в неделю»: с пятницы ноль показов — горит. */
export function showNorm(shows: number, now: Date): ShowNorm {
  const weekday = tashkentDate(now).weekday;
  return { done: shows, target: SHOW_NORM, hot: shows === 0 && weekday >= SHOW_HOT_WEEKDAY };
}

/* ── Понедельник 10:00: кто за прошлую неделю не показал ни одного макета ─ */

export const NO_SHOW_HOUR = 10;
/** Позже — уже не утро понедельника: строка ждёт следующей недели. */
export const NO_SHOW_LATEST_HOUR = 19;

/** Пора ли слать недельную строку: понедельник, с 10:00 до 19:00 по Ташкенту. */
export function noShowDue(now: Date): boolean {
  const t = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const weekday = tashkentDate(now).weekday;
  return weekday === 1 && t.getUTCHours() >= NO_SHOW_HOUR && t.getUTCHours() < NO_SHOW_LATEST_HOUR;
}

/** Ключ отметки в team_news_sent — один на неделю: «no-shows:<понедельник прошлой недели>». */
export function noShowKey(now: Date): string {
  const last = new Date(weekStartOf(now) - 7 * DAY_MS);
  return `no-shows:${todayInTashkent(last)}`;
}

export type NoShowRow = { id: string; name: string; mockups: number; shown: number };

/**
 * Прошлая неделя по каждому: макеты его клиентам за прошлую и позапрошлую
 * неделю (показ идёт за макетом, бывает и через неделю) и его показы за
 * прошлую неделю.
 */
export function noShowRows(deals: readonly Deal[], people: readonly { id: string; name: string }[], now: Date): NoShowRow[] {
  const end = weekStartOf(now);
  const start = end - 7 * DAY_MS;
  return people.map((p) => ({
    id: p.id,
    name: p.name,
    mockups: deals.filter((d) => d.ownerId === p.id && inWindow(d.own.mockup?.at, start - 7 * DAY_MS, end)).length,
    shown: deals.filter((d) => d.own.shown?.by === p.id && inWindow(d.own.shown?.at, start, end)).length,
  }));
}

/** У кого был хотя бы один макет и ни одного показа. */
export function noShowNames(rows: readonly NoShowRow[]): NoShowRow[] {
  return rows.filter((r) => r.mockups > 0 && r.shown === 0);
}

/** Строка руководителю и владельцу (HTML Telegram, имена уже экранированы); null — писать не о чем. */
export function noShowText(rows: readonly NoShowRow[]): string | null {
  const who = noShowNames(rows);
  if (!who.length) return null;
  const list = who.map((r) => `• ${r.name} — ${r.mockups} ${plural(r.mockups, "макет", "макета", "макетов")}, показов 0`);
  return [
    "🎬 <b>Прошлая неделя: макеты без показа</b>",
    ...list,
    "",
    `Норма — ${SHOW_NORM} показа макета в неделю: по видео или вживую, с отметкой «Показал макет» в карточке лида или на «Главной». Без показа макет обычно так и остаётся ссылкой, которую никто не открыл.`,
  ].join("\n");
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* ── Отметки: кто может ──────────────────────────────────────────────── */

/**
 * Отмечать ступень можно по своему: менеджер — по своему лиду (хозяин —
 * он) или по своему касанию без лида (ведёт он); руководитель и владелец —
 * по любому.
 */
export function canMark(
  viewer: { id: string; role: Role },
  target: { leadOwner?: string | null; hasLead: boolean; handled_by?: string | null; claimed_by?: string | null; touched_by?: string | null },
): boolean {
  if (viewer.role === "admin" || viewer.role === "head") return true;
  if (target.hasLead) return target.leadOwner === viewer.id;
  return (target.handled_by ?? target.claimed_by ?? target.touched_by ?? null) === viewer.id;
}

/** Сумма «Назвал цену» из формы: целые доллары, от 1 до 1 000 000. */
export function parseAmount(raw: unknown): number | null {
  const n = Number(String(raw ?? "").replace(/[\s$,]/g, ""));
  return Number.isInteger(n) && n > 0 && n <= 1_000_000 ? n : null;
}

/* ── «Главная» менеджера: мои ступени за неделю и норма показов ─────── */

export type MyStages = { week: Record<Stage, number>; norm: ShowNorm };

/** Ступени его сделок с понедельника и норма показов — по тому, что он показал сам. */
export function myStagesOf(deals: readonly Deal[], me: string, now: Date): MyStages {
  const { from, to } = periodRange("week", now);
  return {
    week: stageCounts(myDeals(deals, me), from, to),
    norm: showNorm(personSales(deals, me, from, to).shown, now),
  };
}

/** Когда по этому клиенту отмечен показ: ищем сделку по лиду или касанию. */
export function shownAtOf(deals: readonly Deal[], ids: { leadId: string | null; prospectId: string | null }): string | null {
  const d = deals.find((x) => (ids.leadId && x.leadId === ids.leadId) || (ids.prospectId && x.prospectId === ids.prospectId));
  return d?.own.shown?.at ?? null;
}
