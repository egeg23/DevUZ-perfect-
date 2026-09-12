import { AdminShell } from "@/components/admin/shell";
import { ProspectRunner } from "@/components/admin/prospect-runner";
import { requireStaff } from "@/lib/admin/guard";
import { BATCH_CAP } from "@/lib/audit/batch";

export const dynamic = "force-dynamic";

export default async function ProspectPage() {
  const staff = await requireStaff();

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Холодные касания</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Тот же аудитор, что на публичной странице, но по списку. На выходе не
        баллы, а черновик первого сообщения по каждому сайту — построенный
        вокруг одной находки, которую адресат может пойти и проверить сам.
      </p>

      <ProspectRunner />

      <div className="mt-10 max-w-2xl space-y-3 border-t border-line pt-6 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">Список приносите вы.</span> Инструмент не
          обходит чужие каталоги и не выгружает базы: он открывает публичный сайт
          компании ровно так же, как его открывает любой посетитель. Там, где
          начинается выгрузка чужих баз, начинаются правила, которые мы не
          проверяли.
        </p>
        <p>
          <span className="text-muted">Пустая строка вместо черновика — это результат.</span>{" "}
          Если к сайту нет претензий, писать не о чем, и придумывать повод не
          надо: касание без содержания портит и адресата, и того, кто пишет.
        </p>
        <p>
          <span className="text-muted">Черновик — это черновик.</span> Прочитайте
          его перед отправкой и поправьте под человека. За один прогон —
          не больше {BATCH_CAP} адресов; внутри прогона сайты проверяются по
          одному, чтобы не стучаться к десятку сразу.
        </p>
      </div>
    </AdminShell>
  );
}
