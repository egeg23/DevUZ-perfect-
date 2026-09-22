import { AdminShell } from "@/components/admin/shell";
import { OutreachList } from "@/components/admin/outreach-list";
import { ProspectRunner } from "@/components/admin/prospect-runner";
import { TouchPlanLine } from "@/components/admin/touch-plan-line";
import { requireStaff } from "@/lib/admin/guard";
import { touchProgressOf } from "@/lib/admin/touch-store";
import { sentLastHour } from "@/lib/admin/outreach-queue";
import { listProspects, manualReplies } from "@/lib/admin/outreach-store";
import { BATCH_CAP } from "@/lib/audit/batch";

export const dynamic = "force-dynamic";

export default async function ProspectPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; e?: string; sent?: string }>;
}) {
  const staff = await requireStaff();
  const { open, e, sent } = await searchParams;
  const [rows, hour, replies, plan] = await Promise.all([
    listProspects(),
    sentLastHour(),
    manualReplies(),
    touchProgressOf(staff.id),
  ]);

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">Холодные касания</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Тот же аудитор, что на публичной странице, но по списку. На выходе не
        баллы, а черновик первого сообщения по каждому сайту — построенный
        вокруг одной находки, которую адресат может пойти и проверить сам.
      </p>

      <TouchPlanLine progress={plan} />

      <ProspectRunner />

      <OutreachList rows={rows} hour={hour} open={open} error={e} sent={sent === "1"} replies={replies} />

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
          <span className="text-muted">Находок стало меньше, и это к лучшему.</span>{" "}
          Аудитор читает то, что отдал сервер. Если сайт собирается уже в
          браузере — а так устроена половина новых сайтов, — по проводу
          приходит пустая заготовка, и «нет телефона» означало бы только то,
          что мы его не увидели. Такие претензии больше не выписываются: вместо
          них одна проверяемая — сколько слов получил поисковик. Владелец
          проверяет её за минуту, открыв просмотр кода своей страницы.
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
