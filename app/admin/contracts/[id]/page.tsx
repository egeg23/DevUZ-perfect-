import { notFound } from "next/navigation";

import { Letterhead } from "@/components/docs/letterhead";
import { PrintButton } from "@/components/store/print-button";
import { company } from "@/content/company";
import { contractClauses } from "@/content/contract";
import { signatureVisible, toContractInput } from "@/lib/admin/contracts";
import { contractById } from "@/lib/admin/contract-store";
import { approvesContract } from "@/lib/admin/contracts";
import { cancelContract, confirmContract } from "@/app/admin/contracts/actions";
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
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const contract = await contractById(id);
  if (!contract) notFound();

  const clauses = contractClauses(toContractInput(contract));
  const signed = signatureVisible(contract);
  const hasSignatureFile = signed ? await signatureExists() : false;
  const legal = company.legal;
  const { error, detail } = await searchParams;
  const canApprove = approvesContract(staff.role);

  return (
    <>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-3 px-[20mm]">
        <PrintButton label="Печать" />
        <span className="text-sm text-black/60">
          {contract.status === "draft" && "Черновик — подписи нет"}
          {contract.status === "approved" && "Подтверждён владельцем"}
          {contract.status === "void" && `Отменён: ${contract.void_reason}`}
        </span>
        {signed && !hasSignatureFile ? (
          <span className="text-sm font-semibold text-red-700">
            Договор подтверждён, но файл подписи не загружен — подпись не появится
          </span>
        ) : null}

        {/* Подтверждение — единственное действие владельца на этой странице,
            и оно необратимо: подтверждённый договор не правится. Поэтому
            кнопка стоит рядом с документом, а не в списке: нажимают её,
            прочитав текст, а не выбрав строку в таблице. */}
        {canApprove && contract.status === "draft" ? (
          <form action={confirmContract}>
            <input type="hidden" name="id" value={contract.id} />
            <button
              type="submit"
              className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            >
              Подтвердить и подписать
            </button>
          </form>
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
            <p className="mt-4">_______________________</p>
            {/* Подпись накладывается поверх линии, а не вместо неё: линия
                остаётся на месте и в подписанном экземпляре — так документ
                выглядит одинаково у обеих сторон. */}
            <div className="relative h-16">
              {signed && hasSignatureFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/admin/contracts/${contract.id}/signature`}
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
    </>
  );
}
