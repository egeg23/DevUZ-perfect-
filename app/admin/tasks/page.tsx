import { AdminShell } from "@/components/admin/shell";
import { TaskHistoryView } from "@/components/admin/task-history";
import { requireStaff } from "@/lib/admin/guard";
import { taskHistory } from "@/lib/admin/task-store";
import { historyDays, historyKind } from "@/lib/admin/tasks";

// История — состояние базы сейчас, без кэша.
export const dynamic = "force-dynamic";

/**
 * «История задач» — для всех ролей: задачи живут на главной, а «Лиды»
 * открыты каждому. Что кому видно, решает taskHistory (seesTask).
 */
export default async function TaskHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string; p?: string; d?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const now = new Date();
  const days = historyDays(params.d);
  const kind = historyKind(params.k);
  const person = staff.role !== "manager" && /^[0-9a-f-]{36}$/i.test(params.p ?? "") ? params.p! : "";
  const history = await taskHistory({ id: staff.id, role: staff.role }, { days, kind, person }, now);
  return (
    <AdminShell staff={staff}>
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
