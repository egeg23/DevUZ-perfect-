import Link from "next/link";

import { requireStaff } from "@/lib/admin/guard";
import { approvesContract } from "@/lib/admin/contracts";
import { signatureExists } from "@/lib/admin/signature";
import { uploadSignature } from "@/app/admin/contracts/actions";

export const dynamic = "force-dynamic";

/**
 * Договоры: подпись владельца и объяснение порядка.
 *
 * Сами договоры живут в карточках проектов — там же, где сумма и стадия.
 * Отдельная страница нужна ровно для двух вещей: загрузить подпись и один
 * раз прочитать, кто что подписывает.
 */
export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const staff = await requireStaff();
  const { saved, error } = await searchParams;
  const canApprove = approvesContract(staff.role);
  const hasSignature = await signatureExists();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Договоры</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Договор готовится в карточке проекта, когда сделка переходит в стадию
          «договор». Подготовить и проверить может любой из команды. Подтвердить
          может только владелец — подтверждение и есть момент, когда под
          документом появляется подпись.
        </p>
      </div>

      {canApprove ? (
        <section className="rounded-2xl border border-line bg-surface px-6 py-5">
          <h2 className="font-semibold">Подпись</h2>
          <p className="mt-1 text-sm text-muted">
            PNG с прозрачным фоном. Накладывается поверх линии подписи и
            показывается только в подтверждённых договорах — у черновика её нет
            в документе физически, а не спрятана стилями.
          </p>

          <p className="mt-3 text-sm">
            {hasSignature ? (
              <span className="text-green">Подпись загружена</span>
            ) : (
              <span className="text-amber-500">
                Подписи нет. Подтверждённый договор напечатается без неё.
              </span>
            )}
          </p>

          <form action={uploadSignature} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="signature"
              accept="image/png"
              required
              className="text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text"
            />
            <button
              type="submit"
              className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {hasSignature ? "Заменить" : "Загрузить"}
            </button>
          </form>

          {saved ? <p className="mt-2 text-sm text-green">Сохранено.</p> : null}
          {error ? <p className="mt-2 text-sm text-amber-500">{decodeURIComponent(error)}</p> : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface px-6 py-5 text-sm leading-relaxed text-muted">
        <h2 className="font-semibold text-text">Что защищает этот договор</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <b className="text-text">Споры идут в арбитраж, а не в суд.</b> Это
            главное условие: оно меняет не аргументы, а того, кто их слушает.
          </li>
          <li>
            <b className="text-text">Ответственность ограничена полученным.</b>{" "}
            Даже проигранный спор не может стоить больше, чем пришло по договору.
          </li>
          <li>
            <b className="text-text">Упущенная выгода исключена.</b> Именно ею
            раздувают иск до сумм, которых никто не видел.
          </li>
          <li>
            <b className="text-text">Молчание заказчика — это приёмка.</b> Пять
            рабочих дней без ответа, и этап принят.
          </li>
          <li>
            <b className="text-text">Права на код — после полной оплаты.</b> До
            неё использование результата нарушает наши права.
          </li>
        </ul>
        <p className="mt-4 text-xs text-faint">
          Документ не проверен юристом. До проверки его стоит показывать
          заказчику как есть, но арбитражную оговорку нужно согласовать
          отдельно: у неё есть формальные требования, и ошибка в формулировке
          делает её недействительной — то есть возвращает спор в суд.
        </p>
      </section>

      <Link href="/admin/projects" className="inline-block text-sm text-green hover:underline">
        ← К проектам
      </Link>
    </div>
  );
}
