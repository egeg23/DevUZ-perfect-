import { AdminShell } from "@/components/admin/shell";
import { TaskHistoryView } from "@/components/admin/task-history";
import { TasksBlock } from "@/components/admin/tasks-block";
import { requireSection } from "@/lib/admin/guard";
import { taskHistory } from "@/lib/admin/task-store";
import { historyDays, historyKind } from "@/lib/admin/tasks";

// Задачи и история — состояние базы сейчас, без кэша.
export const dynamic = "force-dynamic";

/**
 * Раздел «Задачи» — наша внутренняя CRM, своей кнопкой в меню (владелец,
 * 23.10.2026: «вынесем CRM нашу отдельной кнопкой в наше меню, чтобы она не
 * была в лидах»). Сверху — то, с чем работают каждый день: «Мне», «Я
 * поставил», «Поставить задачу». Ниже — «История задач»: что кому видно,
 * решает taskHistory (seesTask).
 *
 * Параметры не пересекаются: у блока — t, tg, tf, tp, у истории — k, p, d.
 */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; tg?: string; tf?: string; tp?: string; k?: string; p?: string; d?: string }>;
}) {
  const staff = await requireSection("/admin/tasks");
  const params = await searchParams;
  const now = new Date();
  const days = historyDays(params.d);
  const kind = historyKind(params.k);
  const person = staff.role !== "manager" && /^[0-9a-f-]{36}$/i.test(params.p ?? "") ? params.p! : "";
  const history = await taskHistory({ id: staff.id, role: staff.role }, { days, kind, person }, now);
  return (
    <AdminShell staff={staff}>
      <TasksBlock
        staff={staff}
        notice={params.t}
        group={params.tg}
        projectFilter={params.tf}
        prefillProject={params.tp}
      />
      <TaskHistoryView
        viewer={{ id: staff.id, role: staff.role }}
        locale={staff.panel_locale}
        history={history}
        days={days}
        kind={kind}
        person={person}
        now={now}
      />
    </AdminShell>
  );
}
