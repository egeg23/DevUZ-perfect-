import type { Role } from "@/lib/admin/roles";

/**
 * Финансы: ставки, прибыль, начисления.
 *
 * Правила — как их сформулировал владелец: фиксированных зарплат нет, все
 * получают процент от чистой прибыли по сделке, а чистая прибыль — это
 * сумма от клиента минус налог минус себестоимость разработки. Здесь
 * только арифметика и правила; чтения из базы и страницы живут рядом,
 * в `deals.ts`. Так правила целиком закрываются тестами, а ставки
 * меняются в одном месте и без миграции — владелец ещё не на всё ответил.
 *
 * Начисление не хранится, а считается: ставка × прибыль по текущим полям
 * сделки. Хранить его значило бы получить два источника правды, которые
 * разойдутся после первой же правки себестоимости.
 *
 * Заморозка. Клиент платит частями — аванс, работа, остаток. Пока сделка
 * не оплачена целиком, начисление лежит в заморозке: его видно, но к
 * выплате оно не идёт. Как только сумма платежей достигает суммы сделки —
 * «заработано». Отменённая сделка не даёт ничего.
 */

export const GRADES = ["junior", "manager", "head"] as const;
export type Grade = (typeof GRADES)[number];

export function isGrade(value: string): value is Grade {
  return (GRADES as readonly string[]).includes(value);
}

export const GRADE_TITLE: Record<Grade, string> = {
  junior: "младший менеджер",
  manager: "менеджер",
  head: "руководитель",
};

export const DEAL_KINDS = ["new", "upsell"] as const;
export type DealKind = (typeof DEAL_KINDS)[number];
export const KIND_TITLE: Record<DealKind, string> = { new: "новый клиент", upsell: "допродажа" };

export const CURRENCIES = ["UZS", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEAL_STATUSES = ["open", "done", "cancelled"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];
export const STATUS_TITLE: Record<DealStatus, string> = {
  open: "в работе",
  done: "закрыта",
  cancelled: "отменена",
};

export const PURPOSES = ["advance", "rest", "other"] as const;
export type Purpose = (typeof PURPOSES)[number];
export const PURPOSE_TITLE: Record<Purpose, string> = {
  advance: "аванс",
  rest: "остаток",
  other: "другое",
};

/* ── Ставки ───────────────────────────────────────────────────────────────
 *
 * Проценты от чистой прибыли по сделке. Константами, как остальные
 * бизнес-правила проекта: правка ставки — это правка одной строки и
 * запись в истории git, а не миграция.
 */

/** Ставка по грейду, если сделка — свой клиент. */
export const RATE_PERCENT: Record<Grade, number> = { junior: 10, manager: 15, head: 30 };

/**
 * Допродажа для менеджера. «15 %, и ещё 5 % за апсейлы» прочитано как
 * 20 % на сделке-допродаже. Если владелец имел в виду 5 % вместо 15 —
 * здесь ставится −10, и всё остальное не трогается.
 */
export const UPSELL_BONUS_PERCENT = 5;

/**
 * Руководитель со сделок своих менеджеров. Пока — ничего: владелец назвал
 * только «30 %, если это его клиент». Если появится процент сверху, он
 * ставится здесь, и начисление руководителю возникает само.
 */
export const HEAD_TEAM_PERCENT = 0;

/** Налог по умолчанию — правится в каждой сделке; здесь только стартовое значение. */
export const DEFAULT_TAX_PERCENT = 4;

export type Earner = {
  id: string;
  grade: Grade;
  /** Персональная ставка вместо грейдовой, в процентах. */
  rate_override: number | null;
  head_staff_id: string | null;
};

export type DealMoney = {
  id: string;
  owner_staff_id: string;
  kind: DealKind;
  currency: Currency;
  amount: number;
  tax_percent: number;
  dev_cost: number;
  status: DealStatus;
};

export type PaymentMoney = { deal_id: string; amount: number };
export type PayoutMoney = { staff_id: string; amount: number; currency: Currency };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ставка сотрудника на сделке-своём-клиенте, в процентах. */
export function ratePercent(earner: Pick<Earner, "grade" | "rate_override">, kind: DealKind): number {
  if (earner.rate_override !== null) return earner.rate_override;
  const base = RATE_PERCENT[earner.grade];
  return earner.grade === "manager" && kind === "upsell" ? base + UPSELL_BONUS_PERCENT : base;
}

export function taxOf(deal: Pick<DealMoney, "amount" | "tax_percent">): number {
  return round2((deal.amount * deal.tax_percent) / 100);
}

/** Чистая прибыль. Может уйти в минус — это факт о сделке, а не ошибка. */
export function profitOf(deal: Pick<DealMoney, "amount" | "tax_percent" | "dev_cost">): number {
  return round2(deal.amount - taxOf(deal) - deal.dev_cost);
}

export function paidOf(dealId: string, payments: PaymentMoney[]): number {
  return round2(payments.filter((p) => p.deal_id === dealId).reduce((sum, p) => sum + p.amount, 0));
}

export type AccrualState = "frozen" | "earned" | "void";

export const ACCRUAL_TITLE: Record<AccrualState, string> = {
  frozen: "заморожено",
  earned: "заработано",
  void: "не начисляется",
};

/**
 * Состояние начисления по сделке.
 *
 * «Оплачена целиком» — сумма платежей не меньше суммы сделки. Сделка с
 * нулевой суммой не бывает оплаченной: иначе пустая сделка давала бы
 * «заработано» на ровном месте.
 */
export function accrualState(deal: Pick<DealMoney, "amount" | "status">, paid: number): AccrualState {
  if (deal.status === "cancelled") return "void";
  if (deal.amount > 0 && paid >= deal.amount) return "earned";
  return "frozen";
}

export type Accrual = {
  deal_id: string;
  staff_id: string;
  /** Чья это доля: владельца клиента или его руководителя. */
  share: "owner" | "head";
  percent: number;
  amount: number;
  currency: Currency;
  state: AccrualState;
};

/**
 * Начисления по одной сделке.
 *
 * Доля владельца клиента — всегда. Доля его руководителя — только если
 * `HEAD_TEAM_PERCENT` больше нуля и руководитель назначен. Прибыль ниже
 * нуля даёт нулевые начисления: минус по сделке — забота владельца, а не
 * менеджера.
 */
export function accrualsOf(
  deal: DealMoney,
  payments: PaymentMoney[],
  earners: ReadonlyMap<string, Earner>,
): Accrual[] {
  const owner = earners.get(deal.owner_staff_id);
  if (!owner) return [];

  const profit = Math.max(0, profitOf(deal));
  const state = accrualState(deal, paidOf(deal.id, payments));
  const line = (staffId: string, share: Accrual["share"], percent: number): Accrual => ({
    deal_id: deal.id,
    staff_id: staffId,
    share,
    percent,
    amount: state === "void" ? 0 : round2((profit * percent) / 100),
    currency: deal.currency,
    state,
  });

  const out = [line(owner.id, "owner", ratePercent(owner, deal.kind))];
  if (HEAD_TEAM_PERCENT > 0 && owner.head_staff_id && earners.has(owner.head_staff_id)) {
    out.push(line(owner.head_staff_id, "head", HEAD_TEAM_PERCENT));
  }
  return out;
}

/** Что остаётся владельцу студии: прибыль минус все начисления. */
export function ownerShare(deal: DealMoney, accruals: Accrual[]): number {
  const mine = accruals.filter((a) => a.deal_id === deal.id).reduce((sum, a) => sum + a.amount, 0);
  return round2(profitOf(deal) - mine);
}

export type Balance = {
  currency: Currency;
  earned: number;
  frozen: number;
  paid_out: number;
  /** К выплате: заработано минус выплачено. Может быть отрицательным, если выплатили вперёд. */
  due: number;
};

/** Баланс сотрудника по валютам — по каждой валюте своя строка. */
export function balancesOf(staffId: string, accruals: Accrual[], payouts: PayoutMoney[]): Balance[] {
  const byCurrency = new Map<Currency, Balance>();
  const row = (currency: Currency): Balance => {
    let b = byCurrency.get(currency);
    if (!b) {
      b = { currency, earned: 0, frozen: 0, paid_out: 0, due: 0 };
      byCurrency.set(currency, b);
    }
    return b;
  };

  for (const a of accruals) {
    if (a.staff_id !== staffId) continue;
    if (a.state === "earned") row(a.currency).earned += a.amount;
    if (a.state === "frozen") row(a.currency).frozen += a.amount;
  }
  for (const p of payouts) {
    if (p.staff_id !== staffId) continue;
    row(p.currency).paid_out += p.amount;
  }
  for (const b of byCurrency.values()) {
    b.earned = round2(b.earned);
    b.frozen = round2(b.frozen);
    b.paid_out = round2(b.paid_out);
    b.due = round2(b.earned - b.paid_out);
  }
  return [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

/* ── Кто что видит и правит ─────────────────────────────────────────────── */

export type Viewer = { id: string; role: Role };

/**
 * Чьи сделки и балансы видны. Менеджер — только свои. Руководитель — свои и
 * своих менеджеров (список приносит `teamOf`). Владелец — все.
 */
export function visibleStaff(viewer: Viewer, team: readonly string[]): "all" | string[] {
  if (viewer.role === "admin") return "all";
  if (viewer.role === "head") return [viewer.id, ...team.filter((id) => id !== viewer.id)];
  return [viewer.id];
}

export function canSeeDeal(viewer: Viewer, deal: Pick<DealMoney, "owner_staff_id">, team: readonly string[]): boolean {
  const scope = visibleStaff(viewer, team);
  return scope === "all" || scope.includes(deal.owner_staff_id);
}

/**
 * Кто правит сделку. Владелец студии — любую: налог, себестоимость,
 * платежи — его деньги. Менеджер — свою, пока по ней нет ни одного платежа:
 * после первого подтверждённого платежа сумма становится фактом, и менять её
 * задним числом может только тот, кто подтверждал. Руководитель чужие
 * сделки видит, но не правит.
 */
export function canEditDeal(
  viewer: Viewer,
  deal: Pick<DealMoney, "owner_staff_id" | "status">,
  paid: number,
): boolean {
  if (viewer.role === "admin") return true;
  return deal.owner_staff_id === viewer.id && deal.status === "open" && paid === 0;
}

/* ── Формат ─────────────────────────────────────────────────────────────── */

const RU = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/** «12 500 000 сум», «1 200 $». Без копеек, если их нет. */
export function money(amount: number, currency: Currency): string {
  return `${RU.format(amount)} ${currency === "UZS" ? "сум" : "$"}`;
}

/** Число из формы: запятая как разделитель, пробелы — как в «12 500 000». */
export function parseAmount(raw: FormDataEntryValue | null): number | null {
  const cleaned = String(raw ?? "").replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? round2(n) : null;
}
