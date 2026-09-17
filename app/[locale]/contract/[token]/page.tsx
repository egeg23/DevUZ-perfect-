import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContractDocument } from "@/components/docs/contract-document";
import { PrintButton } from "@/components/store/print-button";
import { contractByToken } from "@/lib/admin/invoice-store";
import { invoicesFor } from "@/lib/admin/invoice-store";
import { overdue } from "@/lib/admin/invoices";
import { signatureExists } from "@/lib/admin/signature";
import { isLocale } from "@/lib/i18n";
import { looksLikeAccessToken } from "@/lib/store/access";

// Страница читает базу по токену из адреса: закэшированный ответ одного
// заказчика показался бы другому.
export const dynamic = "force-dynamic";

/**
 * Индексации нет и быть не может: здесь реквизиты сторон и суммы договора.
 * Мета-тега достаточно, а в robots.txt этот путь намеренно не попадает —
 * Disallow запрещает краулеру заходить на страницу, то есть и увидеть
 * noindex он тоже не сможет.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const money = (value: number) => value.toLocaleString("ru-RU");

/**
 * Договор и счета глазами заказчика.
 *
 * Без логина и пароля: пароль к одному договору никто не запомнит, а
 * «восстановить пароль» без подтверждённой почты упрётся в живого
 * менеджера. Доступ — неугадываемая ссылка; в базе лежит только её хеш.
 *
 * Текст договора здесь тот же компонент, что и в панели. Две вёрстки одного
 * документа расходятся на первой же правке, и расхождение обнаруживает та
 * сторона, которой оно выгодно.
 */
export default async function ClientContractPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  // Мусор в адресе до базы не доходит: незачем ходить с ним в запрос.
  if (!looksLikeAccessToken(token)) notFound();

  const contract = await contractByToken(token);
  if (!contract) notFound();
  // Черновик и отменённый по ссылке не открываются: заказчику показывают
  // то, что подписано, а не то, что ещё обсуждают внутри студии.
  if (contract.status !== "approved" && contract.status !== "signed") notFound();

  const [invoices, hasSignatureFile] = await Promise.all([
    invoicesFor(contract.id),
    signatureExists(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-white py-8 text-black">
      <div className="no-print mx-auto mb-4 max-w-[210mm] px-[20mm]">
        <PrintButton label="Печать договора" />
      </div>

      {invoices.length ? (
        <div className="no-print mx-auto mb-6 max-w-[210mm] px-[20mm]">
          <div className="rounded-xl border border-black/15 px-4 py-3">
            <p className="text-sm font-bold">Счета на оплату</p>
            <ul className="mt-2 space-y-1 text-sm">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap items-center gap-3">
                  <span>
                    Этап {invoice.stage_index + 1} — ${money(invoice.amount_usd)}
                  </span>
                  {invoice.paid_at ? (
                    <span className="text-xs text-green-700">оплачен</span>
                  ) : (
                    <span className={`text-xs ${overdue(invoice, today) ? "text-red-700" : "text-black/50"}`}>
                      {overdue(invoice, today) ? "срок прошёл" : `до ${invoice.due_at}`}
                    </span>
                  )}
                  <a
                    href={`/${locale}/contract/${token}/invoice/${invoice.id}`}
                    className="rounded-lg border border-black/30 px-3 py-1 text-xs hover:bg-black/5"
                  >
                    Счёт № {invoice.number}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <ContractDocument
        contract={contract}
        signatureSrc={`/api/contract/${token}/signature`}
        hasSignatureFile={hasSignatureFile}
      />
    </div>
  );
}
