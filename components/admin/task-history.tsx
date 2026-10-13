import Link from "next/link";

import { HelpHint } from "@/components/admin/help-link";
import { TaskStepList } from "@/components/admin/tasks-block";
import { taskHistoryDict, tasksDict } from "@/content/admin-panel/tasks";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import type { Role } from "@/lib/admin/roles";
import { HISTORY_LIMIT, type TaskHistory } from "@/lib/admin/task-store";
import {
  HISTORY_DAYS,
  formatDue,
  historyCounts,
  isOverdue,
  personRows,
  type HistoryDays,
  type HistoryKind,
  type Task,
} from "@/lib/admin/tasks";

/**
 * «История задач» — что случилось с задачами за период: сделано, не
 * сделано, отменено, перенесён срок, изменено (владелец, 13.10.2026:
 * «видеть историю выполненных / отклонённых задач или переноса срока»).
 *
 * Менеджер видит свои задачи, руководитель — команду, владелец — всё
 * (seesTask в lib/admin/tasks.ts). Руководителю и владельцу сверху —
 * таблица по людям: у кого сколько сделано, не сделано и переносов.
 * Только просмотр: менять задачи — на главной, в блоке «Задачи».
 */

const FIELD = "w-full min-w-0 rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text";

function statusChip(t: Picked<typeof tasksDict>, task: Task, now: Date): { text: string; tone: string } {
  if (isOverdue(task, now)) return { text: t.overdue, tone: "border-red-500/40 bg-red-500/10 text-red-300" };
  if (task.status === "new") return { text: t.statusNew, tone: "border-gold/40 bg-gold/10 text-gold" };
  if (task.status === "in_work") return { text: t.statusInWork, tone: "border-blue-soft/40 text-blue-soft" };
  if (task.status === "done") return { text: t.statusDone, tone: "border-green/40 bg-green/10 text-green" };
  if (task.status === "cancelled") return { text: t.statusCancelled, tone: "border-line text-faint" };
  return { text: t.statusFailed, tone: "border-line text-faint" };
}

export function TaskHistoryView({
  viewer,
  locale,
  history,
  days,
  kind,
  person,
  now,
}: {
  viewer: { id: string; role: Role };
  locale: PanelLocale;
  history: TaskHistory;
  days: HistoryDays;
  kind: HistoryKind;
  person: string;
  now: Date;
}) {
  const h = pick(taskHistoryDict, locale);
  const t = pick(tasksDict, locale);
  const team = viewer.role !== "manager";
  const counts = historyCounts(history.period);
  const people = team && !person ? personRows(history.period, history.assigneeOf) : [];

  const kinds: [HistoryKind, string][] = [
    ["all", h.kindAll],
    ["done", h.kindDone],
    ["failed", h.kindFailed],
    ["cancelled", h.kindCancelled],
    ["moved", h.kindMoved],
    ["edited", h.kindEdited],
  ];

  return (
    <div>
      <Link href="/admin#tasks" className="text-xs text-muted hover:text-text">
        {h.back}
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-lg font-semibold">
        {h.title}
        <HelpHint topic={helpAnchor("/admin", "tasks-history")} />
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{team ? h.leadTeam : h.leadMine}</p>

      <form action="/admin/tasks" className="mt-4 flex flex-wrap items-end gap-2 text-xs text-muted">
        <label className="grid min-w-0 gap-1">
          {h.filterKind}
          <select name="k" defaultValue={kind} className={FIELD}>
            {kinds.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {team ? (
          <label className="grid min-w-0 gap-1">
            {h.filterWho}
            <select name="p" defaultValue={person} className={`${FIELD} max-w-[14rem]`}>
              <option value="">{h.whoAll}</option>
              {history.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid min-w-0 gap-1">
          {h.filterDays}
          <select name="d" defaultValue={String(days)} className={FIELD}>
            {HISTORY_DAYS.map((n) => (
              <option key={n} value={n}>
                {h.days(n)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs text-text hover:border-green/50">
          {h.show}
        </button>
      </form>

      {history.offline ? <p className="mt-4 text-sm text-gold">{h.offline}</p> : null}

      <p className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 text-green">{h.countDone(counts.done)}</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-muted">{h.countFailed(counts.failed)}</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-muted">{h.countCancelled(counts.cancelled)}</span>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold">{h.countMoved(counts.moved)}</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-muted">{h.countEdited(counts.edited)}</span>
      </p>

      {people.length ? (
        <section className="mt-5 rounded-xl border border-line bg-surface px-4 py-4">
          <h2 className="text-sm uppercase tracking-wider text-faint">{h.byPerson}</h2>
          <p className="mt-1 text-xs text-faint">{h.byPersonHint}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 pr-3 font-normal">{h.colPerson}</th>
                  <th className="py-1 pr-3 text-right font-normal">{h.colDone}</th>
                  <th className="py-1 pr-3 text-right font-normal">{h.colFailed}</th>
                  <th className="py-1 pr-3 text-right font-normal">{h.colCancelled}</th>
                  <th className="py-1 text-right font-normal">{h.colMoved}</th>
                </tr>
              </thead>
              <tbody>
                {people.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="py-1.5 pr-3">
                      <Link href={`/admin/tasks?p=${row.id}&d=${days}`} className="hover:text-green">
                        {history.names.get(row.id) ?? "—"}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3 text-right font-mono text-green">{row.done}</td>
                    <td className="py-1.5 pr-3 text-right font-mono">{row.failed}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-faint">{row.cancelled}</td>
                    <td className={`py-1.5 text-right font-mono ${row.moved ? "text-gold" : ""}`}>{row.moved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!history.offline && !history.tasks.length ? <p className="mt-5 text-sm text-faint">{h.empty}</p> : null}

      <ul className="mt-5 flex flex-col gap-2 text-sm">
        {history.tasks.map((task) => {
          const chip = statusChip(t, task, now);
          const project = task.project_id ? history.projects.get(task.project_id) : null;
          const meta = [
            t.from(history.names.get(task.creator_id) ?? "—"),
            t.to(history.names.get(task.assignee_id) ?? "—"),
            task.due_at ? t.due(formatDue(task.due_at)) : t.noDue,
          ];
          return (
            <li key={task.id} className="rounded-lg border border-line bg-surface px-3 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-medium">{task.title}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${chip.tone}`}>{chip.text}</span>
              </div>
              <p className="mt-1 text-xs text-faint">
                {meta.join(" · ")}
                {project && task.project_id ? (
                  <>
                    {" · "}
                    <Link href={`/admin/projects/${task.project_id}`} className="hover:text-green">
                      {t.project(project)}
                    </Link>
                  </>
                ) : null}
              </p>
              <TaskStepList t={t} steps={history.steps.get(task.id) ?? []} names={history.names} projects={history.projects} />
            </li>
          );
        })}
      </ul>
      {history.more ? <p className="mt-3 text-xs text-faint">{h.more(HISTORY_LIMIT)}</p> : null}
    </div>
  );
}
