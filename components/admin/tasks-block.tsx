import { taskAction, createTaskAction } from "@/app/admin/tasks/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { TaskAlertsButton } from "@/components/admin/task-alerts";
import { taskNoticeDict, tasksDict } from "@/content/admin-panel/tasks";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import type { Staff } from "@/lib/admin/session";
import { taskBoard, taskPeople, type TaskBoard } from "@/lib/admin/task-store";
import { formatDue, isOverdue, localInputValue, type Task } from "@/lib/admin/tasks";

/**
 * Блок «Задачи» на главной панели — у всех ролей одинаковый.
 *
 * Владелец, 01.10: «На главной странице показываются задачи, которые
 * поставили, срок выполнения… Все могут ставить задачи на всех». Сверху —
 * «Мне»: что надо сделать, просроченное подсвечено. Рядом — «Я поставил»:
 * как дела у задач, которые раздал я. Ниже — форма «Поставить задачу».
 */

type T = Picked<typeof tasksDict>;

const BUTTON = "rounded-lg px-3 py-1.5 text-xs";

function statusLabel(t: T, task: Task, now: Date): { text: string; tone: string } {
  if (isOverdue(task, now)) return { text: t.overdue, tone: "border-red-500/40 bg-red-500/10 text-red-300" };
  if (task.status === "new") return { text: t.statusNew, tone: "border-gold/40 bg-gold/10 text-gold" };
  if (task.status === "in_work") return { text: t.statusInWork, tone: "border-blue-soft/40 text-blue-soft" };
  if (task.status === "done") return { text: t.statusDone, tone: "border-green/40 bg-green/10 text-green" };
  return { text: t.statusFailed, tone: "border-line text-faint" };
}

function Chip({ label }: { label: { text: string; tone: string } }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${label.tone}`}>{label.text}</span>;
}

function MineRow({ task, t, names, now }: { task: Task; t: T; names: Map<string, string>; now: Date }) {
  const overdue = isOverdue(task, now);
  const self = task.creator_id === task.assignee_id;
  return (
    <li
      className={`rounded-lg border px-3 py-2.5 ${overdue ? "border-red-500/40 bg-red-500/5" : "border-line bg-surface-2/40"}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">{task.title}</span>
        <Chip label={statusLabel(t, task, now)} />
      </div>
      {task.body ? <p className="mt-1 whitespace-pre-line text-xs text-muted">{task.body}</p> : null}
      <p className={`mt-1 text-xs ${overdue ? "text-red-300" : "text-faint"}`}>
        {self ? null : <>{t.from(names.get(task.creator_id) ?? "—")} · </>}
        {t.due(formatDue(task.due_at))}
      </p>
      <form action={taskAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="task" value={task.id} />
        {task.status === "new" ? (
          <SubmitButton name="action" value="take" base={BUTTON} pendingLabel={t.take}>
            {t.take}
          </SubmitButton>
        ) : (
          <>
            <SubmitButton name="action" value="done" base={BUTTON} pendingLabel={t.done}>
              {t.done}
            </SubmitButton>
            <SubmitButton name="action" value="failed" base={BUTTON} tone="quiet" pendingLabel={t.failed}>
              {t.failed}
            </SubmitButton>
          </>
        )}
        <details className="group w-full sm:w-auto">
          <summary className="cursor-pointer list-none text-xs text-muted hover:text-text">{t.move} ▾</summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(
              [
                ["1h", t.move1h],
                ["tomorrow", t.moveTomorrow],
                ["3d", t.move3d],
                ["week", t.moveWeek],
              ] as const
            ).map(([value, label]) => (
              <SubmitButton key={value} name="action" value={value} base={BUTTON} tone="quiet" pendingLabel={label}>
                {label}
              </SubmitButton>
            ))}
            <span className="flex items-center gap-2">
              <input
                type="datetime-local"
                name="due_at"
                defaultValue={localInputValue(new Date(Math.max(Date.parse(task.due_at), now.getTime()) + 3_600_000))}
                className="rounded-lg border border-line bg-ink px-2 py-1 text-xs"
              />
              <SubmitButton name="action" value="custom" base={BUTTON} tone="quiet" pendingLabel={t.moveTo}>
                {t.moveTo}
              </SubmitButton>
            </span>
          </div>
        </details>
      </form>
    </li>
  );
}

function GivenRow({ task, t, names, now }: { task: Task; t: T; names: Map<string, string>; now: Date }) {
  const overdue = isOverdue(task, now);
  return (
    <li className={`rounded-lg border px-3 py-2 ${overdue ? "border-red-500/40 bg-red-500/5" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={task.closed_at ? "text-muted" : "font-medium"}>{task.title}</span>
        <Chip label={statusLabel(t, task, now)} />
      </div>
      <p className={`mt-1 text-xs ${overdue ? "text-red-300" : "text-faint"}`}>
        {t.to(names.get(task.assignee_id) ?? "—")} · {t.due(formatDue(task.due_at))}
      </p>
    </li>
  );
}

const NOTICE_TONE: Partial<Record<keyof typeof taskNoticeDict, string>> = {
  created: "ok",
  createdLater: "ok",
  taken: "ok",
  done: "ok",
  failed: "ok",
  moved: "ok",
};

export function TasksView({
  staff,
  locale,
  board,
  people,
  notice,
  now,
}: {
  staff: Pick<Staff, "id">;
  locale: PanelLocale;
  board: TaskBoard;
  people: { id: string; display_name: string }[];
  notice?: string;
  now: Date;
}) {
  const t = pick(tasksDict, locale);
  const notices = pick(taskNoticeDict, locale);
  const noticeText = notice && notice in notices ? notices[notice as keyof typeof notices] : null;
  const okNotice = notice ? NOTICE_TONE[notice as keyof typeof taskNoticeDict] === "ok" : false;
  // Себя — первым: задачу себе ставят чаще всего.
  const options = [...people].sort((a, b) => (a.id === staff.id ? -1 : b.id === staff.id ? 1 : 0));

  return (
    <section id="tasks" className="mb-6 scroll-mt-28 rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-faint">
          {t.title}
          <HelpHint topic={helpAnchor("/admin", "tasks")} />
        </h2>
        <div className="ml-auto">
          <TaskAlertsButton />
        </div>
      </div>

      {noticeText ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            okNotice ? "border-green/30 bg-green/5 text-green" : "border-gold/30 bg-gold/5 text-gold"
          }`}
        >
          {noticeText}
        </p>
      ) : null}
      {board.offline ? <p className="mt-3 text-sm text-gold">{t.offline}</p> : null}

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-muted">
            {t.forMe}
            {board.mine.length ? <span className="ml-1.5 font-mono text-gold">{board.mine.length}</span> : null}
          </h3>
          {board.mine.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {board.mine.map((task) => (
                <MineRow key={task.id} task={task} t={t} names={board.names} now={now} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">{t.nothingMine}</p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-muted">{t.iGave}</h3>
          {board.given.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {board.given.map((task) => (
                <GivenRow key={task.id} task={task} t={t} names={board.names} now={now} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">{t.nothingGiven}</p>
          )}
        </div>
      </div>

      <details className="mt-5 border-t border-line pt-4" open={!board.mine.length && !board.given.length}>
        <summary className="cursor-pointer text-sm text-green hover:underline">{t.newTask}</summary>
        <form action={createTaskAction} className="mt-3 grid gap-3 sm:max-w-xl">
          <label className="grid gap-1 text-xs text-muted">
            {t.fieldWho}
            <select
              name="assignee"
              required
              defaultValue={staff.id}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text"
            >
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id === staff.id ? t.self(p.display_name) : p.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.fieldTitle}
            <input
              name="title"
              required
              maxLength={200}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.fieldBody}
            <textarea
              name="body"
              rows={2}
              maxLength={2000}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text"
            />
          </label>
          <fieldset className="grid gap-2 text-xs text-muted">
            <legend className="mb-1">{t.fieldDue}</legend>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text">
              {(
                [
                  ["today", t.dueToday],
                  ["tomorrow", t.dueTomorrow],
                  ["3days", t.due3days],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5">
                  <input type="radio" name="due" value={value} defaultChecked={value === "tomorrow"} />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-1.5">
                <input type="radio" name="due" value="custom" />
                {t.dueCustom}
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={localInputValue(new Date(now.getTime() + 24 * 3_600_000))}
                  className="rounded-lg border border-line bg-ink px-2 py-1 text-xs"
                />
              </label>
            </div>
            <span className="text-faint">{t.dueHint}</span>
          </fieldset>
          <div>
            <SubmitButton base="rounded-lg px-4 py-2 text-sm" pendingLabel={t.submit}>
              {t.submit}
            </SubmitButton>
          </div>
        </form>
      </details>
    </section>
  );
}

/** Блок целиком: читает задачи и людей, рисует TasksView. */
export async function TasksBlock({ staff, notice }: { staff: Staff; notice?: string }) {
  const now = new Date();
  const [board, people] = await Promise.all([taskBoard(staff.id, now), taskPeople()]);
  return <TasksView staff={staff} locale={staff.panel_locale} board={board} people={people} notice={notice} now={now} />;
}
