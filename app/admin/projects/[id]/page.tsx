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
import { contractStatusDict, problemsText } from "@/content/admin-panel/contracts";
import { DEFAULT_CONTRACT_STAGES } from "@/lib/admin/contracts";
import {
  partnerVoidDict,
  projectCardDict,
  projectResultDict,
  stageLabel,
} from "@/content/admin-panel/projects";
import {
  ACCRUAL_TR,
  DEAL_KINDS,
  KIND_TR,
  PURPOSES,
  PURPOSE_TR,
  accrualState,
  accrualsOf,
  canEditMoney,
  canSeeMoney,
  earnersOf,
  money as formatMoney,
  ownerShare,
  paidOf,
  profitOf,
  taxOf,
  visibleStaff,
} from "@/lib/admin/finance";
import { optionsFor } from "@/content/calculator";
import { requireStaff } from "@/lib/admin/guard";
import { ProjectTasksBlock } from "@/components/admin/tasks-block";
import { pick, tr, type Msg, type Tr } from "@/lib/admin/i18n";
import { categoryChoices, quoteFor } from "@/lib/admin/quote";
import { t as siteText } from "@/lib/i18n";
import { seesOwnerMoney } from "@/lib/admin/roles";
import { loadPeople, paymentsFor, sharesFor, sharesOf } from "@/lib/admin/ledger";
import {
  ALL_STAGES,
  STAGES,
  canEditProjectData,
  daysOnStage,
  projectById,
  stageProgress,
} from "@/lib/admin/projects";
import { teamOf } from "@/lib/admin/team";
import { agencyCounts, partnerAccrualOf } from "@/lib/partners/rules";
import { agenciesOf, listPartners, partnerById } from "@/lib/partners/store";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm disabled:opacity-60";

/**
 * Ответ действий: `?r=код` → текст из словаря (projectResultDict) и тон.
 * Незнакомый код — «Не получилось», как и раньше.
 */
const OK_CODES = new Set(["ok", "paid"]);

/** Подпись из таблицы по ключу, который пришёл из базы; незнакомый — как есть. */
function labelOf(dict: Record<string, Tr<Msg> | undefined>, key: string, locale: Parameters<typeof tr>[1]): string {
  const entry = dict[key];
  const value = entry ? tr(entry, locale) : key;
  return typeof value === "string" ? value : key;
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
  searchParams: Promise<{ r?: string; contract?: string; detail?: string; t?: string }>;
}) {
  const staff = await requireStaff();
  const locale = staff.panel_locale;
  const t = pick(projectCardDict, locale);
  const results = pick(projectResultDict, locale);
  const money = (usd: number | null) => formatMoney(usd, locale);
  const { id } = await params;
  const { r, contract: contractError, detail: contractDetail, t: taskNotice } = await searchParams;

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
  const notice = r
    ? { text: r in results ? results[r as keyof typeof results] : results.failed, tone: OK_CODES.has(r) ? "ok" : "warn" }
    : null;

  /**
   * Почему договор не подготовился. Раньше форма молча возвращала на карточку:
   * человек видел ту же пустую форму и не понимал, что не так.
   */
  const contractErrorText = (code: string, detail: string | undefined): string => {
    if (code === "forbidden") return t.contractForbidden;
    if (code === "offline") return t.contractOffline;
    if (code === "invalid" && detail) return t.contractInvalid(problemsText(detail, locale, "; "));
    return t.contractFailed;
  };

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

  // Партнёрская строка: ставка — по сумме проекта (rules.ts, PARTNER_TIERS).
  const partnerLine = partner ? partnerAccrualOf(project, payments, partner) : null;
  // Подключённые агентства — для выбора «Заказ агентства» в блоке «Партнёр».
  // В списке — агентства в сроке (12 месяцев с подтверждения) и то, что уже
  // стоит на проекте: проект, привязанный внутри срока, за агентством и остаётся.
  const partnerAgencies = isAdmin
    ? (await agenciesOf("all")).filter((a) => agencyCounts(a) || a.id === project.partner_agency_id)
    : [];
  const projectAgency = partnerAgencies.find((a) => a.id === project.partner_agency_id) ?? null;
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
  const quote = quoteInput ? quoteFor(quoteInput, locale) : null;
  // Как и деньги: свой проект и владелец. Руководитель смотрит, не правит.
  const editsQuote = staff.role === "admin" || project.owner_staff_id === staff.id;
  const nameOf = (staffId: string | null) => people.find((p) => p.id === staffId)?.display_name ?? "—";

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/projects" className="text-sm text-muted hover:text-text">
        {t.back}
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
        {project.client || t.noClient}
        {project.owner_name ? t.ledBy(project.owner_name) : ""}
      </p>

      {/* Задачи по проекту — первыми: это то, что по нему надо сделать
          сейчас. Поставить новую — на главной, с этим проектом в форме. */}
      <div className="mt-6">
        <ProjectTasksBlock staff={staff} projectId={project.id} notice={taskNotice} />
      </div>

      {/* ── Стадия ──────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-faint">
            {t.stage}
            <HelpHint topic={helpAnchor("/admin/projects", "stages")} label={t.stageHelp} />
          </span>
          <span className="text-sm">{stageLabel(project.stage, locale)}</span>
          <span className="text-xs text-faint">
            {days === 0 ? t.sinceToday : t.days(days)}
            {t.since(when(project.stage_since, locale))}
          </span>
        </div>

        {progress === null ? (
          <p className="mt-3 text-xs text-faint">
            {t.offLine}
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
                  {stageLabel(stage, locale)}
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
                  {stageLabel(stage, locale)}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="mt-4 border-t border-line-soft pt-4 text-xs text-faint">
            {t.stageByAdmin}
          </p>
        )}
      </section>

      {/* ── Смета ───────────────────────────────────────────────────── */}
      {/* Стоит перед деньгами намеренно: сумму по договору ставят после
          того, как посчитали порог, а не до. */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="text-xs uppercase tracking-wider text-faint">{t.quote}</h2>

        {quote ? (
          <QuoteCard quote={quote} locale={locale} />
        ) : (
          <p className="mt-2 text-sm text-muted">
            {t.noQuote}
          </p>
        )}

        {editsQuote ? (
          <form action={saveQuote} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="project" value={project.id} />

            <label className="block sm:col-span-2">
              <span className="text-xs text-faint">{t.category}</span>
              <select name="category" defaultValue={quoteInput?.category ?? ""} className={`${FIELD} mt-1`}>
                <option value="" disabled>
                  {t.choose}
                </option>
                {categoryChoices(locale).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
              {quoteInput ? null : (
                <span className="mt-1 block text-xs text-faint">
                  {t.extrasAfterSave}
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-xs text-faint">{t.promisedWeeks}</span>
              <input
                name="weeks"
                inputMode="numeric"
                defaultValue={quoteInput?.weeks ?? ""}
                placeholder={quote?.weeksLow ? t.estimatedWeeks(quote.weeksLow, quote.weeksHigh ?? quote.weeksLow) : ""}
                className={`${FIELD} mt-1`}
              />
            </label>

            {quoteInput
              ? optionsFor(quoteInput.category).map((option) => {
                  const value = quoteInput.selection[option.id];
                  const label = siteText(option.label, locale);
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
                              {siteText(choice.label, locale)}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={option.id} className="block">
                      <span className="text-xs text-faint">
                        {label}
                        {t.upTo(siteText(option.unitLabel, locale), option.max)}
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
                {t.saveQuote}
              </button>
              {quoteInput ? (
                <button type="submit" name="clear" value="1" className="text-xs text-faint hover:text-gold">
                  {t.clearQuote}
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="mt-3 text-xs text-faint">{t.quoteWho}</p>
        )}
      </section>

      {/* ── Деньги ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          {t.money}
          <HelpHint topic={helpAnchor("/admin/projects", "card")} label={t.moneyHelp} />
        </h2>

        <form action={saveMoney} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="project" value={project.id} />

          <label className="block">
            <span className="text-xs text-faint">{t.dealKind}</span>
            <select name="kind" defaultValue={project.kind} disabled={!editsMoney} className={`${FIELD} mt-1`}>
              {DEAL_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {tr(KIND_TR[kind], locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-faint">{t.contractAmount}</span>
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
                <span className="text-xs text-faint">{t.taxPercent}</span>
                <input name="tax" inputMode="numeric" defaultValue={project.tax_percent} className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">{t.devCost}</span>
                <input
                  name="cost"
                  inputMode="numeric"
                  defaultValue={project.dev_cost_usd ?? ""}
                  placeholder={t.afterContract}
                  className={`${FIELD} mt-1`}
                />
              </label>
            </>
          ) : (
            <p className="text-xs text-faint sm:col-span-2 sm:self-end">
              {t.taxByOwner}
            </p>
          )}

          <div className="sm:col-span-4">
            {editsMoney ? (
              <button
                type="submit"
                className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
              >
                {t.save}
              </button>
            ) : (
              <p className="text-xs text-faint">
                {paid > 0 ? t.paidOwnerOnly : t.moneyWho}
              </p>
            )}
          </div>
        </form>

        {project.amount_usd !== null ? (
          <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm sm:grid-cols-4">
            {isAdmin ? (
              <div>
                <dt className="text-xs text-faint">{t.tax}</dt>
                <dd className="font-mono">{money(taxOf(project))}</dd>
              </div>
            ) : null}
            {isAdmin ? (
            <div>
              <dt className="text-xs text-faint">{t.profit}</dt>
              <dd className={`font-mono ${profit !== null && profit < 0 ? "text-gold" : ""}`}>
                {money(profit)}
                {project.dev_cost_usd === null ? (
                  <span className="ml-2 font-sans text-xs text-gold">{t.noCost}</span>
                ) : null}
              </dd>
            </div>
            ) : null}
            <div>
              <dt className="text-xs text-faint">{t.paid}</dt>
              <dd className="font-mono">
                {money(paid)}
                <span
                  className={`ml-2 font-sans text-xs ${
                    state === "earned" ? "text-green" : state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {project.stage === "cancelled"
                    ? t.projectCancelled
                    : state === "earned"
                      ? t.paidFull
                      : t.paidOf(money(project.amount_usd))}
                </span>
              </dd>
            </div>
            {ownerMoney ? (
              <div>
                <dt className="text-xs text-faint">{t.ownerLeft}</dt>
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
                  {a.share === "head" ? t.shareHead : t.shareLeads} · {a.percent} %
                  {a.manual ? t.manual : t.byGradeTail}
                </span>
                <span className="font-mono">{money(a.amount_usd)}</span>
                <span
                  className={`text-xs ${
                    a.state === "earned" ? "text-green" : a.state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {tr(ACCRUAL_TR[a.state], locale)}
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
                      aria-label={t.sharePercentAria}
                      className="w-16 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-faint">%</span>
                    <button type="submit" className="text-xs text-faint hover:text-green">
                      {t.setShare}
                    </button>
                    {a.manual ? (
                      <button type="submit" name="reset" value="1" className="text-xs text-faint hover:text-gold">
                        {t.byGrade}
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
            <p className="text-xs uppercase tracking-wider text-faint">{t.partner}</p>
            {partner && partnerLine ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span>{partner.name}</span>
                <span className="font-mono text-xs text-muted">{partner.code}</span>
                <span className="text-xs text-faint">
                  {partnerLine.percent} % {partnerLine.model === "turnover" ? t.fromTurnover : t.fromProfit}
                  {partnerLine.manual ? t.manual : t.byAmount}
                  {projectAgency ? t.agency(projectAgency.name) : ""}
                </span>
                <span className="font-mono">{money(partnerLine.amount_usd)}</span>
                <span
                  className={`text-xs ${
                    partnerLine.state === "earned" ? "text-green" : partnerLine.state === "void" ? "text-faint" : "text-gold"
                  }`}
                >
                  {partnerLine.void_reason
                    ? t.notCounted(labelOf(partnerVoidDict, partnerLine.void_reason, locale))
                    : tr(ACCRUAL_TR[partnerLine.state], locale)}
                </span>
              </p>
            ) : partner ? (
              <p className="mt-2 text-sm">
                {partner.name} <span className="font-mono text-xs text-muted">{partner.code}</span>
                <span className="ml-2 text-xs text-faint">{t.partnerNoAmount}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-faint">{t.noPartner}</p>
            )}

            {isAdmin ? (
              // Владелец правит привязку руками: клиент мог прийти по слову, а не
              // по ссылке, — или наоборот, привязку надо снять.
              <form action={savePartner} className="mt-3 grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="project" value={project.id} />
                <label className="block">
                  <span className="text-xs text-faint">{t.broughtBy}</span>
                  <select name="partner" defaultValue={project.partner_id ?? ""} className={`${FIELD} mt-1`}>
                    <option value="">{t.withoutPartner}</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-faint">{t.partnerPercent}</span>
                  <input
                    name="percent"
                    inputMode="numeric"
                    placeholder={t.byTier}
                    defaultValue={project.partner_percent ?? ""}
                    className={`${FIELD} mt-1`}
                  />
                </label>
                {partnerAgencies.length ? (
                  <label className="block">
                    <span className="text-xs text-faint">{t.agencyOrder}</span>
                    <select name="agency" defaultValue={project.partner_agency_id ?? ""} className={`${FIELD} mt-1`}>
                      <option value="">{t.notAgency}</option>
                      {partnerAgencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {partners.find((p) => p.id === a.partner_id)?.name ?? "—"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-xs text-faint">{t.voidReason}</span>
                  <input
                    name="void_reason"
                    maxLength={64}
                    placeholder={t.voidEmpty}
                    defaultValue={project.partner_void_reason ?? ""}
                    className={`${FIELD} mt-1`}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {/* Платежи клиента */}
        <div className="mt-4 border-t border-line-soft pt-4">
          <p className="text-xs uppercase tracking-wider text-faint">{t.payments}</p>
          {payments.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-xs text-muted">{day(payment.paid_on)}</span>
                  <span className="font-mono">{money(payment.amount_usd)}</span>
                  <span className="text-xs text-faint">
                    {tr(PURPOSE_TR[payment.purpose], locale)}
                    {payment.note ? ` · ${payment.note}` : ""}
                    {payment.confirmed_name ? t.confirmedBy(payment.confirmed_name) : ""}
                  </span>
                  {isAdmin ? (
                    <form action={deletePayment}>
                      <input type="hidden" name="project" value={project.id} />
                      <input type="hidden" name="payment" value={payment.id} />
                      <button type="submit" className="text-xs text-faint hover:text-gold">
                        {t.delete}
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-faint">{t.noPayments}</p>
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
                  {t.awaitingInvoice(invoice.number, money(Math.round(invoice.amount_usd)), invoice.paid_by_name ?? "")}{" "}
                  <Link href={`/admin/contracts/${invoice.contract_id}`} className="underline hover:text-text">
                    {isAdmin ? t.confirmInContract : t.openContract}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {isAdmin ? (
            <form action={confirmPayment} className="mt-3 grid gap-3 sm:grid-cols-5">
              <input type="hidden" name="project" value={project.id} />
              <label className="block">
                <span className="text-xs text-faint">{t.amountUsd}</span>
                <input name="amount" required inputMode="numeric" className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">{t.date}</span>
                <input name="paid_on" type="date" className={`${FIELD} mt-1`} />
              </label>
              <label className="block">
                <span className="text-xs text-faint">{t.purpose}</span>
                <select name="purpose" defaultValue="advance" className={`${FIELD} mt-1`}>
                  {PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {tr(PURPOSE_TR[purpose], locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-faint">{t.note}</span>
                <input name="note" maxLength={500} className={`${FIELD} mt-1`} />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
                >
                  {t.recordPayment}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-xs text-faint">{t.paymentsByOwner}</p>
          )}
        </div>
      </section>

      {/* ── Правки ──────────────────────────────────────────────────── */}
      <section className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          {t.data}
          <HelpHint topic={helpAnchor("/admin/projects", "data")} label={t.dataHelp} />
        </h2>
        {isAdmin && ownerLeads ? (
          <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
            {t.ownerLeadsWarn}
          </p>
        ) : null}

        {!canEditData ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-faint">{t.leads}</dt>
              <dd>{project.owner_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">{t.client}</dt>
              <dd>{project.client ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">{t.deadline}</dt>
              <dd>{project.deadline ?? "—"}</dd>
            </div>
            {project.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-faint">{t.notes}</dt>
                <dd className="whitespace-pre-line">{project.notes}</dd>
              </div>
            ) : null}
            <p className="text-xs text-faint sm:col-span-2">
              {t.dataWho}
            </p>
          </dl>
        ) : (
        <form action={editProject} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="project" value={project.id} />

          {isAdmin ? (
            <label className="block sm:col-span-2">
              <span className="text-xs text-faint">{t.leadsAccrual}</span>
              <select name="owner" defaultValue={project.owner_staff_id ?? ""} required className={`${FIELD} mt-1`}>
                {project.owner_staff_id ? null : (
                  <option value="" disabled>
                    {t.choose}
                  </option>
                )}
                {leaders.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name}
                    {person.role === "admin" ? t.noTeamAccrual : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs text-faint">{t.title}</span>
            <input name="title" required maxLength={200} defaultValue={project.title} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">{t.client}</span>
            <input name="client" maxLength={200} defaultValue={project.client ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block">
            <span className="text-xs text-faint">{t.deadline}</span>
            <input name="deadline" type="date" defaultValue={project.deadline ?? ""} className={`${FIELD} mt-1`} />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-faint">{t.notes}</span>
            <textarea name="notes" rows={4} maxLength={4000} defaultValue={project.notes ?? ""} className={`${FIELD} mt-1 resize-y`} />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
            >
              {t.save}
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
            {t.contract}
          </h2>
          <Link href="/admin/contracts" className="text-xs text-muted hover:text-green">
            {t.howItWorks}
          </Link>
        </div>

        {contractError ? (
          <p className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
            {contractErrorText(contractError, contractDetail)}
          </p>
        ) : null}

        {voidContracts.length ? (
          <p className="mt-3 text-xs text-faint">
            {t.voided}{" "}
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
                  № {c.number} — {labelOf(contractStatusDict, c.status, locale)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <form action={prepareContract} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="project_id" value={project.id} />
            <label className="text-xs text-muted">
              {t.contractDate}
              <input
                type="date"
                name="signed_date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              {t.amountUsd}
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
              {t.clientName}
              <input
                type="text"
                name="client_name"
                required
                defaultValue={project.client ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              {t.clientDetails}
              <input
                type="text"
                name="client_details"
                required
                placeholder={t.clientDetailsPh}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            {/* Банк заказчика — отдельными полями, а не внутри адреса.
                Номер счёта, набранный в предложении, нельзя ни проверить,
                ни перенести в платёжку, не перечитывая фразу целиком. */}
            <label className="text-xs text-muted">
              {t.clientTaxId}
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
              {t.clientBank}
              <input
                type="text"
                name="client_bank_name"
                required
                placeholder={t.clientBankPh}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              {t.clientAccount}
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
              {t.clientMfo}
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
              {t.subject}
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
                {t.stages}
              </legend>
              {/* Названия этапов — заготовка текста договора, а договор
                  пишется по-русски: они не переводятся (DEFAULT_CONTRACT_STAGES). */}
              {DEFAULT_CONTRACT_STAGES.map((row, i) => (
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
                {t.prepare}
              </button>
            </div>
          </form>
        )}
      </section>

      {project.lead_id ? (
        <p className="mt-4 text-sm">
          <Link href={`/admin/leads/${project.lead_id}`} className="text-blue-soft hover:underline">
            {t.fromLead}
          </Link>
        </p>
      ) : null}

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-faint">
        {t.journalNote}
      </p>
    </AdminShell>
  );
}
