import { Letterhead } from "@/components/docs/letterhead";
import { company, USD_RATE } from "@/content/company";
import type { Contract } from "@/lib/admin/contracts";
import type { Invoice } from "@/lib/admin/invoices";
import { sellerBank, taxIdKind } from "@/lib/store/requisites";

const money = (value: number) => value.toLocaleString("ru-RU");

/**
 * Счёт на оплату — один и тот же у менеджера и у заказчика.
 *
 * Тот же бланк, что у договора: два разных бланка у одной студии читаются
 * как два разных отправителя, и первым это замечает бухгалтер заказчика.
 *
 * Про доступ компонент не знает: подпись приходит адресом. В панели это
 * внутренний маршрут с проверкой сессии, у заказчика — маршрут по токену.
 */
export function InvoiceDocument({
  contract,
  invoice,
  signatureSrc,
}: {
  contract: Contract;
  invoice: Invoice;
  signatureSrc: string;
}) {
  const bank = sellerBank();
  if (!bank) return null;

  const stage = contract.stages[invoice.stage_index];
  const legal = company.legal;
  const taxLabel = taxIdKind() === "pinfl" ? "ПИНФЛ" : "ИНН";
  const uzs = Math.round(invoice.amount_usd * USD_RATE);

  return (
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
            src={signatureSrc}
            alt=""
            className="absolute -top-10 left-2 h-20 w-auto"
          />
        </div>
        <p className="text-[9.5pt]">{legal.name}</p>
      </section>
    </Letterhead>
  );
}
