import { notFound } from "next/navigation";

import { Letterhead } from "@/components/docs/letterhead";
import { PrintButton } from "@/components/store/print-button";
import { company, USD_RATE } from "@/content/company";
import { contractById } from "@/lib/admin/contract-store";
import { requireStaff } from "@/lib/admin/guard";
import { invoiceById } from "@/lib/admin/invoice-store";
import { sellerBank, taxIdKind } from "@/lib/store/requisites";

export const dynamic = "force-dynamic";

const money = (value: number) => value.toLocaleString("ru-RU");

/**
 * Счёт на оплату этапа.
 *
 * Собран на том же бланке, что и договор: два разных бланка у одной студии
 * читаются как два разных отправителя, и первым это замечает бухгалтер
 * заказчика.
 *
 * Подпись владельца здесь есть по той же причине, по которой она есть в
 * договоре: счёт без подписи в Узбекистане принимают не везде, а второй
 * подход к владельцу за подписью — это день простоя.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string; invoice: string }>;
}) {
  const staff = await requireStaff();
  const { id, invoice: invoiceId } = await params;

  const [contract, invoice] = await Promise.all([contractById(id), invoiceById(invoiceId)]);
  if (!contract || !invoice || invoice.contract_id !== contract.id) notFound();

  const bank = sellerBank();
  if (!bank) notFound();

  const stage = contract.stages[invoice.stage_index];
  const legal = company.legal;
  const taxLabel = taxIdKind() === "pinfl" ? "ПИНФЛ" : "ИНН";
  const uzs = Math.round(invoice.amount_usd * USD_RATE);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label="Печать" />
        <a href={`/admin/contracts/${contract.id}`} className="text-sm text-gray-600 hover:underline">
          ← к договору
        </a>
        <span className="text-sm text-gray-500">
          {invoice.paid_at ? "оплачен" : `оплатить до ${invoice.due_at}`} · открыл {staff.display_name}
        </span>
      </div>

      <Letterhead
        title={`Счёт на оплату № ${invoice.number}`}
        subtitle={`по договору № ${contract.number} от ${contract.signed_date}`}
        place="г. Ташкент"
        date={invoice.issued_at}
      >
        <section className="mt-4 grid grid-cols-2 gap-8 text-[10pt]">
          <div>
            <p className="font-bold">Поставщик</p>
            <p className="mt-1">{legal.name}</p>
            <p>{legal.address.ru}</p>
            <p>
              {taxLabel} {bank.taxId}
            </p>
            <p>{bank.bankName}</p>
            <p>р/с {bank.account}</p>
            <p>МФО {bank.mfo}</p>
            {bank.swift ? <p>SWIFT {bank.swift}</p> : null}
          </div>
          <div>
            <p className="font-bold">Покупатель</p>
            <p className="mt-1">{contract.client_name}</p>
            <p>{contract.client_details}</p>
            {contract.client_tax_id ? <p>ИНН / ПИНФЛ {contract.client_tax_id}</p> : null}
            {contract.client_bank_name ? <p>{contract.client_bank_name}</p> : null}
            {contract.client_account ? <p>р/с {contract.client_account}</p> : null}
            {contract.client_mfo ? <p>МФО {contract.client_mfo}</p> : null}
          </div>
        </section>

        <table className="mt-6 w-full border-collapse text-[10pt]">
          <thead>
            <tr className="border-y border-black">
              <th className="py-2 text-left font-bold">Наименование работ</th>
              <th className="py-2 text-right font-bold">Сумма, USD</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-2">
                {/* Этап называется так же, как в договоре: расхождение
                    названий — первый вопрос при сверке. */}
                Этап {invoice.stage_index + 1}. {stage?.title ?? "работы по договору"}
                {stage ? ` — ${stage.percent}% стоимости договора` : ""}
              </td>
              <td className="py-2 text-right font-mono">{money(invoice.amount_usd)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-2 text-right font-bold">Итого к оплате</td>
              <td className="py-2 text-right font-mono font-bold">{money(invoice.amount_usd)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Счёт в долларах, а платёж уходит на сумовый счёт. Назвать здесь
            фиксированную сумму в сумах значило бы назвать курс, которого в
            день платежа уже не будет, — и покупатель заплатит не ту сумму.
            Поэтому строка называет правило, а число даёт как ориентир. */}
        <p className="mt-4 text-[9.5pt]">
          Оплата в сумах по курсу ЦБ РУз на дату платежа (ориентировочно {money(uzs)} сум).
          Счёт действителен до {invoice.due_at}.
        </p>
        <p className="mt-1 text-[9.5pt]">
          В назначении платежа укажите: оплата по договору № {contract.number}, этап{" "}
          {invoice.stage_index + 1}.
        </p>

        <section className="mt-10 break-inside-avoid">
          <p className="text-[10pt]">Поставщик</p>
          <p className="mt-4">_______________________</p>
          <div className="relative h-16">
            {/* Подпись отдаётся тем же маршрутом, что и в договоре: он сам
                проверяет, что договор подтверждён владельцем. Второй копии
                этой проверки здесь нет намеренно — две копии разъезжаются. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/admin/contracts/${contract.id}/signature`}
              alt=""
              className="absolute -top-10 left-2 h-20 w-auto"
            />
          </div>
          <p className="text-[9.5pt]">{legal.name}</p>
        </section>
      </Letterhead>
    </div>
  );
}
