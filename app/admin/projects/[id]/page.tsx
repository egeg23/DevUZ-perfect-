import Link from "next/link";

import { prepareContract } from "@/app/admin/contracts/actions";
import { contractsForProject } from "@/lib/admin/contract-store";
import { awaitingInvoicesFor } from "@/lib/admin/invoice-store";
import { notFound } from "next/navigation";

import { editProject, moveStage, saveQuote } from "../actions";
import { confirmPayment, deletePayment, saveMoney, savePartner, saveShare } from "@/app/admin/finance/actions";
import { QuoteCard } from "@/components/admin/quote-card";
import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
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
  visibleStaff,
} from "@/lib/admin/finance";
import { optionsFor } from "@/content/calculator";
import { requireStaff } from "@/lib/admin/guard";
import { CATEGORY_CHOICES, quoteFor } from "@/lib/admin/quote";
import { t } from "@/lib/i18n";
import { seesOwnerMoney } from "@/lib/admin/roles";
import { loadPeople, paymentsFor, sharesFor, sharesOf } from "@/lib/admin/ledger";
import {
  ALL_STAGES,
  STAGES,
  STAGE_LABEL,
  canEditProjectData,
  daysOnStage,
  projectById,
  stageProgress,
} from "@/lib/admin/projects";
import { teamOf } from "@/lib/admin/team";
import { VOID_TITLE, partnerAccrualOf, type VoidReason } from "@/lib/partners/rules";
import { listPartners, partnerById, summarize } from "@/lib/partners/store";

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
  below_floor: {
    text: "Сумма ниже порога сметы. Порог — это то, под чем проект не окупается; опуститься ниже может только владелец.",
    tone: "warn",
  },
  data_forbidden: {
    text: "«Данные проекта» правит ведущий проекта, его руководитель и владелец. Ведущего меняет только владелец.",
    tone: "warn",
  },
  gone: { text: "Такой записи уже нет.", tone: "warn" },
  failed: { text: "Не получилось.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
};

/** Где договор сейчас — словами, как в карточке договора. */
const CONTRACT_STATUS: Record<string, string> = {
  draft: "черновик: готовится, владельцу ещё не отправлен",
  pending: "отправлен владельцу на подпись",
  approved: "подтверждён владельцем, ждёт подписи заказчика",
  signed: "подписан обеими сторонами",
};

/**
 * Почему договор не подготовился. Раньше форма молча возвращала на карточку:
 * человек видел ту же пустую форму и не понимал, что не так.
 */
function contractErrorText(code: string, detail: string | undefined): string {
  if (code === "forbidden") return "Готовить договор этой роли нельзя.";
  if (code === "offline") return "База недоступна — попробуйте через минуту.";
  if (code === "invalid" && detail) return `Договор не подготовлен: ${detail}.`;
  return "Договор не подготовлен. Проверьте: дата, сумма больше нуля, заказчик и его реквизиты, предмет договора, этапы с долями, которые вместе дают 100%.";
}

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
  searchParams: Promise<{ r?: string; contract?: string; detail?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const { r, contract: contractError, detail: contractDetail } = await searchParams;

  const project = await projectById(id);
  if (!project) notFound();

  const progress = stageProgress(project.stage);
  const contracts = await contractsForProject(project.id);
  // Действующий договор — любой, кроме отменённого: пока он есть, второй
  // не готовится, а в карточке — ссылка на него, в каком бы статусе он ни был.
  const activeContracts = contracts.filter((c) => c.status !== "void");
  const voidContracts = contracts.filter((c) => c.status === "void");
  const days = daysOnStage(project.stage_since);
  const isAdmin = staff.role === "admin";
  // См. комментарий в «Финансах»: доля студии — не то же самое, что права
  // администратора, и держится отдельной функцией.
  const ownerMoney = seesOwnerMoney(staff.role);
  const notice = r ? (RESULT[r] ?? RESULT.failed) : null;

  // Деньги: платежи и люди нужны, чтобы посчитать начисления по проекту.
  const [payments, people, team, shares, partner, partners, awaiting] = await Promise.all([
    paymentsFor([project.id]),
    loadPeople(),
    staff.role === "head" ? teamOf(staff.id) : Promise.resolve([] as string[]),
    sharesFor([project.id]),
    project.partner_id ? partnerById(project.partner_id) : Promise.resolve(null),
    staff.role === "admin" ? listPartners() : Promise.resolve([]),
    awaitingInvoicesFor(project.id),
  ]);
  const canEditData = canEditProjectData(staff, project.owner_staff_id, team);
  // Проект ведёт владелец — начислений по нему нет никому: владелец в
  // начислениях не участвует. Так бывало с проектами, которые он заводил сам.
  const ownerLeads = people.find((p) => p.id === project.owner_staff_id)?.role === "admin";
  // Нынешний ведущий — в списке, даже если его уже отключили: иначе форма
  // молча подставила бы первого по алфавиту и сменила ведущего при сохранении.
  const leaders = people.filter((p) => p.is_active || p.id === project.owner_staff_id);

  // Партнёрская строка: ступень партнёра считается по всем его проектам.
  const partnerProven = partner ? (await summarize([partner]))[0]?.proven ?? false : false;
  const partnerLine = partner ? partnerAccrualOf(project, payments, partner, partnerProven) : null;
  const paid = paidOf(project.id, payments);
  const lines = accrualsOf(project, payments, earnersOf(people), sharesOf(project.id, shares));
  const state = accrualState(project, paid);
  const profit = profitOf(project);
  const seesMoney = canSeeMoney(staff, project, team);
  // Не владелец видит только строки людей из своего круга; налог,
  // себестоимость, прибыль и партнёр — владельцу: по ним считается его доля.
  const scope = visibleStaff(staff, team);
  const shownLines = lines.filter((a) => isAdmin || (scope !== "all" && scope.includes(a.staff_id)));
  const editsMoney = canEditMoney(staff, project, paid);
  const quoteInput = project.quote;
  const quote = quoteInput ? quoteFor(quoteInput) : null;
  // Как и деньги: свой проект и владелец. Руководитель смотрит, не правит.
  const editsQuote = staff.role === "admin" || project.owner_staff_id === staff.id;
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
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-faint">
            Стадия
            <HelpHint topic={helpAnchor("/admin/projects", "stages")} label="Кто и зачем двигает стадию" />
          </span>
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

      {/* ── Смета ───────────────────────────────────────────────────── */}
      {/* Стоит перед деньгами намеренно: сумму по договору ставят после
          того, как посчитали порог, а не до. */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">Смета</h2>

        {quote ? (
          <QuoteCard quote={quote} />
        ) : (
          <p className="mt-2 text-sm text-muted">
            Сметы пока нет. Выберите категорию и сохраните — порог, потолок и срок посчитаются сами.
          </p>
        )}

        {editsQuote ? (
          <form action={saveQuote} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="project" value={project.id} />

            <label className="block sm:col-span-2">
              <span className="text-xs text-faint">Категория</span>
              <select name="category" defaultValue={quoteInput?.category ?? ""} className={`${FIELD} mt-1`}>
                <option value="" disabled>
                  — выберите —
                </option>
                {CATEGORY_CHOICES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
              {quoteInput ? null : (
                <span className="mt-1 block text-xs text-faint">
                  После сохранения появятся допы этой категории.
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-xs text-faint">Обещанный срок, недель</span>
              <input
                name="weeks"
                inputMode="numeric"
                defaultValue={quoteInput?.weeks ?? ""}
                placeholder={quote?.weeksLow ? `расчётный ${quote.weeksLow}–${quote.weeksHigh}` : ""}
                className={`${FIELD} mt-1`}
              />
            </label>

            {quoteInput
              ? optionsFor(quoteInput.category).map((option) => {
                  const value = quoteInput.selection[option.id];
                  const label = t(option.label, "ru");
                  if (option.kind === "toggle") {
                    return (
                      <label key={option.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={`opt_${option.id}`} defaultChecked={value === true} />
                        {label}
                      </label>
                    );
                  }
                  if (option.kind === "choice") {
                    return (
                      <label key={option.id} className="block">
                        <span className="text-xs text-faint">{label}</span>
                        <select
                          name={`opt_${option.id}`}
                          defaultValue={typeof value === "string" ? value : option.choices[0].id}
                          className={`${FIELD} mt-1`}
                        >
                          {option.choices.map((choice) => (
                            <option key={choice.id} value={choice.id}>
                              {t(choice.label, "ru")}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={option.id} className="block">
                      <span className="text-xs text-faint">
                        {label} — {t(option.unitLabel, "ru")}, до {option.max}
                      </span>
                      <input
                        name={`opt_${option.id}`}
                        inputMode="numeric"
                        defaultValue={typeof value === "number" ? value : 0}
                        className={`${FIELD} mt-1`}
                      />
                    </label>
                  );
                })
              : null}

            <div className="flex items-center gap-3 sm:col-span-3">
              <button
                type="submit"
                className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
              >
                Сохранить смету
              </button>
              {quoteInput ? (
                <button type="submit" name="clear" value="1" className="text-xs text-faint hover:text-gold">
                  убрать смету
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="mt-3 text-xs text-faint">Смету правит тот, кто ведёт проект, и владелец.</p>
        )}
      </section>

      {/* ── Деньги ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          Деньги
          <HelpHint topic={helpAnchor("/admin/projects", "card")} label="Смета, сумма, платежи" />
        </h2>

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
              Налог и себестоимость вписывает владелец после подписания договора.
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
            {isAdmin ? (
              <div>
                <dt className="text-xs text-faint">Налог</dt>
                <dd className="font-mono">{money(taxOf(project))}</dd>
              </div>
            ) : null}
            {isAdmin ? (
            <div>
              <dt className="text-xs text-faint">Чистая прибыль</dt>
              <dd className={`font-mono ${profit !== null && profit < 0 ? "text-gold" : ""}`}>
                {money(profit)}
                {project.dev_cost_usd === null ? (
                  <span className="ml-2 font-sans text-xs text-gold">без себестоимости</span>
                ) : null}
              </dd>
            </div>
            ) : null}
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
            {ownerMoney ? (
              <div>
                <dt className="text-xs text-faint">Остаётся владельцу</dt>
                <dd className="font-mono">{money(ownerShare(project, lines))}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {seesMoney && shownLines.length ? (
          <ul className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 text-sm">
            {shownLines.map((a) => (
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

        {/* Партнёр: кто привёл клиента */}
        {isAdmin ? (
          <div className="mt-4 border-t border-line-soft pt-4">
            <p className="text-xs uppercase tracking-wider text-faint">Партнёр</p>
            {partner && partnerLine ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span>{partner.name}</span>
                <span className="font-mono text-xs text-muted">{partner.code}</span>
                <span className="text-xs text-faint">
                  {partnerLine.percent} % {partnerLine.manual ? "· вручную" : partnerProven ? "· прокачанный" : "· база"}
                </span>
                <span className="font-mono">{money(partnerLine.amount_usd)}</span>
                <span
                  className={`text-xs ${
                    partnerLine.state === "earned" ? "text-green" : partnerLine.state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {partnerLine.void_reason
                    ? `не засчитано: ${VOID_TITLE[partnerLine.void_reason as VoidReason] ?? partnerLine.void_reason}`
                    : ACCRUAL_TITLE[partnerLine.state]}
                </span>
              </p>
            ) : partner ? (
              <p className="mt-2 text-sm">
                {partner.name} <span className="font-mono text-xs text-muted">{partner.code}</span>
                <span className="ml-2 text-xs text-faint">начисление появится, когда будет сумма</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-faint">Клиент пришёл без партнёрской ссылки.</p>
            )}

            {isAdmin ? (
              // Владелец правит привязку руками: клиент мог прийти по слову, а не
              // по ссылке, — или наоборот, привязку надо снять.
              <form action={savePartner} className="mt-3 grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="project" value={project.id} />
                <label className="block">
                  <span className="text-xs text-faint">Кто привёл</span>
                  <select name="partner" defaultValue={project.partner_id ?? ""} className={`${FIELD} mt-1`}>
                    <option value="">без партнёра</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-faint">Процент партнёру</span>
                  <input
                    name="percent"
                    inputMode="numeric"
                    placeholder="по ступени"
                    defaultValue={project.partner_percent ?? ""}
                    className={`${FIELD} mt-1`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-faint">Не засчитывать, причина</span>
                  <input
                    name="void_reason"
                    maxLength={64}
                    placeholder="пусто — засчитано"
                    defaultValue={project.partner_void_reason ?? ""}
                    className={`${FIELD} mt-1`}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            ) : null}
          </div>
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

          {/* Оплату по счёту отметили, а платёж ещё не подтверждён: пока он
              здесь, начисления по нему заморожены. */}
          {awaiting.length ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {awaiting.map((invoice) => (
                <li
                  key={invoice.id}
                  className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold"
                >
                  Счёт № {invoice.number} на {money(Math.round(invoice.amount_usd))} отмечен оплаченным
                  {invoice.paid_by_name ? ` (${invoice.paid_by_name})` : ""} — платёж ещё не подтверждён.{" "}
                  <Link href={`/admin/contracts/${invoice.contract_id}`} className="underline hover:text-text">
                    {isAdmin ? "Подтвердить в договоре" : "Открыть договор"}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

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
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          Данные проекта
          <HelpHint topic={helpAnchor("/admin/projects", "data")} label="Кто может править" />
        </h2>
        {isAdmin && ownerLeads ? (
          <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
            Проект ведёте вы — начислений команде по нему нет. Если ведёт сотрудник, выберите его в поле «Ведёт» и
            сохраните.
          </p>
        ) : null}

        {!canEditData ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-faint">Ведёт</dt>
              <dd>{project.owner_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Клиент</dt>
              <dd>{project.client ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Срок</dt>
              <dd>{project.deadline ?? "—"}</dd>
            </div>
            {project.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-faint">Заметки</dt>
                <dd className="whitespace-pre-line">{project.notes}</dd>
              </div>
            ) : null}
            <p className="text-xs text-faint sm:col-span-2">
              Правит ведущий проекта, его руководитель и владелец.
            </p>
          </dl>
        ) : (
        <form action={editProject} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="project" value={project.id} />

          {isAdmin ? (
            <label className="block sm:col-span-2">
              <span className="text-xs text-faint">Ведёт — ему идёт начисление по проекту</span>
              <select name="owner" defaultValue={project.owner_staff_id ?? ""} required className={`${FIELD} mt-1`}>
                {project.owner_staff_id ? null : (
                  <option value="" disabled>
                    — выберите —
                  </option>
                )}
                {leaders.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name}
                    {person.role === "admin" ? " — без начислений команде" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
        )}
      </section>

      {/* Договор — здесь, а не отдельным разделом.
          Он готовится, когда сделка переходит в стадию «договор», и все
          данные для него лежат в этой же карточке: заказчик, сумма, сроки.
          Уводить за этим на другую страницу значит заставить переписывать
          цифры руками, а переписанная руками сумма однажды разойдётся с
          проектом. */}
      <section id="contract" className="mt-8 scroll-mt-24 rounded-2xl border border-line bg-surface px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-faint">
            Договор
          </h2>
          <Link href="/admin/contracts" className="text-xs text-muted hover:text-green">
            Как это устроено →
          </Link>
        </div>

        {contractError ? (
          <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
            {contractErrorText(contractError, contractDetail)}
          </p>
        ) : null}

        {voidContracts.length ? (
          <p className="mt-3 text-xs text-faint">
            Отменены:{" "}
            {voidContracts.map((c, i) => (
              <span key={c.id}>
                {i ? ", " : ""}
                <Link href={`/admin/contracts/${c.id}`} className="hover:text-text hover:underline">
                  № {c.number}
                </Link>
              </span>
            ))}
          </p>
        ) : null}

        {activeContracts.length ? (
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {activeContracts.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/contracts/${c.id}`} className="text-green hover:underline">
                  № {c.number} — {CONTRACT_STATUS[c.status] ?? c.status}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <form action={prepareContract} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="project_id" value={project.id} />
            <label className="text-xs text-muted">
              Дата договора
              <input
                type="date"
                name="signed_date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              Сумма, $
              <input
                type="number"
                name="amount"
                min={1}
                step="0.01"
                required
                defaultValue={project.amount_usd ?? undefined}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              Заказчик — полное название
              <input
                type="text"
                name="client_name"
                required
                defaultValue={project.client ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              Адрес и контакт заказчика
              <input
                type="text"
                name="client_details"
                required
                placeholder="г. Ташкент, ул. …, директор …, почта@…"
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            {/* Банк заказчика — отдельными полями, а не внутри адреса.
                Номер счёта, набранный в предложении, нельзя ни проверить,
                ни перенести в платёжку, не перечитывая фразу целиком. */}
            <label className="text-xs text-muted">
              ИНН или ПИНФЛ заказчика
              <input
                type="text"
                name="client_tax_id"
                required
                inputMode="numeric"
                placeholder="123456789"
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              Банк заказчика
              <input
                type="text"
                name="client_bank_name"
                required
                placeholder="АКБ «Капиталбанк», Ташкент"
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              Расчётный счёт — 20 цифр
              <input
                type="text"
                name="client_account"
                required
                inputMode="numeric"
                placeholder="20208000123456789012"
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              МФО — код банка, 5 цифр
              <input
                type="text"
                name="client_mfo"
                required
                inputMode="numeric"
                placeholder="00450"
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              Предмет договора — что именно делаем
              <input
                type="text"
                name="subject"
                required
                defaultValue={project.title}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-xs text-muted">
                Этапы — доли обязаны давать 100%
              </legend>
              {[
                { title: "Дизайн", percent: 30, days: 10 },
                { title: "Разработка", percent: 50, days: 20 },
                { title: "Запуск", percent: 20, days: 5 },
              ].map((row, i) => (
                <div key={i} className="mt-2 grid grid-cols-[1fr_5rem_5rem] gap-2">
                  <input
                    name="stage_title"
                    defaultValue={row.title}
                    className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                  <input
                    name="stage_percent"
                    type="number"
                    step="0.1"
                    defaultValue={row.percent}
                    className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                  <input
                    name="stage_days"
                    type="number"
                    defaultValue={row.days}
                    className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
                  />
                </div>
              ))}
            </fieldset>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
              >
                Подготовить договор
              </button>
            </div>
          </form>
        )}
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
