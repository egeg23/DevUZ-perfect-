import Link from "next/link";
import { notFound } from "next/navigation";

import { editProject, moveStage } from "../actions";
import { confirmPayment, deletePayment, saveMoney, saveShare } from "@/app/admin/finance/actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import {
  ACCRUAL_TITLE,
  DEAL_KINDS,
  KIND_TITLE,
  PURPOSES,
  PURPOSE_TITLE,
  accrualState,
  accrualsOf,
  canEditMoney,
  canSeeMoney,
  earnersOf,
  money,
  ownerShare,
  paidOf,
  profitOf,
  taxOf,
} from "@/lib/admin/finance";
import { requireStaff } from "@/lib/admin/guard";
import { loadPeople, paymentsFor, sharesFor, sharesOf } from "@/lib/admin/ledger";
import {
  ALL_STAGES,
  STAGES,
  STAGE_LABEL,
  daysOnStage,
  projectById,
  stageProgress,
} from "@/lib/admin/projects";
import { teamOf } from "@/lib/admin/team";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm disabled:opacity-60";

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  ok: { text: "Готово.", tone: "ok" },
  paid: { text: "Платёж записан.", tone: "ok" },
  forbidden: {
    text: "Это правит владелец. Сумму и вид меняет ещё тот, кто ведёт проект, — пока по нему нет платежей.",
    tone: "warn",
  },
  invalid: { text: "Сумма, процент или дата не разобрались: целые доллары, целые проценты, дата как в календаре.", tone: "warn" },
  gone: { text: "Такой записи уже нет.", tone: "warn" },
  failed: { text: "Не получилось.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
};

/** «13.09.26» из даты платежа — она хранится днём, без часов и пояса. */
function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const { r } = await searchParams;

  const project = await projectById(id);
  if (!project) notFound();

  const progress = stageProgress(project.stage);
  const days = daysOnStage(project.stage_since);
  const isAdmin = staff.role === "admin";
  const notice = r ? (RESULT[r] ?? RESULT.failed) : null;

  // Деньги: платежи и люди нужны, чтобы посчитать начисления по проекту.
  const [payments, people, team, shares] = await Promise.all([
    paymentsFor([project.id]),
    loadPeople(),
    staff.role === "head" ? teamOf(staff.id) : Promise.resolve([] as string[]),
    sharesFor([project.id]),
  ]);
  const paid = paidOf(project.id, payments);
  const lines = accrualsOf(project, payments, earnersOf(people), sharesOf(project.id, shares));
  const state = accrualState(project, paid);
  const profit = profitOf(project);
  const seesMoney = canSeeMoney(staff, project, team);
  const editsMoney = canEditMoney(staff, project, paid);
  const nameOf = (staffId: string | null) => people.find((p) => p.id === staffId)?.display_name ?? "—";

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/projects" className="text-sm text-muted hover:text-text">
        ← к проектам
      </Link>

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

      <h1 className="mt-4 text-xl font-semibold">{project.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {project.client || "клиент не указан"}
        {project.owner_name ? ` · ведёт ${project.owner_name}` : ""}
      </p>

      {/* ── Стадия ──────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-xs uppercase tracking-wider text-faint">Стадия</span>
          <span className="text-sm">{STAGE_LABEL[project.stage] ?? project.stage}</span>
          <span className="text-xs text-faint">
            {days === 0 ? "с сегодняшнего дня" : `${days} дн.`} · с {when(project.stage_since)}
          </span>
        </div>

        {progress === null ? (
          <p className="mt-3 text-xs text-faint">
            Стадия вне линии: полосу не рисуем — это не начало и не конец.
          </p>
        ) : (
          <>
            <span className="mt-3 block h-1.5 overflow-hidden rounded-r-[4px] bg-line-soft">
              <span
                className="block h-full rounded-r-[4px]"
                style={{ width: `${progress}%`, background: "var(--color-chart-bar)" }}
              />
            </span>
            <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
              {STAGES.map((stage) => (
                <li key={stage} className={stage === project.stage ? "text-text" : undefined}>
                  {STAGE_LABEL[stage]}
                </li>
              ))}
            </ol>
          </>
        )}

        {isAdmin ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
            {ALL_STAGES.map((stage) => (
              <form key={stage} action={moveStage}>
                <input type="hidden" name="project" value={project.id} />
                <input type="hidden" name="stage" value={stage} />
                <button
                  type="submit"
                  disabled={stage === project.stage}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    stage === project.stage
                      ? "border-green/40 bg-green/10 text-green"
                      : "border-line bg-surface-2 text-muted hover:text-text"
                  }`}
                >
                  {STAGE_LABEL[stage] ?? stage}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="mt-4 border-t border-line-soft pt-4 text-xs text-faint">
            Стадию двигает админ. Она — обещание клиенту, а не отметка о
            самочувствии исполнителя.
          </p>
        )}
      </section>

      {/* ── Деньги ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">Деньги</h2>

        <form action={saveMoney} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="project" value={project.id} />

          <label className="block">
            <span className="text-xs text-faint">Вид сделки</span>
            <select name="kind" defaultValue={project.kind} disabled={!editsMoney} className={`${FIELD} mt-1`}>
              {DEAL_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_TITLE[kind]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-faint">Сумма по договору, $</span>
            <input
              name="amount"
              inputMode="numeric"
              defaultValue={project.amount_usd ?? ""}
              disabled={!editsMoney}
              className={`${FIELD} mt-1`}
            />
          </label>

          {isAdmin ? (
            <>
              <label className="block">
                <span className="text-xs text-faint">Налог, %</span>
                <input name="tax" inputMode="numeric" defaultValue={project.tax_percent} className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Себестоимость разработки, $</span>
                <input
                  name="cost"
                  inputMode="numeric"
                  defaultValue={project.dev_cost_usd ?? ""}
                  placeholder="после договора"
                  className={`${FIELD} mt-1`}
                />
              </label>
            </>
          ) : (
            <p className="text-xs text-faint sm:col-span-2 sm:self-end">
              Налог {project.tax_percent} % · себестоимость{" "}
              {project.dev_cost_usd === null ? "ещё не вписана" : money(project.dev_cost_usd)} — вписывает владелец
              после подписания договора.
            </p>
          )}

          <div className="sm:col-span-4">
            {editsMoney ? (
              <button
                type="submit"
                className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
              >
                Сохранить
              </button>
            ) : (
              <p className="text-xs text-faint">
                {paid > 0
                  ? "По проекту уже есть платёж — сумму теперь меняет только владелец."
                  : "Сумму и вид правит владелец и тот, кто ведёт проект."}
              </p>
            )}
          </div>
        </form>

        {project.amount_usd !== null ? (
          <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-faint">Налог</dt>
              <dd className="font-mono">{money(taxOf(project))}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Чистая прибыль</dt>
              <dd className={`font-mono ${profit !== null && profit < 0 ? "text-gold" : ""}`}>
                {money(profit)}
                {project.dev_cost_usd === null ? (
                  <span className="ml-2 font-sans text-xs text-gold">без себестоимости</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Оплачено</dt>
              <dd className="font-mono">
                {money(paid)}
                <span
                  className={`ml-2 font-sans text-xs ${
                    state === "earned" ? "text-green" : state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {project.stage === "cancelled"
                    ? "проект отменён"
                    : state === "earned"
                      ? "целиком"
                      : `из ${money(project.amount_usd)}`}
                </span>
              </dd>
            </div>
            {isAdmin ? (
              <div>
                <dt className="text-xs text-faint">Остаётся владельцу</dt>
                <dd className="font-mono">{money(ownerShare(project, lines))}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {seesMoney && lines.length ? (
          <ul className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm">
            {lines.map((a) => (
              <li key={`${a.staff_id}-${a.share}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{nameOf(a.staff_id)}</span>
                <span className="text-xs text-faint">
                  {a.share === "head" ? "руководитель" : "ведёт"} · {a.percent} %
                  {a.manual ? " · вручную" : " · по грейду"}
                </span>
                <span className="font-mono">{money(a.amount_usd)}</span>
                <span
                  className={`text-xs ${
                    a.state === "earned" ? "text-green" : a.state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {ACCRUAL_TITLE[a.state]}
                </span>
                {isAdmin ? (
                  // Процент по этой сделке — только закреплённым: строки здесь и
                  // есть закреплённые, а постороннего сервер не примет.
                  <form action={saveShare} className="flex items-center gap-2">
                    <input type="hidden" name="project" value={project.id} />
                    <input type="hidden" name="staff" value={a.staff_id} />
                    <input
                      name="percent"
                      inputMode="numeric"
                      defaultValue={a.percent}
                      aria-label="Процент по этой сделке"
                      className="w-16 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-faint">%</span>
                    <button type="submit" className="text-xs text-faint hover:text-green">
                      задать
                    </button>
                    {a.manual ? (
                      <button type="submit" name="reset" value="1" className="text-xs text-faint hover:text-gold">
                        по грейду
                      </button>
                    ) : null}
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Платежи клиента */}
        <div className="mt-4 border-t border-line-soft pt-4">
          <p className="text-xs uppercase tracking-wider text-faint">Платежи клиента</p>
          {payments.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-xs text-muted">{day(payment.paid_on)}</span>
                  <span className="font-mono">{money(payment.amount_usd)}</span>
                  <span className="text-xs text-faint">
                    {PURPOSE_TITLE[payment.purpose]}
                    {payment.note ? ` · ${payment.note}` : ""}
                    {payment.confirmed_name ? ` · подтвердил ${payment.confirmed_name}` : ""}
                  </span>
                  {isAdmin ? (
                    <form action={deletePayment}>
                      <input type="hidden" name="project" value={project.id} />
                      <input type="hidden" name="payment" value={payment.id} />
                      <button type="submit" className="text-xs text-faint hover:text-gold">
                        удалить
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-faint">Платежей пока нет.</p>
          )}

          {isAdmin ? (
            <form action={confirmPayment} className="mt-3 grid gap-3 sm:grid-cols-5">
              <input type="hidden" name="project" value={project.id} />
              <label className="block">
                <span className="text-xs text-faint">Сумма, $</span>
                <input name="amount" required inputMode="numeric" className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Дата</span>
                <input name="paid_on" type="date" className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Назначение</span>
                <select name="purpose" defaultValue="advance" className={`${FIELD} mt-1`}>
                  {PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {PURPOSE_TITLE[purpose]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-faint">Заметка</span>
                <input name="note" maxLength={500} className={`${FIELD} mt-1`} />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
                >
                  Записать платёж
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-xs text-faint">Платежи подтверждает владелец.</p>
          )}
        </div>
      </section>

      {/* ── Правки ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">Данные проекта</h2>
        <form action={editProject} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="project" value={project.id} />

          <label className="block">
            <span className="text-xs text-faint">Название</span>
            <input name="title" required maxLength={200} defaultValue={project.title} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">Клиент</span>
            <input name="client" maxLength={200} defaultValue={project.client ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">Срок</span>
            <input name="deadline" type="date" defaultValue={project.deadline ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-faint">Заметки</span>
            <textarea name="notes" rows={4} maxLength={4000} defaultValue={project.notes ?? ""} className={`${FIELD} mt-1 resize-y`} />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
            >
              Сохранить
            </button>
          </div>
        </form>
      </section>

      {project.lead_id ? (
        <p className="mt-4 text-sm">
          <Link href={`/admin/leads/${project.lead_id}`} className="text-blue-soft hover:underline">
            Лид, из которого вырос проект →
          </Link>
        </p>
      ) : null}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        Каждый переход стадии записан в журнал вместе с тем, откуда и куда, и
        сколько дней проект простоял на предыдущей. По этим строкам потом видно,
        где производство встаёт, — а это самый полезный вопрос про сроки.
      </p>
    </AdminShell>
  );
}
