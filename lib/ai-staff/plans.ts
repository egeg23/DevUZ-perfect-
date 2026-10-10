/**
 * Тарифы ИИ-сотрудников и что из них следует: лимит диалогов, модель,
 * каналы, работает ли клиент сейчас.
 *
 * Цена — пакет диалогов в сумах, как у Jivo и Salebot, а не плата за
 * решённый вопрос, как у Intercom Fin: малому бизнесу Узбекистана понятен
 * абонемент, а «решённый вопрос» спорен (docs/ai-staff/research.md, 2.3).
 *
 * Диалог — разговор с покупателем, в котором ИИ ответил хотя бы раз за
 * календарный месяц по Ташкенту. Себестоимость диалога на Sonnet — около
 * $0,05 (docs/ai-staff/design.md, 6); фактическую видно в model_usage по
 * метке `saas-<id клиента>`.
 *
 * Здесь только арифметика: ни базы, ни сети.
 */

export const PLAN_IDS = ["trial", "start", "business", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  /** Цена в месяц, сумы. */
  priceUzs: number;
  /** Диалогов в месяц. */
  dialogs: number;
  /** Сколько каналов можно подключить одновременно. */
  channels: number;
  tier: "standard" | "premium";
};

export const PLANS: Record<PlanId, Plan> = {
  trial: { id: "trial", priceUzs: 0, dialogs: 100, channels: 3, tier: "standard" },
  start: { id: "start", priceUzs: 490_000, dialogs: 300, channels: 1, tier: "standard" },
  business: { id: "business", priceUzs: 990_000, dialogs: 1_000, channels: 3, tier: "standard" },
  pro: { id: "pro", priceUzs: 2_490_000, dialogs: 1_500, channels: 3, tier: "premium" },
};

export function isPlan(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

/** Пробный период — две недели, как у Jivo. */
export const TRIAL_DAYS = 14;

/** Реплик ИИ в одном разговоре — потолок от зацикливания и баловства. */
export const MAX_AI_REPLIES_PER_TALK = 40;

/** Ташкент — UTC+5 круглый год, без перехода на летнее время. */
export const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Месяц по Ташкенту, «2026-10»: по нему считаются диалоги. */
export function monthKey(at: Date): string {
  const local = new Date(at.getTime() + TASHKENT_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Начало месяца по Ташкенту — для выборок «за этот месяц». */
export function monthStart(at: Date): Date {
  const local = new Date(at.getTime() + TASHKENT_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - TASHKENT_OFFSET_MS);
}

export type TenantTerms = {
  plan: PlanId;
  status: "active" | "paused" | "blocked";
  trial_until: string | null;
  paid_until: string | null;
};

/** Почему ИИ клиента сейчас не отвечает — или null, если отвечает. */
export type Stop = "paused" | "blocked" | "trial_over" | "unpaid" | "limit";

/**
 * Работает ли ИИ клиента прямо сейчас.
 *
 * Пробный — до trial_until; платный — до paid_until. Оплата, отмеченная во
 * время пробного, продлевает работу и после его конца, поэтому paid_until
 * важнее тарифа: заплатил — работает.
 */
export function stopReason(t: TenantTerms, dialogsThisMonth: number, now: Date): Stop | null {
  if (t.status === "blocked") return "blocked";
  if (t.status === "paused") return "paused";
  const paid = t.paid_until ? Date.parse(t.paid_until) > now.getTime() : false;
  if (!paid) {
    if (t.plan !== "trial") return "unpaid";
    const trial = t.trial_until ? Date.parse(t.trial_until) > now.getTime() : false;
    if (!trial) return "trial_over";
  }
  if (dialogsThisMonth >= PLANS[t.plan].dialogs) return "limit";
  return null;
}

/**
 * Новый срок оплаты: от сегодняшнего или от уже оплаченного — что позже.
 * Оплата заранее не сгорает.
 */
export function extendPaid(paidUntil: string | null, months: number, now: Date): Date {
  const from = paidUntil && Date.parse(paidUntil) > now.getTime() ? new Date(paidUntil) : now;
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

/** Модель по уровню тарифа. Opus — только «Про»: он дороже вчетверо. */
export function modelFor(tier: "standard" | "premium"): string {
  return tier === "premium"
    ? process.env.AI_STAFF_PREMIUM_MODEL || "claude-opus-5"
    : process.env.AI_STAFF_MODEL || "claude-sonnet-5";
}

/** Модель разбора сайта клиента в базу знаний — недорогая. */
export const IMPORT_MODEL = process.env.AI_STAFF_IMPORT_MODEL || "claude-haiku-4-5";

/**
 * Цены моделей, $ за миллион токенов: вход, выход, запись кэша, чтение кэша.
 * Для себестоимости в панели владельца; через ProxyAPI выходит дороже.
 */
const PRICES: Array<{ match: RegExp; input: number; output: number }> = [
  { match: /opus/i, input: 5, output: 25 },
  { match: /sonnet/i, input: 2, output: 10 },
  { match: /haiku-4/i, input: 1, output: 5 },
  { match: /haiku/i, input: 0.1, output: 0.5 },
];

export type UsageRow = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
};

/** Себестоимость строк model_usage в долларах. */
export function usageCostUsd(rows: readonly UsageRow[]): number {
  let total = 0;
  for (const row of rows) {
    const price = PRICES.find((p) => p.match.test(row.model)) ?? PRICES[1];
    total +=
      (row.input_tokens * price.input +
        row.output_tokens * price.output +
        row.cache_write_tokens * price.input * 1.25 +
        row.cache_read_tokens * price.input * 0.1) /
      1_000_000;
  }
  return total;
}

/** Курс для оценки себестоимости в сумах. Меняется в .env, без выкатки. */
export function uzsPerUsd(): number {
  const value = Number(process.env.AI_STAFF_UZS_PER_USD);
  return Number.isFinite(value) && value > 1000 ? value : 12_700;
}

/** Сумма в сумах с пробелами по тысячам: «490 000». */
export function formatUzs(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Метка расхода модели — по ней себестоимость клиента в model_usage. */
export function usageSite(tenantId: string): string {
  return `saas-${tenantId}`;
}
