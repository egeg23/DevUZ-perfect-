import { Letterhead } from "@/components/docs/letterhead";
import { company } from "@/content/company";
import { contractClauses } from "@/content/contract";
import { signatureVisible, toContractInput } from "@/lib/admin/contracts";
import type { Contract } from "@/lib/admin/contracts";
import { sellerBank, taxIdKind } from "@/lib/store/requisites";

/**
 * Текст договора — один на всех, кто его видит.
 *
 * Владелец читает его в панели перед подписью, заказчик — по ссылке. Это
 * обязан быть один и тот же текст до запятой: две вёрстки одного документа
 * расходятся на первой же правке, и расхождение обнаруживает та сторона,
 * которой оно выгодно.
 *
 * Про доступ компонент не знает ничего. Подпись приходит адресом: в панели
 * это внутренний маршрут с проверкой сессии, у заказчика — маршрут по
 * токену. Знай компонент про роли, проверка доступа оказалась бы в вёрстке.
 */
export function ContractDocument({
  contract,
  signatureSrc,
  hasSignatureFile,
}: {
  contract: Contract;
  signatureSrc: string;
  /** Загружена ли подпись в хранилище. Проверяет вызывающий: это поход в сеть. */
  hasSignatureFile: boolean;
}) {
  const legal = company.legal;
  const seller = sellerBank();
  const sellerTaxLabel = taxIdKind() === "pinfl" ? "ПИНФЛ" : "ИНН";
  const signed = signatureVisible(contract);
  const clauses = contractClauses(toContractInput(contract));

  return (
    <Letterhead
      title={`Договор № ${contract.number}`}
      subtitle="на выполнение работ по разработке"
      place="г. Ташкент"
      date={contract.signed_date}
    >
      <p>
        <b>{legal.name}</b>, {legal.form.ru}, {legal.address.ru}, ПИНФЛ {legal.pinfl},
        именуемый в дальнейшем «Исполнитель», с одной стороны, и{" "}
        <b>{contract.client_name}</b>, {contract.client_details}, именуемый в
        дальнейшем «Заказчик», с другой стороны, вместе именуемые «Стороны»,
        заключили настоящий Договор о нижеследующем.
      </p>

      {clauses.map((clause, index) => (
        <section key={clause.heading} className="mt-5 break-inside-avoid">
          <h2 className="text-[11pt] font-bold">
            {index + 1}. {clause.heading}
          </h2>
          <ol className="mt-1 space-y-1">
            {clause.items.map((item, j) => (
              <li key={item.slice(0, 40)} className="flex gap-2">
                <span className="shrink-0 tabular-nums">
                  {index + 1}.{j + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="mt-8 break-inside-avoid">
        <h2 className="text-[11pt] font-bold">Реквизиты и подписи Сторон</h2>
        <div className="mt-3 grid grid-cols-2 gap-8 text-[10pt]">
          <div>
            <p className="font-bold">Исполнитель</p>
            <p className="mt-1">{legal.name}</p>
            <p>{legal.address.ru}</p>
            <p>ПИНФЛ {legal.pinfl}</p>
            {seller ? (
              <>
                <p className="mt-1">
                  {sellerTaxLabel} {seller.taxId}
                </p>
                <p>{seller.bankName}</p>
                <p>р/с {seller.account}</p>
                <p>МФО {seller.mfo}</p>
                {seller.swift ? <p>SWIFT {seller.swift}</p> : null}
              </>
            ) : (
              // Печатать договор без счёта исполнителя нельзя: по нему
              // нечем заплатить. Отправку такой договор всё равно не
              // пройдёт, но увидеть причину надо здесь, а не в отказе.
              <p className="mt-1 font-bold text-red-700">
                Банковские реквизиты студии не заполнены в окружении
              </p>
            )}
            <p className="mt-4">_______________________</p>
            {/* Подпись накладывается поверх линии, а не вместо неё: линия
                остаётся на месте и в подписанном экземпляре — так документ
                выглядит одинаково у обеих сторон. */}
            <div className="relative h-16">
              {signed && hasSignatureFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signatureSrc}
                  alt=""
                  className="absolute -top-10 left-2 h-20 w-auto"
                />
              ) : null}
            </div>
          </div>
          <div>
            <p className="font-bold">Заказчик</p>
            <p className="mt-1">{contract.client_name}</p>
            <p>{contract.client_details}</p>
            {contract.client_tax_id ? <p className="mt-1">ИНН / ПИНФЛ {contract.client_tax_id}</p> : null}
            {contract.client_bank_name ? <p>{contract.client_bank_name}</p> : null}
            {contract.client_account ? <p>р/с {contract.client_account}</p> : null}
            {contract.client_mfo ? <p>МФО {contract.client_mfo}</p> : null}
            <p className="mt-4">_______________________</p>
            <div className="h-16" />
          </div>
        </div>
      </section>

      <p className="mt-6 text-[9pt] text-black/50">
        Приложение № 1 «Техническое задание» подписывается Сторонами
        одновременно с настоящим Договором и является его неотъемлемой частью.
      </p>
    </Letterhead>
  );
}
