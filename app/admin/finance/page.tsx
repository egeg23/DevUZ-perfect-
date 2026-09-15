import Link from "next/link";

import { deletePayout, savePayout } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import {
  ACCRUAL_TITLE,
  GRADE_TITLE,
  KIND_TITLE,
  accrualState,
  accrualsOf,
  balanceOf,
  earnersOf,
  money,
  ownerShare,
  paidOf,
  profitOf,
  visibleStaff,
  type Accrual,
} from "@/lib/admin/finance";
import { requireStaff } from "@/lib/admin/guard";
import { seesOwnerMoney } from "@/lib/admin/roles";
import { loadLedger, sharesOf } from "@/lib/admin/ledger";
import { partnerAccrualOf, type PartnerAccrual } from "@/lib/partners/rules";
import { STAGE_LABEL } from "@/lib/admin/projects";
import { teamOf } from "@/lib/admin/team";

export const dynamic = "force-dynamic";

/**
 * Финансы: у кого что заработано, заморожено и выплачено, и откуда это
 * взялось — по проектам.
 *
 * Границу держит страница, а не меню: менеджер видит свои проекты и свой
 * баланс, руководитель — свою команду, владелец — всё. Начисления не
 * хранятся: они считаются из суммы, налога, себестоимости и платежей при
 * каждом открытии, поэтому правка себестоимости в проекте меняет их сразу.
 */

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  ok: { text: "Готово.", tone: "ok" },
  forbidden: { text: "Выплаты записывает только владелец.", tone: "warn" },
  invalid: {
    text: "Сумма или дата не разобрались: сумма — целые доллары, дата — как в календаре. Себе выплату не записать.",
    tone: "warn",
  },
  gone: { text: "Такой записи уже нет.", tone: "warn" },
  failed: { text: "Не получилось записать. Попробуйте ещё раз.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
};

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

/** «13.09.26» из даты платежа — она хранится днём, без часов и пояса. */
function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  const { r } = await searchParams;
  const notice = r ? RESULT[r] : null;

  const team = staff.role === "head" ? await teamOf(staff.id) : [];
  const scope = visibleStaff(staff, team);
  const ledger = await loadLedger(scope);
  const isAdmin = staff.role === "admin";
  // Доля студии — отдельное право, не «он же админ». Руководитель проектов
  // видит свои начисления и начисления команды, но не то, что остаётся
  // владельцу: эта цифра ему в работе не нужна.
  const ownerMoney = seesOwnerMoney(staff.role);

  const earners = earnersOf(ledger.people);
  const accruals = ledger.projects.flatMap((p) =>
    accrualsOf(p, ledger.payments, earners, sharesOf(p.id, ledger.shares)),
  );
  const byProject = new Map<string, Accrual[]>();
  for (const a of accruals) byProject.set(a.project_id, [...(byProject.get(a.project_id) ?? []), a]);

  // Партнёрская строка: кто привёл клиента, тому — процент от той же прибыли.
  const partnerLines = new Map<string, PartnerAccrual>();
  for (const p of ledger.projects) {
    const partner = p.partner_id ? ledger.partners.get(p.partner_id) : undefined;
    if (!partner) continue;
    const line = partnerAccrualOf(p, ledger.payments, partner, ledger.partnerProven.get(partner.id) ?? false);
    if (line) partnerLines.set(p.id, line);
  }
  const partnerTotal = sum([...partnerLines.values()].map((l) => l.amount_usd));

  const nameOf = (id: string | null) =>
    ledger.people.find((p) => p.id === id)?.display_name ?? "—";

  // Люди в круге. Владельца в списке нет: ему остаётся остаток, а не
  // начисление. Отключённые остаются, пока за ними числятся деньги.
  const people = ledger.people.filter((p) => {
    if (p.role === "admin") return false;
    if (scope !== "all") return scope.includes(p.id);
    return (
      p.is_active ||
      accruals.some((a) => a.staff_id === p.id && a.amount_usd > 0) ||
      ledger.payouts.some((po) => po.staff_id === p.id)
    );
  });
  const rows = people.map((person) => ({
    person,
    balance: balanceOf(person.id, accruals, ledger.payouts),
    projects: new Set(accruals.filter((a) => a.staff_id === person.id).map((a) => a.project_id)).size,
  }));

  const live = ledger.projects.filter((p) => p.stage !== "cancelled");
  const totals = {
    contracted: sum(live.map((p) => p.amount_usd ?? 0)),
    paid: sum(ledger.payments.map((p) => p.amount_usd)),
    profit: sum(live.map((p) => profitOf(p) ?? 0)),
    accrued: sum(accruals.map((a) => a.amount_usd)) + partnerTotal,
    frozen: sum(accruals.filter((a) => a.state === "frozen").map((a) => a.amount_usd)),
    paidOut: sum(ledger.payouts.map((p) => p.amount_usd)),
  };
  const mine = balanceOf(staff.id, accruals, ledger.payouts);
  const withoutCost = live.filter((p) => p.amount_usd !== null && p.dev_cost_usd === null).length;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Финансы</h1>
      <p className="mt-1 text-sm text-muted">
        {isAdmin
          ? "По всей студии. Начисления считаются от чистой прибыли проекта и лежат в заморозке, пока клиент не заплатил целиком."
          : staff.role === "head"
            ? "Вы и ваша команда. Начисления считаются от чистой прибыли проекта и лежат в заморозке, пока клиент не заплатил целиком."
            : "Ваши проекты и ваш баланс. Начисление считается от чистой прибыли проекта и лежит в заморозке, пока клиент не заплатил целиком."}
      </p>

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {ledger.offline ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm text-gold">
          База недоступна — показать нечего.
        </p>
      ) : null}

      {/* ── Итоги ─────────────────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card label="По договорам" value={money(totals.contracted)} note={`${live.length} проектов с деньгами`} />
          <Card label="Оплачено клиентами" value={money(totals.paid)} />
          <Card
            label="Чистая прибыль"
            value={money(totals.profit)}
            note={withoutCost ? `у ${withoutCost} без себестоимости` : "сумма − налог − себестоимость"}
            warn={withoutCost > 0}
          />
          <Card label="Начислено команде и партнёрам" value={money(totals.accrued)} note={`партнёрам ${money(partnerTotal)} · заморожено ${money(totals.frozen)}`} />
          <Card label="Остаётся владельцу" value={money(totals.profit - totals.accrued)} note={`после налога, себестоимости и всех процентов · выплачено команде ${money(totals.paidOut)}`} />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Заработано" value={money(mine.earned)} note="по оплаченным целиком проектам" />
          <Card label="Заморожено" value={money(mine.frozen)} note="ждёт полной оплаты клиентом" />
          <Card label="Выплачено" value={money(mine.paid_out)} />
          <Card label="К выплате" value={money(mine.due)} warn={mine.due < 0} note={mine.due < 0 ? "выплачено вперёд" : undefined} />
        </div>
      )}

      {/* ── По людям ──────────────────────────────────────────────────── */}
      {staff.role !== "manager" ? (
        <section className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[820px]">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
              <tr>
                <th className={TH}>Кто</th>
                <th className={TH}>Грейд</th>
                <th className={TH}>Проектов</th>
                <th className={TH}>Заморожено</th>
                <th className={TH}>Заработано</th>
                <th className={TH}>Выплачено</th>
                <th className={TH}>К выплате</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ person, balance, projects }) => (
                <tr key={person.id} className="border-b border-line-soft last:border-0">
                  <td data-label="Кто" className={TD}>
                    {person.display_name}
                    {person.is_active ? null : <span className="ml-2 text-xs text-faint">отключён</span>}
                  </td>
                  <td data-label="Грейд" className={`${TD} text-xs text-muted`}>
                    {GRADE_TITLE[person.grade]}
                    {person.rate_percent !== null ? ` · ${person.rate_percent} %` : ""}
                  </td>
                  <td data-label="Проектов" className={`${TD} font-mono text-xs`}>{projects}</td>
                  <td data-label="Заморожено" className={`${TD} font-mono text-xs text-muted`}>{money(balance.frozen)}</td>
                  <td data-label="Заработано" className={`${TD} font-mono text-xs`}>{money(balance.earned)}</td>
                  <td data-label="Выплачено" className={`${TD} font-mono text-xs text-muted`}>{money(balance.paid_out)}</td>
                  <td data-label="К выплате" className={`${TD} font-mono text-xs ${balance.due > 0 ? "text-green" : balance.due < 0 ? "text-gold" : ""}`}>
                    {money(balance.due)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                    Пока никого: начисления появятся, когда у проекта будет сумма и ответственный.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* ── Проекты ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">По проектам</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className={`cards-on-phone w-full min-w-0 text-sm ${isAdmin ? "sm:min-w-[1240px]" : "sm:min-w-[880px]"}`}>
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>Проект</th>
              <th className={TH}>Ведёт</th>
              <th className={TH}>Вид</th>
              <th className={TH}>Сумма</th>
              <th className={TH}>Оплачено</th>
              {/* Налог, себестоимость и прибыль — только владельцу: по ним считается его
                  доля, а это его информация, не команды. */}
              {isAdmin ? (
                <>
                  <th className={TH}>Налог</th>
                  <th className={TH}>Себестоимость</th>
                  <th className={TH}>Прибыль</th>
                </>
              ) : null}
              <th className={TH}>Начисления</th>
              {ownerMoney ? <th className={TH}>Владельцу</th> : null}
            </tr>
          </thead>
          <tbody>
            {ledger.projects.map((project) => {
              // Не владелец видит только строки людей из своего круга: менеджер —
              // свою, руководитель — свои и команды. Партнёрская строка — владельцу.
              const lines = (byProject.get(project.id) ?? []).filter(
                (a) => isAdmin || (scope !== "all" && scope.includes(a.staff_id)),
              );
              const partnerLine = isAdmin ? (partnerLines.get(project.id) ?? null) : null;
              const paid = paidOf(project.id, ledger.payments);
              const state = accrualState(project, paid);
              const profit = profitOf(project);
              return (
                <tr key={project.id} className="border-b border-line-soft last:border-0 align-top">
                  <td data-label="Проект" className={TD}>
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-green">
                      {project.title}
                    </Link>
                    <span className="block text-xs text-faint">
                      {project.client || "клиент не указан"} · {STAGE_LABEL[project.stage] ?? project.stage}
                    </span>
                  </td>
                  <td data-label="Ведёт" className={`${TD} text-xs text-muted`}>{nameOf(project.owner_staff_id)}</td>
                  <td data-label="Вид" className={`${TD} text-xs text-muted`}>{KIND_TITLE[project.kind]}</td>
                  <td data-label="Сумма" className={`${TD} font-mono text-xs`}>{money(project.amount_usd)}</td>
                  <td data-label="Оплачено" className={`${TD} font-mono text-xs`}>
                    {money(paid)}
                    <span className={`block font-sans ${state === "earned" ? "text-green" : state === "void" ? "text-faint" : "text-gold"}`}>
                      {project.stage === "cancelled" ? "отменён" : state === "earned" ? "целиком" : "не целиком"}
                    </span>
                  </td>
                  {isAdmin ? (
                    <>
                      <td data-label="Налог" className={`${TD} font-mono text-xs text-muted`}>{project.tax_percent} %</td>
                      <td data-label="Себестоимость" className={`${TD} font-mono text-xs ${project.dev_cost_usd === null && project.amount_usd !== null ? "text-gold" : "text-muted"}`}>
                        {project.dev_cost_usd === null ? "не вписана" : money(project.dev_cost_usd)}
                      </td>
                      <td data-label="Прибыль" className={`${TD} font-mono text-xs ${profit !== null && profit < 0 ? "text-gold" : ""}`}>{money(profit)}</td>
                    </>
                  ) : null}
                  <td data-label="Начисления" className={`${TD} text-xs`}>
                    {lines.length === 0 && !partnerLine ? (
                      <span className="text-faint">—</span>
                    ) : (
                      lines.map((a) => (
                        <span key={`${a.staff_id}-${a.share}`} className="block">
                          {nameOf(a.staff_id)} {a.percent} %{a.manual ? " (вручную)" : ""} — <span className="font-mono">{money(a.amount_usd)}</span>
                          <span className={`ml-1 ${a.state === "earned" ? "text-green" : a.state === "void" ? "text-faint" : "text-gold"}`}>
                            {ACCRUAL_TITLE[a.state]}
                          </span>
                        </span>
                      ))
                    )}
                    {partnerLine ? (
                      <span className="block">
                        партнёр {ledger.partners.get(partnerLine.partner_id)?.name ?? "—"} {partnerLine.percent} %{partnerLine.manual ? " (вручную)" : ""} —{" "}
                        <span className="font-mono">{money(partnerLine.amount_usd)}</span>
                        <span className={`ml-1 ${partnerLine.state === "earned" ? "text-green" : partnerLine.state === "void" ? "text-faint" : "text-gold"}`}>
                          {partnerLine.void_reason ? "не засчитано" : ACCRUAL_TITLE[partnerLine.state]}
                        </span>
                      </span>
                    ) : null}
                  </td>
                  {ownerMoney ? (
                    <td data-label="Владельцу" className={`${TD} font-mono text-xs`}>
                      {(() => {
                        const own = ownerShare(project, lines);
                        return money(own === null ? null : own - (partnerLine?.amount_usd ?? 0));
                      })()}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {ledger.projects.length === 0 ? (
              <tr>
                <td colSpan={ownerMoney ? 10 : 6} className="px-4 py-6 text-sm text-muted">
                  Проектов в вашем круге пока нет.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Выплаты ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">Выплаты</h2>
      {isAdmin ? (
        <form action={savePayout} className="mt-2 grid gap-3 rounded-xl border border-line bg-surface px-5 py-4 sm:grid-cols-5">
          <label className="block text-xs text-faint">
            Кому
            <select name="staff" required defaultValue="" className={`mt-1 ${INPUT}`}>
              <option value="" disabled>
                выбрать
              </option>
              {ledger.people
                .filter((p) => p.is_active && p.role !== "admin")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs text-faint">
            Сумма, $
            <input name="amount" required inputMode="numeric" placeholder="1 200" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Дата
            <input name="paid_on" type="date" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Заметка
            <input name="note" maxLength={500} placeholder="за август" className={`mt-1 ${INPUT}`} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={BUTTON}>
              Записать выплату
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[640px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>Когда</th>
              <th className={TH}>Кому</th>
              <th className={TH}>Сумма</th>
              <th className={TH}>Заметка</th>
              {isAdmin ? <th className={TH} /> : null}
            </tr>
          </thead>
          <tbody>
            {ledger.payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-line-soft last:border-0">
                <td data-label="Когда" className={`${TD} text-xs text-muted`}>{day(payout.paid_on)}</td>
                <td data-label="Кому" className={TD}>{payout.staff_name ?? nameOf(payout.staff_id)}</td>
                <td data-label="Сумма" className={`${TD} font-mono text-xs`}>{money(payout.amount_usd)}</td>
                <td data-label="Заметка" className={`${TD} text-xs text-muted`}>{payout.note ?? ""}</td>
                {isAdmin ? (
                  <td data-label="" className={TD}>
                    <form action={deletePayout}>
                      <input type="hidden" name="payout" value={payout.id} />
                      <button type="submit" className="text-xs text-faint hover:text-gold">
                        удалить
                      </button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
            {ledger.payouts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-sm text-muted">
                  Выплат пока не было.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <div className="mt-8 max-w-2xl space-y-3 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">Ставки.</span> Менеджер — 15 % с нового клиента и 5 % с
          допродажи; начинающий — 10 %, допродажи не начисляются; руководитель — 30 % со своего
          клиента и 5 % с каждой сделки своих менеджеров. Считается от чистой прибыли: сумма по
          договору минус налог минус себестоимость разработки.
        </p>
        <p>
          <span className="text-muted">Заморозка.</span> Пока клиент не заплатил целиком,
          начисление видно, но к выплате не идёт. Себестоимость и платежи вписывает владелец
          после подписания договора — до этого прибыль по проекту считается без неё, и в
          таблице это помечено.
        </p>
      </div>
    </AdminShell>
  );
}

function Card({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${warn ? "text-gold" : ""}`}>{value}</p>
      {note ? <p className={`mt-1 text-xs ${warn ? "text-gold" : "text-faint"}`}>{note}</p> : null}
    </div>
  );
}
