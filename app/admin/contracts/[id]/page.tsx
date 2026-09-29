import { notFound } from "next/navigation";

import { ContractDocument } from "@/components/docs/contract-document";
import { PrintButton } from "@/components/store/print-button";
import { HelpHint } from "@/components/admin/help-link";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import {
  contractBadgeDict,
  contractCardDict,
  contractErrorDict,
  estimateHintDict,
  problemsText,
} from "@/content/admin-panel/contracts";
import { PANEL_INTL, pick } from "@/lib/admin/i18n";
import { helpAnchor } from "@/lib/admin/help";
import { DEADLINE_EXAMPLE, ESTIMATE_ROWS_EXAMPLE, signatureVisible } from "@/lib/admin/contracts";
import { sellerBank } from "@/lib/store/requisites";
import { invoicesFor } from "@/lib/admin/invoice-store";
import { canIssue, invoiceState, stageAmountUsd } from "@/lib/admin/invoices";
import { siteUrl } from "@/lib/seo";
import { contractById } from "@/lib/admin/contract-store";
import { approvesContract } from "@/lib/admin/contracts";
import {
  cancelContract,
  confirmContract,
  issueInvoiceAction,
  issueLinkAction,
  markInvoicePaidAction,
  pasteEstimate,
  confirmInvoicePaymentAction,
  unmarkInvoicePaidAction,
  returnContract,
  saveDeadline,
  sendToOwner,
  uploadEstimate,
  uploadSignedScan,
} from "@/app/admin/contracts/actions";
import { requireStaff } from "@/lib/admin/guard";
import { signatureExists } from "@/lib/admin/signature";

export const dynamic = "force-dynamic";

/**
 * Печатная страница договора.
 *
 * Один экран — один документ, готовый к печати и подписанию. Нумерация
 * разделов проставляется здесь, а не в тексте: пункты в `content/contract.ts`
 * хранятся списком, и вставка нового раздела не должна означать ручную
 * перенумерацию всего документа.
 *
 * Подпись владельца — картинка по защищённому адресу, который отдаёт её
 * только для подтверждённого договора. У черновика на этом месте пустая
 * линия, и это видно на просвет: черновик нельзя выдать за подписанный,
 * просто распечатав.
 */
export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    detail?: string;
    hint?: string;
    sent?: string;
    signed?: string;
    link?: string;
    paid?: string;
  }>;
}) {
  const staff = await requireStaff();
  const locale = staff.panel_locale;
  const t = pick(contractCardDict, locale);
  const badge = pick(contractBadgeDict, locale);
  const errors = pick(contractErrorDict, locale);
  const hints = pick(estimateHintDict, locale);
  const { id } = await params;
  const contract = await contractById(id);
  if (!contract) notFound();

  const signed = signatureVisible(contract);
  const hasSignatureFile = signed ? await signatureExists() : false;
  // Реквизиты студии — из окружения, оттуда же, откуда их берёт счёт.
  // Второй копии в content/ нет намеренно: расчётный счёт в git не кладём,
  // а разъехавшиеся счёт в договоре и счёт в счёте — это платёж, ушедший
  // не туда, и спор о том, кто виноват.
  const seller = sellerBank();
  const invoices = await invoicesFor(contract.id);
  const issuedStages = invoices.map((invoice) => invoice.stage_index);
  const { error, detail, hint, sent, signed: justSigned, link, paid } = await searchParams;
  const canApprove = approvesContract(staff.role);

  /** Что сказать после «Оплачен» — у владельца и у сотрудника исход разный. */
  const paidText: Record<string, string> = {
    confirmed: t.paidConfirmedText,
    awaiting: t.paidAwaitingText,
    unmarked: t.unmarkedText,
  };

  // Подсказка разбора сметы — кодом; старая ссылка с текстом — как есть.
  const hintText = hint ? (hint in hints ? hints[hint as keyof typeof hints] : hint) : null;

  // Отказ — кодом (contract-store, invoice-store); незнакомый код — «не
  // получилось», старая ссылка с русским текстом — как есть.
  const errorText = !error
    ? null
    : error === "invalid" && detail
      ? errors.missing(problemsText(detail, locale, " · "))
      : error in errors && typeof errors[error as keyof typeof errors] === "string"
        ? (errors[error as keyof typeof errors] as string)
        : /^[a-z_]+$/.test(error)
          ? errors.failed
          : error;

  // Своей шапки у страницы договора нет: язык для «?» ставится здесь.
  return (
    <PanelLocaleProvider locale={locale}>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label={t.print} />
        <span className="inline-flex items-center gap-1.5 text-sm text-black/60">
          {t.howTo} <HelpHint topic={helpAnchor("/admin/contracts", "review")} label={t.howToLabel} />
        </span>
        <span className="text-sm text-black/60">
          {contract.status === "draft" && badge.draft}
          {contract.status === "pending" && badge.pending}
          {contract.status === "approved" && badge.approved}
          {contract.status === "signed" && badge.signed}
          {contract.status === "void" && badge.void(contract.void_reason ?? "")}
        </span>

        {signed && !hasSignatureFile ? (
          <span className="text-sm font-semibold text-red-700">
            {t.noSignatureFile}
          </span>
        ) : null}

        {/* Отправка на подпись — действие менеджера. После неё документ
            замораживается: владельцу ушло уведомление со ссылкой, и то, что
            он открыл, не должно меняться под ним. */}
        {contract.status === "draft" ? (
          <form action={sendToOwner}>
            <input type="hidden" name="id" value={contract.id} />
            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              {t.sendToOwner}
            </button>
          </form>
        ) : null}

        {canApprove && contract.status === "pending" ? (
          <>
            <form action={confirmContract}>
              <input type="hidden" name="id" value={contract.id} />
              <button
                type="submit"
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                {t.approve}
              </button>
            </form>
            <form action={returnContract}>
              <input type="hidden" name="id" value={contract.id} />
              <button type="submit" className="text-sm text-black/60 underline">
                {t.returnBack}
              </button>
            </form>
          </>
        ) : null}

        {/* Скан с подписями обеих сторон — возвращает менеджер. */}
        {contract.status === "approved" ? (
          <form action={uploadSignedScan} className="flex items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input type="file" name="signed" accept=".pdf,image/*" required className="text-sm" />
            <button type="submit" className="rounded-xl border border-black/30 px-3 py-1.5 text-sm">
              {t.uploadSigned}
            </button>
          </form>
        ) : null}

        {contract.estimate_path ? (
          <a href={`/admin/contracts/${contract.id}/file`} className="text-sm underline">
            {t.estimateFile(contract.estimate_name ?? "")}
          </a>
        ) : null}
        {contract.signed_path ? (
          <a href={`/admin/contracts/${contract.id}/file?kind=signed`} className="text-sm underline">
            {t.signedScan}
          </a>
        ) : null}

        {canApprove && contract.status === "approved" ? (
          <form action={cancelContract} className="flex items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input
              type="text"
              name="reason"
              required
              placeholder={t.cancelReason}
              className="rounded-lg border border-black/20 px-2 py-1 text-sm"
            />
            <button type="submit" className="text-sm text-red-700 hover:underline">
              {t.cancel}
            </button>
          </form>
        ) : null}
      </div>

      {/* ── Счета на оплату ──────────────────────────────────────────── */}
      {contract.status === "approved" || contract.status === "signed" ? (
        <div className="no-print mx-auto mb-6 max-w-[210mm] px-[20mm]">
          <div className="rounded-xl border border-black/15 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              {t.invoices}
              <HelpHint topic={helpAnchor("/admin/contracts", "invoices")} label={t.invoicesHelp} />
            </p>
            <p className="mt-1 text-xs text-black/60">
              {t.invoicesNote}
            </p>

            <ul className="mt-3 space-y-2">
              {contract.stages.map((stage, index) => {
                const invoice = invoices.find((item) => item.stage_index === index);
                const amount = stageAmountUsd(contract.amount_usd, contract.stages, index);
                const block = canIssue({
                  status: contract.status,
                  stages: contract.stages,
                  stageIndex: index,
                  issuedStages,
                  hasBank: Boolean(seller),
                });

                return (
                  <li key={index} className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-2 text-sm">
                    <span className="min-w-[14rem]">
                      {t.stage(index + 1, stage.title)}
                    </span>
                    <span className="font-mono">${amount.toLocaleString(PANEL_INTL[locale])}</span>

                    {invoice ? (
                      <>
                        <a
                          href={`/admin/contracts/${contract.id}/invoice/${invoice.id}`}
                          className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5"
                        >
                          {t.invoiceNo(invoice.number)}
                        </a>
                        {invoiceState(invoice) === "confirmed" ? (
                          <span className="text-xs text-green-700">{t.paidConfirmed}</span>
                        ) : invoiceState(invoice) === "awaiting" ? (
                          <>
                            <span className="text-xs text-amber-800">{t.paidAwaiting}</span>
                            {staff.role === "admin" ? (
                              <>
                                <form action={confirmInvoicePaymentAction}>
                                  <input type="hidden" name="id" value={contract.id} />
                                  <input type="hidden" name="invoice" value={invoice.id} />
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-black px-3 py-1 text-xs font-semibold text-white"
                                  >
                                    {t.confirmPayment}
                                  </button>
                                </form>
                                <form action={unmarkInvoicePaidAction}>
                                  <input type="hidden" name="id" value={contract.id} />
                                  <input type="hidden" name="invoice" value={invoice.id} />
                                  <button type="submit" className="text-xs text-black/60 underline">
                                    {t.notPaid}
                                  </button>
                                </form>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-black/50">{t.dueUntil(invoice.due_at)}</span>
                            <form action={markInvoicePaidAction}>
                              <input type="hidden" name="id" value={contract.id} />
                              <input type="hidden" name="invoice" value={invoice.id} />
                              <button type="submit" className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5">
                                {t.markPaid}
                              </button>
                            </form>
                          </>
                        )}
                      </>
                    ) : block === "ok" ? (
                      <form action={issueInvoiceAction}>
                        <input type="hidden" name="id" value={contract.id} />
                        <input type="hidden" name="stage" value={index} />
                        <button type="submit" className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5">
                          {t.issue}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-black/50">{errors[block]}</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Ссылка для заказчика: одна на договор. В базе только хеш,
                поэтому показать её второй раз нельзя — можно выпустить
                новую, и старая тут же перестанет работать. */}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/10 pt-3">
              <form action={issueLinkAction}>
                <input type="hidden" name="id" value={contract.id} />
                <button type="submit" className="rounded-lg border border-black/30 px-3 py-1.5 text-sm hover:bg-black/5">
                  {contract.access_hash ? t.newLink : t.clientLink}
                </button>
              </form>
              <span className="text-xs text-black/50">
                {contract.access_hash ? t.linkExists : t.linkAbout}
              </span>
            </div>

            {link ? (
              <p className="mt-2 break-all rounded-lg border border-green-600/40 bg-green-50 px-3 py-2 font-mono text-xs">
                {siteUrl}/ru/contract/{link}
                <span className="block font-sans text-black/60">
                  {t.copyNow}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Смета и срок — только у черновика: дальше документ заморожен. */}
      {contract.status === "draft" ? (
        <div className="no-print mx-auto mb-6 max-w-[210mm] space-y-3 px-[20mm]">
          <form action={uploadEstimate} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input type="file" name="estimate" accept=".csv,.tsv,.txt,.xlsx,.pdf" required className="text-sm" />
            <button type="submit" className="rounded-lg border border-black/30 px-3 py-1.5 text-sm">
              {t.uploadEstimate}
            </button>
            <span className="text-xs text-black/50">
              {t.estimateFormats}
            </span>
          </form>

          {/* Строки текстом: скан, Word или смета, которой нет файлом.
              Из Excel строки копируются как есть — там они через табуляцию. */}
          <details open={Boolean(hint)} className="text-sm">
            <summary className="cursor-pointer text-black/70">{t.pasteRows}</summary>
            <form action={pasteEstimate} className="mt-2 space-y-2">
              <input type="hidden" name="id" value={contract.id} />
              <textarea
                name="rows"
                required
                rows={6}
                placeholder={ESTIMATE_ROWS_EXAMPLE}
                className="w-full rounded-lg border border-black/20 px-2 py-1 font-mono text-xs"
              />
              <p className="text-xs text-black/50">
                {t.pasteHowTo}
              </p>
              <button type="submit" className="rounded-lg border border-black/30 px-3 py-1.5 text-sm">
                {t.saveRows}
              </button>
            </form>
          </details>

          <form action={saveDeadline} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input
              type="text"
              name="deadline"
              defaultValue={contract.deadline_text ?? ""}
              placeholder={DEADLINE_EXAMPLE}
              className="w-80 rounded-lg border border-black/20 px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded-lg border border-black/30 px-3 py-1.5 text-sm">
              {t.deadline}
            </button>
          </form>
        </div>
      ) : null}

      {hintText ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {hintText}
        </p>
      ) : null}
      {sent === "1" ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] text-sm text-green-800">
          {t.sent}
        </p>
      ) : null}
      {sent === "silent" ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {t.sentSilent}
        </p>
      ) : null}
      {justSigned ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] text-sm text-green-800">
          {t.signedSaved}
        </p>
      ) : null}

      {paid && paidText[paid] ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] text-sm text-green-800">{paidText[paid]}</p>
      ) : null}

      {errorText ? (
        <p className="no-print mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {errorText}
        </p>
      ) : null}

      <ContractDocument
        contract={contract}
        signatureSrc={`/admin/contracts/${contract.id}/signature`}
        hasSignatureFile={hasSignatureFile}
      />
    </PanelLocaleProvider>
  );
}
