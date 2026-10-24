import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { TaskStepList } from "@/components/admin/tasks-block";
import { taskCardDict, tasksDict } from "@/content/admin-panel/tasks";
import { requireSection } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { taskCard } from "@/lib/admin/task-store";
import { formatDue, isOverdue } from "@/lib/admin/tasks";

// Задача — как она есть сейчас: срок и шаги меняются из бота в любой момент.
export const dynamic = "force-dynamic";

/**
 * Одна задача с историей. Сюда ведёт строка «просрочено» в «Требует
 * внимания» на «Главной» — в конкретную задачу, а не в общий список
 * (владелец, 14.10.2026). Видит тот же, кто видит её в «Истории задач».
 */
export default async function TaskCardPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireSection("/admin/tasks");
  const { id } = await params;
  const locale = staff.panel_locale;
  const t = pick(tasksDict, locale);
  const c = pick(taskCardDict, locale);
  const card = await taskCard(id, { id: staff.id, role: staff.role });
  const now = new Date();

  return (
    <AdminShell staff={staff}>
      <Link href="/admin/tasks" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-text">
        {c.back}
      </Link>
      {!card ? (
        <p className="mt-4 text-sm text-faint">{c.notFound}</p>
      ) : (
        <article className="mt-3 max-w-2xl rounded-3xl border border-line/70 bg-surface p-4 sm:p-5">
          {(() => {
            const { task } = card;
            const status =
              task.status === "done"
                ? t.statusDone
                : task.status === "failed"
                  ? t.statusFailed
                  : isOverdue(task, now)
                    ? t.overdue
                    : task.status === "in_work"
                      ? t.statusInWork
                      : t.statusNew;
            const warn = isOverdue(task, now);
            return (
              <>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="text-lg font-semibold text-text">{task.title}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${warn ? "bg-gold/15 text-gold" : "bg-surface-2 text-muted"}`}>
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {[
                    t.from(card.names.get(task.creator_id) ?? "—"),
                    t.to(card.names.get(task.assignee_id) ?? "—"),
                    task.due_at ? t.due(formatDue(task.due_at)) : t.noDue,
                  ].join(" · ")}
                  {task.project_id ? (
                    <>
                      {" · "}
                      <Link href={`/admin/projects/${task.project_id}`} className="hover:text-green">
                        {t.project(card.projects.get(task.project_id) ?? "—")}
                      </Link>
                    </>
                  ) : null}
                </p>
                {task.body ? <p className="mt-3 whitespace-pre-wrap text-sm text-text">{task.body}</p> : null}
                <h2 className="mt-5 text-xs font-medium uppercase tracking-wider text-faint">{c.history}</h2>
                <TaskStepList t={t} steps={card.steps} names={card.names} projects={card.projects} />
              </>
            );
          })()}
        </article>
      )}
    </AdminShell>
  );
}
