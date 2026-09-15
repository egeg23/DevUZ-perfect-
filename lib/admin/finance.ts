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
  /**
   * Доля в чистой прибыли студии, %. Заполнена — человек соучредитель.
   *
   * Она же отменяет для него ставку руководителя с команды: соучредитель
   * получает свою долю от всего, что осталось после расходов, и брать
   * сверху процент с каждой сделки менеджера означало бы взять дважды.
   */
  founder_percent: number | null;
};

export function isFounder(earner: Pick<Earner, "founder_percent">): boolean {
  return earner.founder_percent !== null && earner.founder_percent > 0;
}

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
  /** Процент задан владельцем по этой сделке, а не взят из грейда. */
  manual: boolean;
  amount_usd: number;
  state: AccrualState;
};

/**
 * Начисления по одному проекту.
 *
 * Доля того, кто ведёт проект, — всегда. Доля его руководителя — если
 * руководитель назначен (`head_staff_id`) и известен. Проект без суммы или
 * без ответственного не даёт строк. Прибыль ниже нуля даёт нулевые
 * начисления: минус по сделке — забота владельца студии, а не менеджера.
 *
 * `shares` — проценты, заданные владельцем по этой сделке вручную, по
 * сотруднику. Они важнее и грейда, и персональной ставки, но строк не
 * добавляют: процент можно задать только тем, кто к сделке закреплён, —
 * ведущему и его руководителю. Запись для постороннего молча не считается.
 */
export function accrualsOf(
  project: ProjectMoney,
  payments: PaymentMoney[],
  earners: ReadonlyMap<string, Earner>,
  shares: ReadonlyMap<string, number> = new Map(),
): Accrual[] {
  const owner = project.owner_staff_id ? earners.get(project.owner_staff_id) : undefined;
  const profit = profitOf(project);
  if (!owner || profit === null) return [];

  const base = Math.max(0, profit);
  const state = accrualState(project, paidOf(project.id, payments));
  const line = (staffId: string, share: Accrual["share"], byRule: number): Accrual => {
    const manual = shares.get(staffId);
    const percent = manual ?? byRule;
    return {
      project_id: project.id,
      staff_id: staffId,
      share,
      percent,
      manual: manual !== undefined,
      amount_usd: state === "void" ? 0 : Math.round((base * percent) / 100),
      state,
    };
  };

  const out = [line(owner.id, "owner", ratePercent(owner, project.kind))];
  const headId = owner.head_staff_id;
  const head = headId ? earners.get(headId) : undefined;
  if (headId && head) {
    // Соучредителю ставка с команды не идёт: он берёт долю от всего, что
    // осталось после расходов, и процент с каждой сделки менеджера сверх
    // этого был бы тем же рублём, посчитанным дважды.
    const byRule = isFounder(head) ? 0 : HEAD_TEAM_PERCENT;
    // Процент, выставленный владельцем по этой сделке руками, сильнее
    // правила — в том числе и для соучредителя: владелец вправе доплатить
    // за конкретную работу, и отменять это правилом нельзя.
    if (byRule > 0 || shares.has(headId)) out.push(line(headId, "head", byRule));
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

/* ── Расходы студии и котёл соучредителей ─────────────────────────────── */

export const EXPENSE_CATEGORIES = ["ads", "tools", "contractors", "office", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export const EXPENSE_TITLE: Record<ExpenseCategory, string> = {
  ads: "реклама",
  tools: "сервисы и подписки",
  contractors: "подрядчики",
  office: "офис и связь",
  other: "прочее",
};

/**
 * Общий расход студии.
 *
 * Только общий: реклама, сервисы, подрядчики. Себестоимость конкретного
 * проекта живёт в `dev_cost_usd` и сюда не попадает — иначе она вычлась бы
 * дважды, из прибыли проекта и из котла.
 */
export type Expense = {
  id: string;
  /** Дата траты, а не записи: период считается по ней. */
  spent_on: string;
  amount_usd: number;
  category: ExpenseCategory;
  note: string | null;
};

export type FoundersPool = {
  /** Осталось студии по проектам, деньги за которые уже пришли. */
  earned: number;
  /** То же по проектам, которые ещё не оплачены целиком. */
  frozen: number;
  /** Общие расходы за тот же период. */
  expenses: number;
  /** Что делится: пришедшее минус потраченное. Может быть отрицательным. */
  pool: number;
};

/**
 * Котёл, который делится между соучредителями.
 *
 * Считается от денег, которые уже пришли, а не от выставленных сумм:
 * делить незаработанное значит однажды выплатить долю по сделке, которая
 * сорвётся. Незакрытое видно отдельной строкой — как «заморожено» у
 * менеджеров.
 *
 * Отменённые проекты не участвуют вовсе: там нет ни прибыли, ни начислений.
 *
 * Расходы вычитаются ДО деления — и именно поэтому реклама ложится на
 * соучредителей ровно в их пропорции сама, без отдельного правила.
 */
export function foundersPool(
  projects: readonly ProjectMoney[],
  payments: PaymentMoney[],
  accruals: readonly Accrual[],
  expenses: readonly Expense[],
): FoundersPool {
  let earned = 0;
  let frozen = 0;

  for (const project of projects) {
    const state = accrualState(project, paidOf(project.id, payments));
    if (state === "void") continue;

    const remainder = ownerShare(project, [...accruals]);
    if (remainder === null) continue;

    if (state === "earned") earned += remainder;
    else frozen += remainder;
  }

  const spent = expenses.reduce((sum, e) => sum + e.amount_usd, 0);
  return { earned, frozen, expenses: spent, pool: earned - spent };
}

export type FounderShare = {
  staff_id: string;
  percent: number;
  amount_usd: number;
};

/**
 * Доли соучредителей от котла.
 *
 * Последняя доля считается вычитанием, а не процентом. Иначе 70 % и 30 % от
 * нечётной суммы дают в сумме на доллар меньше или больше котла — и
 * расхождение всплывает при первой же сверке, где его будут искать в
 * расходах, а не в округлении.
 *
 * Минус делится так же, как плюс: владелец сказал «70 % доли прибыли и
 * расходов мои», и убыток — та же пропорция.
 */
export function founderShares(
  pool: number,
  founders: readonly Pick<Earner, "id" | "founder_percent">[],
): FounderShare[] {
  const real = founders.filter(isFounder);
  if (real.length === 0) return [];

  const out: FounderShare[] = [];
  let given = 0;

  real.forEach((founder, i) => {
    const percent = founder.founder_percent ?? 0;
    const last = i === real.length - 1;
    const amount = last ? pool - given : Math.round((pool * percent) / 100);
    given += amount;
    out.push({ staff_id: founder.id, percent, amount_usd: amount });
  });

  return out;
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
    out.set(p.id, {
      id: p.id,
      grade: p.grade,
      rate_percent: p.rate_percent,
      head_staff_id: p.head_staff_id,
      founder_percent: p.founder_percent,
    });
  }
  return out;
}
