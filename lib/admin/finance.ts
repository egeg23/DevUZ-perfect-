import type { Role } from "@/lib/admin/roles";

/**
 * Финансы: ставки, прибыль, начисления.
 *
 * Правила — как их сформулировал владелец: фиксированных зарплат нет, все
 * получают процент от чистой прибыли по сделке, а чистая прибыль — это
 * сумма от клиента минус налог минус себестоимость разработки. Сделка —
 * это проект с подписанным договором: сумма, вид, налог и себестоимость
 * живут при проекте, платежи клиента — рядом с ним.
 *
 * Здесь только арифметика и правила; чтения из базы и страницы живут в
 * `ledger.ts`. Так правила целиком закрываются тестами, а ставки меняются
 * в одном месте и без миграции.
 *
 * Начисление не хранится, а считается: ставка × прибыль по текущим полям
 * проекта. Хранить его значило бы получить два источника правды, которые
 * разойдутся после первой же правки себестоимости.
 *
 * Заморозка. Клиент платит частями — аванс, работа, остаток. Пока проект
 * не оплачен целиком, начисление лежит в заморозке: его видно, но к
 * выплате оно не идёт. Как только сумма платежей достигает суммы проекта —
 * «заработано». Отменённый проект не даёт ничего.
 *
 * Деньги — целые доллары, как везде в панели.
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

export function isDealKind(value: string): value is DealKind {
  return (DEAL_KINDS as readonly string[]).includes(value);
}

export const KIND_TITLE: Record<DealKind, string> = { new: "новый клиент", upsell: "допродажа" };

export const PURPOSES = ["advance", "rest", "other"] as const;
export type Purpose = (typeof PURPOSES)[number];

export function isPurpose(value: string): value is Purpose {
  return (PURPOSES as readonly string[]).includes(value);
}

export const PURPOSE_TITLE: Record<Purpose, string> = {
  advance: "аванс",
  rest: "остаток",
  other: "другое",
};

/* ── Ставки ───────────────────────────────────────────────────────────────
 *
 * Проценты от чистой прибыли по проекту. Константами, как остальные
 * бизнес-правила: правка ставки — это правка одной строки и запись в
 * истории git, а не миграция.
 */

/**
 * Ставка по грейду и виду сделки — свой клиент. Словами владельца: «15 % —
 * ставка хорошего менеджера, 5 % — апсейл; у начинающего 10 % без апсейлов;
 * руководителю 30 %, если это его клиент». «Без апсейлов» прочитано
 * буквально: допродажа младшего не начисляется ему вовсе.
 */
export const RATE_PERCENT: Record<Grade, Record<DealKind, number>> = {
  junior: { new: 10, upsell: 0 },
  manager: { new: 15, upsell: 5 },
  head: { new: 30, upsell: 30 },
};

/**
 * Руководителю — 5 % со сделки каждого его менеджера, любого грейда и вида,
 * поверх доли самого менеджера. Со своих клиентов у руководителя 30 %, и
 * второй строки там нет: руководителя над руководителем не бывает.
 */
export const HEAD_TEAM_PERCENT = 5;

/** Налог по умолчанию для нового проекта; правится в каждом. */
export const DEFAULT_TAX_PERCENT = 4;

export type Earner = {
  id: string;
  grade: Grade;
  /** Персональная ставка вместо грейдовой, в процентах. */
  rate_percent: number | null;
  head_staff_id: string | null;
};

/** Денежная сторона проекта — ровно те поля, от которых зависит расчёт. */
export type ProjectMoney = {
  id: string;
  owner_staff_id: string | null;
  kind: DealKind;
  amount_usd: number | null;
  tax_percent: number;
  dev_cost_usd: number | null;
  stage: string;
};

export type PaymentMoney = { project_id: string; amount_usd: number };
export type PayoutMoney = { staff_id: string; amount_usd: number };

/**
 * Ставка сотрудника на своём клиенте, в процентах. Персональная ставка,
 * если задана, заменяет грейдовую на новых клиентах; допродажи по-прежнему
 * идут по грейду — персональная ставка договаривается про основную работу,
 * а не про всё сразу.
 */
export function ratePercent(earner: Pick<Earner, "grade" | "rate_percent">, kind: DealKind): number {
  if (kind === "new" && earner.rate_percent !== null) return earner.rate_percent;
  return RATE_PERCENT[earner.grade][kind];
}

export function taxOf(project: Pick<ProjectMoney, "amount_usd" | "tax_percent">): number {
  if (project.amount_usd === null) return 0;
  return Math.round((project.amount_usd * project.tax_percent) / 100);
}

/**
 * Чистая прибыль. `null`, пока сумма не проставлена: считать «прибыль» от
 * пустой суммы значило бы показать ноль там, где просто ещё не договорились.
 * Себестоимость, пока её не вписали, считается нулём — и это видно в
 * строке проекта отдельной пометкой, а не тихо. Минус — тоже ответ.
 */
export function profitOf(
  project: Pick<ProjectMoney, "amount_usd" | "tax_percent" | "dev_cost_usd">,
): number | null {
  if (project.amount_usd === null) return null;
  return project.amount_usd - taxOf(project) - (project.dev_cost_usd ?? 0);
}

export function paidOf(projectId: string, payments: PaymentMoney[]): number {
  return payments.filter((p) => p.project_id === projectId).reduce((sum, p) => sum + p.amount_usd, 0);
}

export type AccrualState = "frozen" | "earned" | "void";

export const ACCRUAL_TITLE: Record<AccrualState, string> = {
  frozen: "заморожено",
  earned: "заработано",
  void: "не начисляется",
};

/**
 * Состояние начисления по проекту.
 *
 * «Оплачен целиком» — сумма платежей не меньше суммы проекта. Проект без
 * суммы или с нулевой не бывает оплаченным: иначе пустой проект давал бы
 * «заработано» на ровном месте.
 */
export function accrualState(project: Pick<ProjectMoney, "amount_usd" | "stage">, paid: number): AccrualState {
  if (project.stage === "cancelled") return "void";
  if (project.amount_usd !== null && project.amount_usd > 0 && paid >= project.amount_usd) return "earned";
  return "frozen";
}

export type Accrual = {
  project_id: string;
  staff_id: string;
  /** Чья это доля: владельца клиента или его руководителя. */
  share: "owner" | "head";
  percent: number;
  amount_usd: number;
  state: AccrualState;
};

/**
 * Начисления по одному проекту.
 *
 * Доля владельца клиента — всегда. Доля его руководителя — если руководитель
 * назначен (`head_staff_id`) и известен. Проект без суммы или без
 * ответственного не даёт строк. Прибыль ниже нуля даёт нулевые начисления:
 * минус по сделке — забота владельца студии, а не менеджера.
 */
export function accrualsOf(
  project: ProjectMoney,
  payments: PaymentMoney[],
  earners: ReadonlyMap<string, Earner>,
): Accrual[] {
  const owner = project.owner_staff_id ? earners.get(project.owner_staff_id) : undefined;
  const profit = profitOf(project);
  if (!owner || profit === null) return [];

  const base = Math.max(0, profit);
  const state = accrualState(project, paidOf(project.id, payments));
  const line = (staffId: string, share: Accrual["share"], percent: number): Accrual => ({
    project_id: project.id,
    staff_id: staffId,
    share,
    percent,
    amount_usd: state === "void" ? 0 : Math.round((base * percent) / 100),
    state,
  });

  const out = [line(owner.id, "owner", ratePercent(owner, project.kind))];
  if (HEAD_TEAM_PERCENT > 0 && owner.head_staff_id && earners.has(owner.head_staff_id)) {
    out.push(line(owner.head_staff_id, "head", HEAD_TEAM_PERCENT));
  }
  return out;
}

/** Что остаётся владельцу студии: прибыль минус все начисления. */
export function ownerShare(project: ProjectMoney, accruals: Accrual[]): number | null {
  const profit = profitOf(project);
  if (profit === null) return null;
  const mine = accruals
    .filter((a) => a.project_id === project.id)
    .reduce((sum, a) => sum + a.amount_usd, 0);
  return profit - mine;
}

export type Balance = {
  earned: number;
  frozen: number;
  paid_out: number;
  /** К выплате: заработано минус выплачено. Минус — выплатили вперёд. */
  due: number;
};

export function balanceOf(staffId: string, accruals: Accrual[], payouts: PayoutMoney[]): Balance {
  const b: Balance = { earned: 0, frozen: 0, paid_out: 0, due: 0 };
  for (const a of accruals) {
    if (a.staff_id !== staffId) continue;
    if (a.state === "earned") b.earned += a.amount_usd;
    if (a.state === "frozen") b.frozen += a.amount_usd;
  }
  for (const p of payouts) {
    if (p.staff_id === staffId) b.paid_out += p.amount_usd;
  }
  b.due = b.earned - b.paid_out;
  return b;
}

/* ── Кто что видит и правит ─────────────────────────────────────────────── */

export type Viewer = { id: string; role: Role };

/**
 * Чьи проекты и балансы видны. Менеджер — только свои. Руководитель — свои и
 * своих менеджеров (список приносит `teamOf`). Владелец — все.
 */
export function visibleStaff(viewer: Viewer, team: readonly string[]): "all" | string[] {
  if (viewer.role === "admin") return "all";
  if (viewer.role === "head") return [viewer.id, ...team.filter((id) => id !== viewer.id)];
  return [viewer.id];
}

export function canSeeMoney(
  viewer: Viewer,
  project: Pick<ProjectMoney, "owner_staff_id">,
  team: readonly string[],
): boolean {
  const scope = visibleStaff(viewer, team);
  return scope === "all" || (project.owner_staff_id !== null && scope.includes(project.owner_staff_id));
}

/**
 * Кто правит деньги проекта — сумму и вид. Владелец студии — всегда: налог,
 * себестоимость, платежи — его деньги, и они только его. Менеджер — свой
 * проект, пока по нему нет ни одного платежа и он не закрыт: после первого
 * подтверждённого платежа сумма становится фактом, и менять её задним
 * числом может только тот, кто подтверждал. Руководитель чужое видит, но
 * не правит.
 */
export function canEditMoney(
  viewer: Viewer,
  project: Pick<ProjectMoney, "owner_staff_id" | "stage">,
  paid: number,
): boolean {
  if (viewer.role === "admin") return true;
  if (project.owner_staff_id !== viewer.id) return false;
  if (project.stage === "done" || project.stage === "cancelled") return false;
  return paid === 0;
}

/* ── Формат и разбор ────────────────────────────────────────────────────── */

/** «12 500 $», прочерк вместо непроставленной суммы. */
export function money(usd: number | null): string {
  if (usd === null) return "—";
  return `${usd.toLocaleString("ru-RU")} $`;
}

/**
 * Целые доллары из формы. Не `Number()`: «12 000$» превратилось бы в NaN и
 * молча уехало в базу как null. Пробелы внутри числа допустимы — так
 * суммы и пишут.
 */
export function parseUsd(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/\s/g, "");
  if (!text) return null;
  if (!/^\d{1,9}$/.test(text)) return null;
  return Number.parseInt(text, 10);
}

/** Процент из формы: целое от 0 до 100, иначе null. */
export function parsePercent(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!/^\d{1,3}$/.test(text)) return null;
  const n = Number.parseInt(text, 10);
  return n <= 100 ? n : null;
}

/**
 * Кто вообще получает начисления.
 *
 * Владелец студии — нет: ему достаётся то, что остаётся после всех
 * начислений, и считать ему «15 % с собственного проекта» значило бы
 * дважды посчитать одни и те же деньги. Поэтому администратор в карту не
 * попадает, и его проекты дают строки только его руководителю — которого
 * у него нет.
 */
export function earnersOf(people: readonly (Earner & { role: Role })[]): Map<string, Earner> {
  const out = new Map<string, Earner>();
  for (const p of people) {
    if (p.role === "admin") continue;
    out.set(p.id, { id: p.id, grade: p.grade, rate_percent: p.rate_percent, head_staff_id: p.head_staff_id });
  }
  return out;
}
