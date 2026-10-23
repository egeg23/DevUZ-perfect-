/**
 * «Главная» — командный центр владельца и руководителя (app/admin/hq).
 *
 * Владелец, 13.10.2026: «коротко что в компании, сколько лидов, сколько в
 * работе, сколько отправили прототипов и ждём ответ… карточки наших
 * сотрудников… Это командный центр с самыми важными пунктами».
 *
 * Здесь только арифметика над строками из базы — без запросов и без модели:
 * одни и те же строки дают одни и те же числа, и всё проверяется тестом
 * (tests/hq.test.ts). Строки собирает lib/admin/hq-store.ts.
 *
 * Время — Ташкент. «Сегодня» — с полуночи по Ташкенту, «за 7 дней» —
 * последние 7 × 24 часа, и сравнение — с 7 днями до них. Неделя здесь не
 * календарная намеренно: в понедельник утром календарная неделя пуста, и
 * сравнение «0 против 34» ничего не говорит.
 */

import { activeNow, latest } from "@/lib/admin/lead-queue";
import { tallyPortion, type PortionOutcome } from "@/lib/admin/portion";
import { TASHKENT_OFFSET_MS, isInWork, tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";
import type { Growth } from "@/lib/admin/levels";
import { isModelTroubleSays } from "@/lib/model-trouble";

export const HQ_HREF = "/admin/hq";

const DAY_MS = 24 * 3600_000;
const WEEK_MS = 7 * DAY_MS;

/** Пульс обновляется сам, пока страница открыта и видна. */
export const HQ_REFRESH_MS = 90_000;

/* ── Сравнение «7 дней против 7 дней до них» ─────────────────────────── */

export type Trend = { now: number; prev: number };

/** Сколько меток попало в последние 7 дней и в 7 дней до них. */
export function trendOf(stamps: readonly (string | null | undefined)[], now: Date): Trend {
  const end = now.getTime();
  let cur = 0;
  let prev = 0;
  for (const s of stamps) {
    if (!s) continue;
    const t = Date.parse(s);
    if (!Number.isFinite(t) || t > end) continue;
    if (t > end - WEEK_MS) cur += 1;
    else if (t > end - 2 * WEEK_MS) prev += 1;
  }
  return { now: cur, prev };
}

/** Разница с прошлым периодом: +3, −2, 0. */
export function deltaOf(t: Trend): number {
  return t.now - t.prev;
}

/** Полночь сегодня по Ташкенту — момент времени. */
export function dayStartOf(now: Date): number {
  return tashkentMidnight(todayInTashkent(now)).getTime();
}

const since = (at: string | null | undefined, from: number) => Boolean(at) && Date.parse(at as string) >= from;

/* ── Лиды ────────────────────────────────────────────────────────────── */

export type HqLead = {
  id: string;
  created_at: string;
  status: string;
  priority: string;
  assigned_staff_id: string | null;
  /** Номер заявки, компания или имя — как звать лида в списке. */
  label: string;
  /** Откуда лид: «outreach» — из касания, его отказ считается по касанию. */
  source?: string | null;
};

export type HqOffer = { lead_id: string; staff_id: string; expires_at: string };

export type HqEvent = {
  action: string;
  created_at: string;
  actor_staff_id: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
};

/** Тёплый — то, что очередь предлагает людям: горячий и тёплый приоритет. */
export const WARM_PRIORITIES: readonly string[] = ["hot", "warm"];

export type LeadsPulse = {
  newToday: number;
  new7: Trend;
  /** «В работе» — статус taken. */
  inWork: number;
  /** Предлагается кому-то прямо сейчас: 30 минут ещё идут. */
  offered: number;
  /** Тёплые новые без хозяина и без действующего предложения — их никто не держит. */
  unowned: HqLead[];
  won7: Trend;
  lost7: Trend;
};

/**
 * «Выиграли» и «проиграли» — по журналу, а не по полю лида: у лида нет
 * времени смены статуса, а журнал помнит, когда нажали. «Проиграли» сам
 * (21+ день без движения, lib/admin/lead-tidy.ts) — тоже проигрыш.
 */
export function outcomeOf(e: HqEvent): "won" | "lost" | null {
  if (e.action === "lead.auto_lost") return "lost";
  if (e.action !== "lead.status_changed") return null;
  const to = e.meta?.to;
  return to === "won" ? "won" : to === "lost" ? "lost" : null;
}

export function leadsPulse(leads: readonly HqLead[], offers: readonly HqOffer[], events: readonly HqEvent[], now: Date): LeadsPulse {
  const today = dayStartOf(now);
  const offeredIds = new Set(offers.filter((o) => Date.parse(o.expires_at) > now.getTime()).map((o) => o.lead_id));
  return {
    newToday: leads.filter((l) => since(l.created_at, today)).length,
    new7: trendOf(
      leads.map((l) => l.created_at),
      now,
    ),
    inWork: leads.filter(isInWork).length,
    offered: offeredIds.size,
    unowned: leads
      .filter((l) => !l.assigned_staff_id && l.status === "new" && WARM_PRIORITIES.includes(l.priority) && !offeredIds.has(l.id))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    won7: trendOf(
      events.filter((e) => outcomeOf(e) === "won").map((e) => e.created_at),
      now,
    ),
    lost7: trendOf(
      events.filter((e) => outcomeOf(e) === "lost").map((e) => e.created_at),
      now,
    ),
  };
}

/* ── Касания ─────────────────────────────────────────────────────────── */

export type HqProspect = {
  id: string;
  status: string;
  touched_by: string | null;
  touched_at: string | null;
  sent_at: string | null;
  autopilot_at: string | null;
  replied_at: string | null;
  /** «refused» — клиент отказался, касание закрыто (кнопкой или само). */
  closed_reason?: string | null;
  closed_at?: string | null;
};

export type HqPortionRow = { staff_id: string; replaces: string | null; outcome: string | null; source: string | null };

export type TouchesPulse = {
  /** Ушло сегодня: люди и автопрогон вместе, одна компания — одно касание. */
  today: number;
  /** Норма дня: порции людей плюс норма автопрогона, если он включён. */
  norm: number;
  portionTarget: number;
  portionDone: number;
  autopilotSent: number;
  /** Норма автопрогона; null — выключен. */
  autopilotTarget: number | null;
  repliesToday: number;
  sent7: Trend;
  replies7: Trend;
  /**
   * Отказы за 7 дней против 7 до них. Владелец, 23.10.2026: «Ты просто веди
   * статистику отказов, мы ее увидим в дашборде. Не спамь отказами» —
   * карточек отказов в боте нет, отказы видны здесь.
   */
  refused7: Trend;
};

/**
 * Когда случились отказы: касания, закрытые «клиент отказался», и отказы в
 * чате сайта и боте (лид «не интересно» не из касания — у касания он
 * считается по самому касанию, второй раз не считаем).
 */
export function refusalStamps(prospects: readonly HqProspect[], leads: readonly HqLead[]): (string | null)[] {
  return [
    ...prospects.filter((p) => p.closed_reason === "refused").map((p) => p.closed_at ?? null),
    ...leads.filter((l) => l.priority === "archive" && l.source !== "outreach").map((l) => l.created_at),
  ];
}

/** Касание человека — как в touch-store: по тому, кто написал, неудавшиеся не в счёте. */
function personTouchAt(p: HqProspect): string | null {
  return p.touched_by && p.touched_at && p.status !== "failed" ? p.touched_at : null;
}

/** Касание автопрогона — ушедшее письмо, которое не написал человек. */
function autopilotSentAt(p: HqProspect): string | null {
  return p.autopilot_at && !p.touched_by && p.status === "sent" ? p.sent_at : null;
}

/** Когда компания получила касание — человеком или автопрогоном. */
export function touchAt(p: HqProspect): string | null {
  return personTouchAt(p) ?? autopilotSentAt(p);
}

export function touchesPulse(
  prospects: readonly HqProspect[],
  portions: readonly HqPortionRow[],
  autopilot: { enabled: boolean; target: number },
  now: Date,
  refusedAt: readonly (string | null | undefined)[] = [],
): TouchesPulse {
  const today = dayStartOf(now);
  const real = portions
    .filter((r) => r.source !== "stream")
    .map((r) => ({
      replaces: r.replaces,
      outcome: r.outcome === "expired" ? null : ((r.outcome as PortionOutcome | null) ?? null),
    }));
  const tally = tallyPortion(real);
  const autopilotTarget = autopilot.enabled ? autopilot.target : null;
  return {
    today: prospects.filter((p) => since(touchAt(p), today)).length,
    norm: tally.target + (autopilotTarget ?? 0),
    portionTarget: tally.target,
    portionDone: tally.done,
    autopilotSent: prospects.filter((p) => since(autopilotSentAt(p), today)).length,
    autopilotTarget,
    repliesToday: prospects.filter((p) => since(p.replied_at, today)).length,
    sent7: trendOf(prospects.map(touchAt), now),
    replies7: trendOf(
      prospects.map((p) => p.replied_at),
      now,
    ),
    refused7: trendOf(refusedAt, now),
  };
}

/* ── Макеты ──────────────────────────────────────────────────────────── */

export type HqMockup = {
  id: string;
  /** «p:<id>» или «s:<проект>» — как в «Макетах»; ведёт к его строке. */
  mockup_ref?: string;
  client: string;
  mockup_name: string;
  status: string;
  sent_at: string;
  expires_at: string;
  approved_at: string | null;
  /** «scan» — нашёл скан макетов дважды в день (lib/admin/mockup-scan.ts). */
  source?: string | null;
  /** Когда строка появилась: у найденного сканом это позже, чем ушёл макет. */
  created_at?: string | null;
};

export type MockupsPulse = {
  sent7: Trend;
  /** Найдено сканом за 7 дней: макеты, которые ушли мимо записи. */
  scanned7: number;
  /** Акция 48 часов идёт: макет у клиента, ждём ответа. */
  waiting: number;
  /** Ближайшая к концу акция. */
  soonest: { client: string; endsAt: string } | null;
  /** Акций, которым осталось меньше ENDING_SOON_H часов. */
  endingSoon: number;
  approved7: Trend;
};

export const ENDING_SOON_H = 6;

export function liveOffer(m: HqMockup, now: Date): boolean {
  return m.status === "active" && Date.parse(m.expires_at) > now.getTime();
}

export function mockupsPulse(mockups: readonly HqMockup[], now: Date): MockupsPulse {
  const live = mockups.filter((m) => liveOffer(m, now)).sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at));
  return {
    sent7: trendOf(
      mockups.map((m) => m.sent_at),
      now,
    ),
    scanned7: mockups.filter(
      (m) => m.source === "scan" && m.created_at && now.getTime() - Date.parse(m.created_at) <= 7 * 24 * 3600_000,
    ).length,
    waiting: live.length,
    soonest: live[0] ? { client: live[0].client || live[0].mockup_name, endsAt: live[0].expires_at } : null,
    endingSoon: live.filter((m) => Date.parse(m.expires_at) - now.getTime() <= ENDING_SOON_H * 3600_000).length,
    approved7: trendOf(
      mockups.map((m) => m.approved_at),
      now,
    ),
  };
}

/** «5 ч 20 мин», «40 мин» — сколько осталось до конца. Числа, без слов: слова — в словаре. */
export function leftOf(endsAt: string, now: Date): { h: number; m: number } {
  const ms = Math.max(0, Date.parse(endsAt) - now.getTime());
  const total = Math.floor(ms / 60_000);
  return { h: Math.floor(total / 60), m: total % 60 };
}

/* ── Задачи ──────────────────────────────────────────────────────────── */

export type HqTask = {
  id: string;
  title: string;
  assignee_id: string;
  creator_id: string;
  status: string;
  due_at: string;
  closed_at: string | null;
};

export const OPEN_TASK: readonly string[] = ["new", "in_work"];

export type TasksPulse = { open: number; overdue: HqTask[]; done7: Trend };

export function isOverdue(t: HqTask, now: Date): boolean {
  return OPEN_TASK.includes(t.status) && Date.parse(t.due_at) < now.getTime();
}

export function tasksPulse(tasks: readonly HqTask[], now: Date): TasksPulse {
  return {
    open: tasks.filter((t) => OPEN_TASK.includes(t.status)).length,
    overdue: tasks.filter((t) => isOverdue(t, now)).sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at)),
    done7: trendOf(
      tasks.filter((t) => t.status === "done").map((t) => t.closed_at),
      now,
    ),
  };
}

/* ── Деньги — только владельцу ───────────────────────────────────────── */

export type HqPayment = { amount_usd: number; paid_on: string };

export type MoneyPulse = {
  /** Поступило за 7 дней и за 7 дней до них, $. */
  received7: Trend;
  /** С первого числа месяца по Ташкенту, $. */
  month: number;
  /** Договоров ждут подписи. */
  contracts: number;
};

/**
 * Оплата — дата без времени (paid_on). «За 7 дней» по датам: сегодня и
 * шесть дней до него; прошлые 7 — ещё семь дней раньше.
 */
export function moneyPulse(payments: readonly HqPayment[], contracts: number, now: Date): MoneyPulse {
  const today = todayInTashkent(now);
  const dayOf = (offset: number) => {
    const d = new Date(Date.parse(`${today}T00:00:00Z`) - offset * DAY_MS);
    return d.toISOString().slice(0, 10);
  };
  const from = dayOf(6);
  const prevFrom = dayOf(13);
  const month = `${today.slice(0, 7)}-01`;
  const sum = (rows: readonly HqPayment[]) => Math.round(rows.reduce((s, r) => s + (Number(r.amount_usd) || 0), 0));
  const upTo = payments.filter((p) => p.paid_on <= today);
  return {
    received7: {
      now: sum(upTo.filter((p) => p.paid_on >= from)),
      prev: sum(upTo.filter((p) => p.paid_on >= prevFrom && p.paid_on < from)),
    },
    month: sum(upTo.filter((p) => p.paid_on >= month)),
    contracts,
  };
}

/** Деньги на «Главной» — только владельцу: руководитель долю студии не видит (seesOwnerMoney). */
export function seesHqMoney(role: Role): boolean {
  return role === "admin";
}

/* ── Люди ────────────────────────────────────────────────────────────── */

export type HqStaffRow = { id: string; display_name: string; role: Role; bot_seen_at: string | null };

export type HqPresence = { staff_id: string; minutes: number; first_at: string | null; last_at: string | null };

export type HqPersonInput = {
  staff: HqStaffRow;
  presence: HqPresence | null;
  /** Последний просмотр раздела сегодня (panel_usage). */
  lastView: string | null;
  /** Последнее действие в журнале за полчаса. */
  lastAction: string | null;
  touches: number;
  portion: readonly HqPortionRow[];
  inWork: number;
  burnedToday: number;
  stale: number;
  /** Лидов без ответа боту: спросил «чем кончилось» и ждёт (lib/admin/lead-tidy.ts). */
  botSilent?: number;
  tasks: readonly HqTask[];
  /** Касания по дням за неделю, старший день первым (dailyCounts). */
  touchDays?: readonly number[];
  /** Показы, названные цены и оплаты — сегодня и с понедельника (lib/admin/sales-stages.ts). */
  sales?: { today: PersonSalesCount; week: PersonSalesCount };
  /** Уровень и грейд по сделкам месяца (lib/admin/levels.ts, grade-month.ts). */
  growth?: Growth | null;
};

/** То же, что PersonSales в lib/admin/sales-stages.ts: здесь без импорта, чтобы не было круга. */
export type PersonSalesCount = { shown: number; priced: number; paid: number };

export type HqPerson = {
  id: string;
  name: string;
  role: Role;
  initials: string;
  /** Был активен за последние 30 минут: панель, журнал, кнопка в боте. */
  online: boolean;
  activeAt: string | null;
  firstAt: string | null;
  minutes: number;
  touches: number;
  portionTarget: number;
  portionDone: number;
  inWork: number;
  burnedToday: number;
  stale: number;
  botSilent: number;
  openTasks: number;
  overdue: number;
  /** Сводка для цвета карточки. */
  mood: Mood;
  /** Касания по дням: 7 чисел, сегодня — последнее. */
  touchDays: number[];
  /** Показы, цены, оплаты — сегодня и с понедельника. */
  sales: { today: PersonSalesCount; week: PersonSalesCount };
  growth: Growth | null;
};

/**
 * Настроение карточки — правилом, по тем же меркам, что вечерний отчёт:
 * - `alert` — есть просроченные задачи или сгоревшие предложения;
 * - `done` — порция дня сделана;
 * - `idle` — сегодня ни панели, ни касаний (после 12:00 это уже повод);
 * - `work` — всё остальное.
 */
export type Mood = "alert" | "done" | "idle" | "work";

/** Инициалы для круглой метки: «Данил Петров» → «ДП», «@egor» → «E». */
export function initials(name: string): string {
  const words = name
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter((w) => /\p{L}/u.test(w));
  const letters = words.slice(0, 2).map((w) => [...w].find((c) => /\p{L}/u.test(c)) ?? "");
  return letters.join("").toUpperCase() || "•";
}

export function personOf(input: HqPersonInput, now: Date): HqPerson {
  const { staff, presence } = input;
  const activeAt = latest(presence?.last_at, input.lastView, input.lastAction, staff.bot_seen_at);
  const real = input.portion
    .filter((r) => r.source !== "stream")
    .map((r) => ({ replaces: r.replaces, outcome: r.outcome === "expired" ? null : ((r.outcome as PortionOutcome | null) ?? null) }));
  const tally = tallyPortion(real);
  const open = input.tasks.filter((t) => t.assignee_id === staff.id && OPEN_TASK.includes(t.status));
  const overdue = open.filter((t) => isOverdue(t, now)).length;
  const today = dayStartOf(now);
  const seenToday = since(activeAt, today) || (presence?.minutes ?? 0) > 0;
  const touches = Math.max(input.touches, tally.done);
  const mood: Mood =
    overdue > 0 || input.burnedToday > 0
      ? "alert"
      : tally.target > 0 && tally.done >= tally.target
        ? "done"
        : !seenToday && touches === 0
          ? "idle"
          : "work";
  return {
    id: staff.id,
    name: staff.display_name,
    role: staff.role,
    initials: initials(staff.display_name),
    online: activeNow(activeAt, now),
    activeAt,
    firstAt: presence?.first_at ?? null,
    minutes: presence?.minutes ?? 0,
    touches,
    portionTarget: tally.target,
    portionDone: tally.done,
    inWork: input.inWork,
    burnedToday: input.burnedToday,
    stale: input.stale,
    botSilent: input.botSilent ?? 0,
    openTasks: open.length,
    overdue,
    mood,
    touchDays: [...(input.touchDays ?? Array(7).fill(0))],
    sales: input.sales ?? { today: { shown: 0, priced: 0, paid: 0 }, week: { shown: 0, priced: 0, paid: 0 } },
    growth: input.growth ?? null,
  };
}

/**
 * Сколько меток пришлось на каждый из последних `days` дней по Ташкенту:
 * старший день первым, сегодня — последним. Будущее и старше окна — мимо.
 */
export function dailyCounts(stamps: readonly (string | null | undefined)[], now: Date, days = 7): number[] {
  const out = Array<number>(days).fill(0);
  const today = dayStartOf(now);
  for (const s of stamps) {
    if (!s) continue;
    const t = Date.parse(s);
    if (!Number.isFinite(t) || t > now.getTime()) continue;
    const back = t >= today ? 0 : Math.ceil((today - t) / DAY_MS);
    if (back < days) out[days - 1 - back] += 1;
  }
  return out;
}

/** Порядок карточек: сначала тревожные, потом кто на месте, потом по имени. */
export function sortPeople(people: readonly HqPerson[]): HqPerson[] {
  const rank: Record<Mood, number> = { alert: 0, work: 1, done: 2, idle: 3 };
  return [...people].sort(
    (a, b) =>
      rank[a.mood] - rank[b.mood] || Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, "ru"),
  );
}

/** «09:05» по Ташкенту. */
export function clockOf(iso: string): string {
  const t = new Date(Date.parse(iso) + TASHKENT_OFFSET_MS);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

/* ── «Требует внимания» ──────────────────────────────────────────────── */

/**
 * Строка ведёт ровно в то, о чём она (владелец, 14.10.2026: «он переносит
 * в общий пул, а не в конкретную, о которой идёт речь»): лид — в его
 * карточку, задача — в её карточку, аккаунт — к его строке в «Аккаунтах»,
 * макет — к его строке в «Макетах». Одна штука — строка и есть ссылка;
 * несколько — строка раскрывается списком, и каждый пункт ведёт в свою.
 */
export type AttentionLink = { label: string; href: string };

type Base = { level: "red" | "gold"; links: AttentionLink[] };

export type Attention = Base &
  (
    | { kind: "sweep"; minutes: number | null }
    | { kind: "autopilot"; error: string }
    | { kind: "model"; error: string }
    | { kind: "ban"; account: string; until: string }
    | { kind: "circle"; accounts: string[]; lang: "ru" | "uz" }
    | { kind: "circleFallback"; n: number }
    | { kind: "unowned"; n: number; first: string }
    | { kind: "burned"; n: number }
    | { kind: "overdue"; n: number }
    | { kind: "stale"; n: number }
    | { kind: "botSilent"; name: string; n: number }
    | { kind: "transfers"; n: number }
    | { kind: "contracts"; n: number }
    | { kind: "ending"; n: number }
    | { kind: "firecrawl"; remaining: number }
  );

export type AttentionKind = Attention["kind"];

/**
 * Сигналы без своей сущности — авария, сбой, остаток на счёте: ссылка
 * ведёт туда, где это чинится. У остальных — только конкретные ссылки.
 */
export const SYSTEM_HREF: Partial<Record<AttentionKind, string>> = {
  sweep: "/admin/help#leads-banner",
  autopilot: "/admin/prospect#autopilot",
  model: "/admin/prospect#autopilot",
  firecrawl: "/admin/prospect#autopilot",
};

/** Куда ведёт строка: системная — в своё место, одна сущность — в неё; несколько — null (раскрывается). */
export function attentionHref(a: Attention): string | null {
  const system = SYSTEM_HREF[a.kind];
  if (system) return system;
  return a.links.length === 1 ? a.links[0].href : null;
}

/** Адреса конкретных сущностей. */
export const hrefTo = {
  lead: (id: string) => `/admin/leads/${id}`,
  task: (id: string) => `/admin/tasks/${id}`,
  account: (key: string) => `/admin/accounts#account-${key}`,
  mockup: (ref: string) => `/admin/mockups#mockup-${ref.replace(/[^a-z0-9-]/gi, "-")}`,
  contract: (id: string) => `/admin/contracts/${id}`,
  prospect: (id: string) => `/admin/prospect?open=${id}#p-${id}`,
};

/** Больше стольких лидов без ответа боту — строка в «Требует внимания» (lib/admin/lead-tidy.ts). */
export const BOT_SILENT_ALERT = 5;

/** Лиды «в работе» этого человека — туда ведёт «без ответа боту». */
export const ownerLeadsHref = (staffId: string) => `/admin?owner=${staffId}&status=taken`;

/** Свип ходит раз в 5 минут; полчаса тишины — авария (как плашка в components/admin/sweep-banner.tsx). */
export const SWEEP_STALE_MIN = 30;

/** Firecrawl: меньше стольких кредитов — пора думать о пополнении. */
export const FIRECRAWL_LOW = 300;

/** Сколько пунктов раскрывается под строкой — дальше «…» в разделе. */
export const ATTENTION_LIST_MAX = 8;

type Named = { id: string; label: string };

export type AttentionInput = {
  role: Role;
  now: Date;
  sweep: { last_ok_at: string | null; alerted: boolean } | null;
  /** Сбой автопрогона за сегодня (stats_snapshots «autopilot-trouble»). */
  autopilotTrouble: { error: string; at: string } | null;
  /** Ограничения Telegram: аккаунт (ключ и подпись) и до какого момента. */
  bans: readonly { key: string; account: string; until: number }[];
  /** Рабочие аккаунты без кружка в «Избранном» (только те, о ком скаут уже знает). */
  circlesMissing: { ru: readonly Named[]; uz: readonly Named[] };
  /** Касания, где сегодня вместо кружка ушло письмо: кружка не было. */
  circleFallback: readonly Named[];
  leads: LeadsPulse;
  /** Сгоревшие сегодня предложения: лид и чьё было. */
  burned: readonly Named[];
  overdue: readonly Named[];
  /** Лиды «в работе» без движения 7+ дней. */
  stale: readonly Named[];
  /** У кого сколько лидов без ответа боту: id — сотрудник. */
  botSilent?: readonly (Named & { n: number })[];
  /** Просьбы передать лид: id лида. */
  transfers: readonly Named[];
  contracts: readonly Named[];
  /** Макеты, у которых акция кончается: ссылка — ref макета. */
  ending: readonly Named[];
  firecrawlRemaining: number | null;
};

const linksOf = (items: readonly Named[], to: (id: string) => string): AttentionLink[] =>
  items.slice(0, ATTENTION_LIST_MAX).map((x) => ({ label: x.label, href: to(x.id) }));

/**
 * Что горит прямо сейчас — только то, что видно в базе. Красное — первым:
 * авария или клиент, которого никто не держит; жёлтое — то, что сгорит,
 * если не заняться сегодня. Пусто — значит, тушить нечего.
 */
export function attentionOf(input: AttentionInput): Attention[] {
  const out: Attention[] = [];
  const now = input.now.getTime();
  const today = dayStartOf(input.now);

  if (input.sweep) {
    const last = input.sweep.last_ok_at ? Date.parse(input.sweep.last_ok_at) : Number.NaN;
    const minutes = Number.isFinite(last) ? Math.round((now - last) / 60_000) : null;
    if (minutes === null || minutes > SWEEP_STALE_MIN || input.sweep.alerted) out.push({ kind: "sweep", level: "red", minutes, links: [] });
  }

  if (input.autopilotTrouble && Date.parse(input.autopilotTrouble.at) >= today) {
    const pieces = input.autopilotTrouble.error.split(/;\s*/).filter(Boolean);
    const model = pieces.find((p) => isModelTroubleSays(p) || isModelTroubleSays(p.replace(/^[^:]{1,60}:\s*/, "")));
    if (model) out.push({ kind: "model", level: "red", error: model, links: [] });
    else out.push({ kind: "autopilot", level: "red", error: input.autopilotTrouble.error, links: [] });
  }

  for (const ban of input.bans) {
    if (ban.until > now) {
      out.push({
        kind: "ban",
        level: "red",
        account: ban.account,
        until: new Date(ban.until).toISOString(),
        links: [{ label: ban.account, href: hrefTo.account(ban.key) }],
      });
    }
  }

  const unowned = input.leads.unowned;
  if (unowned.length) {
    out.push({ kind: "unowned", level: "red", n: unowned.length, first: unowned[0].label, links: linksOf(unowned, hrefTo.lead) });
  }
  if (input.overdue.length) out.push({ kind: "overdue", level: "red", n: input.overdue.length, links: linksOf(input.overdue, hrefTo.task) });

  for (const lang of ["ru", "uz"] as const) {
    const missing = input.circlesMissing[lang];
    if (missing.length) {
      out.push({ kind: "circle", level: "gold", lang, accounts: missing.map((a) => a.label), links: linksOf(missing, hrefTo.account) });
    }
  }
  if (input.circleFallback.length) {
    out.push({ kind: "circleFallback", level: "gold", n: input.circleFallback.length, links: linksOf(input.circleFallback, hrefTo.prospect) });
  }
  if (input.burned.length) out.push({ kind: "burned", level: "gold", n: input.burned.length, links: linksOf(input.burned, hrefTo.lead) });
  if (input.transfers.length) {
    out.push({ kind: "transfers", level: "gold", n: input.transfers.length, links: linksOf(input.transfers, hrefTo.lead) });
  }
  if (input.ending.length) out.push({ kind: "ending", level: "gold", n: input.ending.length, links: linksOf(input.ending, hrefTo.mockup) });
  if (input.stale.length) out.push({ kind: "stale", level: "gold", n: input.stale.length, links: linksOf(input.stale, hrefTo.lead) });
  for (const p of input.botSilent ?? []) {
    if (p.n > BOT_SILENT_ALERT) {
      out.push({ kind: "botSilent", level: "gold", name: p.label, n: p.n, links: [{ label: p.label, href: ownerLeadsHref(p.id) }] });
    }
  }
  if (input.contracts.length && seesHqMoney(input.role)) {
    out.push({ kind: "contracts", level: "gold", n: input.contracts.length, links: linksOf(input.contracts, hrefTo.contract) });
  }
  if (input.firecrawlRemaining !== null && input.firecrawlRemaining < FIRECRAWL_LOW) {
    out.push({ kind: "firecrawl", level: "gold", remaining: Math.max(0, Math.floor(input.firecrawlRemaining)), links: [] });
  }

  return out.sort((a, b) => Number(b.level === "red") - Number(a.level === "red"));
}

/* ── Лента: что случилось за последние сутки ─────────────────────────── */

export type FeedItem =
  | { kind: "lead"; at: string; label: string; href: string }
  | { kind: "won" | "lost"; at: string; label: string; who: string | null; href: string }
  | { kind: "mockupSent" | "mockupApproved" | "mockupFound"; at: string; label: string; href: string }
  | { kind: "taskDone"; at: string; label: string; who: string | null; href: string };

export const FEED_HOURS = 24;
export const FEED_LIMIT = 12;

/**
 * Лента собирается из тех же строк, что и пульс, — без отдельных запросов:
 * новый лид, макет ушёл и утверждён, задача сделана, лид выигран или
 * проигран. Свежее — сверху, за сутки, не больше FEED_LIMIT строк.
 */
export function feedOf(
  input: {
    leads: readonly HqLead[];
    events: readonly HqEvent[];
    mockups: readonly HqMockup[];
    tasks: readonly HqTask[];
    names: ReadonlyMap<string, string>;
  },
  now: Date,
): FeedItem[] {
  const from = now.getTime() - FEED_HOURS * 3600_000;
  const fresh = (at: string | null | undefined): at is string =>
    Boolean(at) && Date.parse(at as string) >= from && Date.parse(at as string) <= now.getTime() + 60_000;
  const leadById = new Map(input.leads.map((l) => [l.id, l]));
  const name = (id: string | null | undefined) => (id ? (input.names.get(id) ?? null) : null);
  const items: FeedItem[] = [];

  for (const l of input.leads) {
    if (fresh(l.created_at)) items.push({ kind: "lead", at: l.created_at, label: l.label, href: `/admin/leads/${l.id}` });
  }
  for (const e of input.events) {
    const outcome = outcomeOf(e);
    if (!outcome || !fresh(e.created_at)) continue;
    const lead = e.target_id ? leadById.get(e.target_id) : undefined;
    items.push({
      kind: outcome,
      at: e.created_at,
      label: lead?.label ?? "—",
      who: name(e.actor_staff_id),
      href: e.target_id ? `/admin/leads/${e.target_id}` : "/admin",
    });
  }
  for (const m of input.mockups) {
    const label = m.client || m.mockup_name;
    if (fresh(m.sent_at)) items.push({ kind: "mockupSent", at: m.sent_at, label, href: "/admin/mockups" });
    // Найдено сканом: в ленте — когда нашли; сам макет мог уйти неделю назад.
    else if (m.source === "scan" && fresh(m.created_at)) items.push({ kind: "mockupFound", at: m.created_at, label, href: "/admin/mockups" });
    if (fresh(m.approved_at)) items.push({ kind: "mockupApproved", at: m.approved_at as string, label, href: "/admin/mockups" });
  }
  for (const t of input.tasks) {
    if (t.status === "done" && fresh(t.closed_at)) {
      items.push({ kind: "taskDone", at: t.closed_at as string, label: t.title, who: name(t.assignee_id), href: "/admin/tasks" });
    }
  }
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, FEED_LIMIT);
}
