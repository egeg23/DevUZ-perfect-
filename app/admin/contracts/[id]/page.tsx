import { notFound } from "next/navigation";

import { ContractDocument } from "@/components/docs/contract-document";
import { PrintButton } from "@/components/store/print-button";
import { HelpHint } from "@/components/admin/help-link";
import { helpAnchor } from "@/lib/admin/help";
import { signatureVisible } from "@/lib/admin/contracts";
import { sellerBank } from "@/lib/store/requisites";
import { invoicesFor } from "@/lib/admin/invoice-store";
import { BLOCK_TEXT, canIssue, stageAmountUsd } from "@/lib/admin/invoices";
import { siteUrl } from "@/lib/seo";
import { contractById } from "@/lib/admin/contract-store";
import { approvesContract } from "@/lib/admin/contracts";
import {
  cancelContract,
  confirmContract,
  issueInvoiceAction,
  issueLinkAction,
  markInvoicePaidAction,
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
  searchParams: Promise<{ error?: string; detail?: string; hint?: string; sent?: string; signed?: string; link?: string }>;
}) {
  const staff = await requireStaff();
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
  const { error, detail, hint, sent, signed: justSigned, link } = await searchParams;
  const canApprove = approvesContract(staff.role);

  return (
    <>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label="Печать" />
        <span className="inline-flex items-center gap-1.5 text-sm text-black/60">
          Как пользоваться <HelpHint topic={helpAnchor("/admin/contracts", "review")} label="Как пользоваться разделом" />
        </span>
        <span className="text-sm text-black/60">
          {contract.status === "draft" && "Черновик — подписи нет"}
          {contract.status === "pending" && "Отправлен владельцу на подпись"}
          {contract.status === "approved" && "Подтверждён владельцем"}
          {contract.status === "signed" && "Подписан обеими сторонами"}
          {contract.status === "void" && `Отменён: ${contract.void_reason}`}
        </span>

        {signed && !hasSignatureFile ? (
          <span className="text-sm font-semibold text-red-700">
            Договор подтверждён, но файл подписи не загружен
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
              Отправить на подпись
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
                Подтвердить и подписать
              </button>
            </form>
            <form action={returnContract}>
              <input type="hidden" name="id" value={contract.id} />
              <button type="submit" className="text-sm text-black/60 underline">
                Вернуть на доработку
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
              Загрузить подписанный
            </button>
          </form>
        ) : null}

        {contract.estimate_path ? (
          <a href={`/admin/contracts/${contract.id}/file`} className="text-sm underline">
            Смета: {contract.estimate_name}
          </a>
        ) : null}
        {contract.signed_path ? (
          <a href={`/admin/contracts/${contract.id}/file?kind=signed`} className="text-sm underline">
            Скан с подписями
          </a>
        ) : null}

        {canApprove && contract.status === "approved" ? (
          <form action={cancelContract} className="flex items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input
              type="text"
              name="reason"
              required
              placeholder="Причина отмены"
              className="rounded-lg border border-black/20 px-2 py-1 text-sm"
            />
            <button type="submit" className="text-sm text-red-700 hover:underline">
              Отменить
            </button>
          </form>
        ) : null}
      </div>

      {/* ── Счета на оплату ──────────────────────────────────────────── */}
      {contract.status === "approved" || contract.status === "signed" ? (
        <div className="no-print mx-auto mb-6 max-w-[210mm] px-[20mm]">
          <div className="rounded-xl border border-black/15 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              Счета на оплату
              <HelpHint topic={helpAnchor("/admin/contracts", "invoices")} label="Как работают счета" />
            </p>
            <p className="mt-1 text-xs text-black/60">
              По договору каждый этап оплачивается авансом в 100% его стоимости, поэтому
              счёт выставляется на этап, а не на всю сумму. Счёт на первый этап выставлен
              вместе с подтверждением.
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
                      Этап {index + 1}. {stage.title}
                    </span>
                    <span className="font-mono">${amount.toLocaleString("ru-RU")}</span>

                    {invoice ? (
                      <>
                        <a
                          href={`/admin/contracts/${contract.id}/invoice/${invoice.id}`}
                          className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5"
                        >
                          Счёт № {invoice.number}
                        </a>
                        {invoice.paid_at ? (
                          <span className="text-xs text-green-700">оплачен</span>
                        ) : (
                          <>
                            <span className="text-xs text-black/50">до {invoice.due_at}</span>
                            <form action={markInvoicePaidAction}>
                              <input type="hidden" name="id" value={contract.id} />
                              <input type="hidden" name="invoice" value={invoice.id} />
                              <button type="submit" className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5">
                                Оплачен
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
                          Выставить счёт
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-black/50">{BLOCK_TEXT[block]}</span>
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
                  {contract.access_hash ? "Выпустить новую ссылку" : "Ссылка для заказчика"}
                </button>
              </form>
              <span className="text-xs text-black/50">
                {contract.access_hash
                  ? "ссылка уже выпущена; новая отменит прежнюю"
                  : "по ней заказчик откроет договор и счета, без пароля"}
              </span>
            </div>

            {link ? (
              <p className="mt-2 break-all rounded-lg border border-green-600/40 bg-green-50 px-3 py-2 font-mono text-xs">
                {siteUrl}/ru/contract/{link}
                <span className="block font-sans text-black/60">
                  Скопируйте сейчас — второй раз эта ссылка не покажется.
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
              Загрузить смету
            </button>
            <span className="text-xs text-black/50">
              CSV и TSV разбираются построчно, остальное прикладывается файлом
            </span>
          </form>

          <form action={saveDeadline} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={contract.id} />
            <input
              type="text"
              name="deadline"
              defaultValue={contract.deadline_text ?? ""}
              placeholder="60 рабочих дней с даты аванса"
              className="w-80 rounded-lg border border-black/20 px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded-lg border border-black/30 px-3 py-1.5 text-sm">
              Срок
            </button>
          </form>
        </div>
      ) : null}

      {hint ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {decodeURIComponent(hint)}
        </p>
      ) : null}
      {sent === "1" ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] text-sm text-green-800">
          Отправлено. Владельцу ушло уведомление в Telegram.
        </p>
      ) : null}
      {sent === "silent" ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          Договор отправлен, но уведомление в Telegram не ушло — скажите владельцу голосом.
        </p>
      ) : null}
      {justSigned ? (
        <p className="no-print mx-auto mb-4 max-w-[210mm] text-sm text-green-800">
          Подписанный договор сохранён.
        </p>
      ) : null}

      {error ? (
        <p className="no-print mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          {error === "invalid" && detail
            ? `Не хватает: ${decodeURIComponent(detail)}`
            : error === "forbidden"
              ? "Подтвердить договор может только владелец."
              : error === "locked"
                ? "Договор уже подтверждён или отменён."
                : "Не получилось. Попробуйте ещё раз."}
        </p>
      ) : null}

      <ContractDocument
        contract={contract}
        signatureSrc={`/admin/contracts/${contract.id}/signature`}
        hasSignatureFile={hasSignatureFile}
      />
    </>
  );
}
