import Link from "next/link";

import { createTaskAction, editTaskAction, taskAction } from "@/app/admin/tasks/actions";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { TaskAlertsButton } from "@/components/admin/task-alerts";
import { taskNoticeDict, tasksDict } from "@/content/admin-panel/tasks";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import type { Staff } from "@/lib/admin/session";
import { projectTasks, taskBoard, taskPeople, taskProjects, type TaskBoard } from "@/lib/admin/task-store";
import {
  DUE_BUCKETS,
  dueBucket,
  formatDue,
  groupTasks,
  hasHistory,
  isOpen,
  isOverdue,
  localInputValue,
  movesOf,
  taskGroup,
  type DueBucket,
  type Task,
  type TaskGroup,
  type TaskStep,
} from "@/lib/admin/tasks";

/**
 * Блок «Задачи» наверху раздела «Задачи» (/admin/tasks) — у всех ролей
 * одинаковый. До 23.10.2026 стоял на «Лидах»; владелец: «Давай вынесем CRM
 * нашу отдельной кнопкой в наше меню, чтобы она не была в лидах».
 *
 * Владелец, 01.10: «На главной странице показываются задачи, которые
 * поставили, срок выполнения… Все могут ставить задачи на всех». Затем:
 * «порядок задач от самой ближайшей даты к дальней; в фильтре можно
 * сгруппировать; каждую задачу можно отнести к проекту, но можно не
 * указывать ни срок, ни проект».
 *
 * Сверху — «Мне»: что надо сделать, просроченное подсвечено. Рядом — «Я
 * поставил»: как дела у задач, которые раздал я. Ниже — форма «Поставить
 * задачу». Тот же ряд задачи рисует и карточка проекта (ProjectTasksBlock).
 */

type T = Picked<typeof tasksDict>;

const BUTTON = "rounded-lg px-3 py-1.5 text-xs";
// w-full и min-w-0: без них выпадающий список растягивается по самому
// длинному варианту — на телефоне форма выходила шире экрана, и браузер
// уменьшал всю страницу (владелец, 04.10: «мобильная версия кривая»).
const FIELD = "w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text";

/** Что нужно ряду задачи, чтобы нарисоваться и вернуть нажатие туда же. */
type RowContext = {
  t: T;
  me: string;
  names: Map<string, string>;
  projects: Map<string, string>;
  now: Date;
  /** Куда вернуться после нажатия и с каким фильтром. */
  back: string;
  keep: Record<string, string>;
  /** Не подписывать проект — ряд и так в карточке проекта. */
  hideProject?: boolean;
  /** История каждой задачи; нет — блока «История» у ряда нет. */
  steps?: Map<string, TaskStep[]>;
  /** Для формы «Изменить»: кому можно передать и к каким проектам отнести. */
  people?: { id: string; display_name: string }[];
  projectOptions?: { id: string; label: string }[];
};

function statusLabel(t: T, task: Task, now: Date): { text: string; tone: string } {
  if (isOverdue(task, now)) return { text: t.overdue, tone: "border-red-500/40 bg-red-500/10 text-red-300" };
  if (task.status === "new") return { text: t.statusNew, tone: "border-gold/40 bg-gold/10 text-gold" };
  if (task.status === "in_work") return { text: t.statusInWork, tone: "border-blue-soft/40 text-blue-soft" };
  if (task.status === "done") return { text: t.statusDone, tone: "border-green/40 bg-green/10 text-green" };
  if (task.status === "cancelled") return { text: t.statusCancelled, tone: "border-line text-faint" };
  return { text: t.statusFailed, tone: "border-line text-faint" };
}

function Chip({ label }: { label: { text: string; tone: string } }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${label.tone}`}>{label.text}</span>;
}

function Hidden({ ctx, task }: { ctx: RowContext; task: Task }) {
  return (
    <>
      <input type="hidden" name="task" value={task.id} />
      <input type="hidden" name="back" value={ctx.back} />
      {Object.entries(ctx.keep).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </>
  );
}

/**
 * Одна задача. Какие кнопки — решает, кто смотрит: исполнитель берёт и
 * закрывает, поставивший отменяет, срок переносят оба. Остальным — только
 * посмотреть (так задачу видят в карточке проекта).
 */
function TaskRow({ task, ctx }: { task: Task; ctx: RowContext }) {
  const { t, me, names, projects, now } = ctx;
  const overdue = isOverdue(task, now);
  const open = isOpen(task.status);
  const assignee = task.assignee_id === me;
  const creator = task.creator_id === me;
  const project = !ctx.hideProject && task.project_id ? projects.get(task.project_id) : null;

  const steps = ctx.steps?.get(task.id);
  const moves = movesOf(steps);
  const meta = [
    task.creator_id !== me ? t.from(names.get(task.creator_id) ?? "—") : null,
    task.assignee_id !== me ? t.to(names.get(task.assignee_id) ?? "—") : null,
    task.due_at ? t.due(formatDue(task.due_at)) : t.noDue,
    moves ? t.movedTimes(moves) : null,
  ].filter(Boolean);

  return (
    <li
      className={`rounded-lg border px-3 py-2.5 ${
        overdue ? "border-red-500/40 bg-red-500/5" : open ? "border-line bg-surface-2/40" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={open ? "font-medium" : "text-muted"}>{task.title}</span>
        <Chip label={statusLabel(t, task, now)} />
      </div>
      {task.body && open ? <p className="mt-1 whitespace-pre-line text-xs text-muted">{task.body}</p> : null}
      <p className={`mt-1 text-xs ${overdue ? "text-red-300" : "text-faint"}`}>
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
      {open && (assignee || creator) ? (
        <form action={taskAction} className="mt-2 flex flex-wrap items-center gap-2">
          <Hidden ctx={ctx} task={task} />
          {assignee && task.status === "new" ? (
            <SubmitButton name="action" value="take" base={BUTTON} pendingLabel={t.take}>
              {t.take}
            </SubmitButton>
          ) : null}
          {assignee && task.status === "in_work" ? (
            <>
              <SubmitButton name="action" value="done" base={BUTTON} pendingLabel={t.done}>
                {t.done}
              </SubmitButton>
              <SubmitButton name="action" value="failed" base={BUTTON} tone="quiet" pendingLabel={t.failed}>
                {t.failed}
              </SubmitButton>
            </>
          ) : null}
          <details className="w-full sm:w-auto">
            <summary className="cursor-pointer list-none text-xs text-muted hover:text-text">
              {task.due_at ? t.move : t.setDue} ▾
            </summary>
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
              <span className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={localInputValue(
                    new Date(Math.max(task.due_at ? Date.parse(task.due_at) : 0, now.getTime()) + 3_600_000),
                  )}
                  className="rounded-lg border border-line bg-ink px-2 py-1 text-xs"
                />
                <SubmitButton name="action" value="custom" base={BUTTON} tone="quiet" pendingLabel={t.moveTo}>
                  {t.moveTo}
                </SubmitButton>
              </span>
            </div>
          </details>
          {creator ? (
            <SubmitButton name="action" value="cancel" base={`${BUTTON} ml-auto`} tone="quiet" pendingLabel={t.cancel}>
              {t.cancel}
            </SubmitButton>
          ) : null}
        </form>
      ) : null}
      {open && creator && ctx.people ? <EditForm task={task} ctx={ctx} /> : null}
      {hasHistory(steps) ? (
        <details className="mt-2">
          <summary className="cursor-pointer list-none text-xs text-muted hover:text-text">
            {t.history(steps!.length)} ▾
          </summary>
          <TaskStepList t={t} steps={steps!} names={names} projects={projects} />
        </details>
      ) : null}
    </li>
  );
}

/**
 * «Изменить» — тому, кто поставил, у открытой задачи: название, описание,
 * проект и исполнитель. Срок — не здесь: у него «Перенести срок» и своя
 * история переносов.
 */
function EditForm({ task, ctx }: { task: Task; ctx: RowContext }) {
  const { t, names, projects } = ctx;
  const people = ctx.people ?? [];
  // Отключённый исполнитель или закрытый проект — всё равно в списке, иначе
  // форма молча подменила бы их первым вариантом.
  const assignees = people.some((p) => p.id === task.assignee_id)
    ? people
    : [{ id: task.assignee_id, display_name: names.get(task.assignee_id) ?? "—" }, ...people];
  const options = ctx.projectOptions ?? [];
  const projectList =
    task.project_id && !options.some((p) => p.id === task.project_id)
      ? [{ id: task.project_id, label: projects.get(task.project_id) ?? "—" }, ...options]
      : options;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer list-none text-xs text-muted hover:text-text">{t.edit} ▾</summary>
      <form action={editTaskAction} className="mt-2 grid grid-cols-1 gap-2 sm:max-w-xl">
        <Hidden ctx={ctx} task={task} />
        <label className="grid min-w-0 gap-1 text-xs text-muted">
          {t.fieldTitle}
          <input name="title" required maxLength={200} defaultValue={task.title} className={FIELD} />
        </label>
        <label className="grid min-w-0 gap-1 text-xs text-muted">
          {t.fieldBody}
          <textarea name="body" rows={2} maxLength={2000} defaultValue={task.body} className={FIELD} />
        </label>
        <label className="grid min-w-0 gap-1 text-xs text-muted">
          {t.fieldAssignee}
          <select name="assignee" defaultValue={task.assignee_id} className={FIELD}>
            {assignees.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === ctx.me ? t.self(p.display_name) : p.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-xs text-muted">
          {t.fieldProject}
          <select name="project" defaultValue={task.project_id ?? ""} className={FIELD}>
            <option value="">{t.projectNone}</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-faint">{t.editHint}</p>
        <div>
          <SubmitButton base={BUTTON} pendingLabel={t.editSave}>
            {t.editSave}
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}

/**
 * История задачи по шагам: кто поставил, взял, перенёс срок (с какого на
 * какой), изменил (что было → что стало), закрыл. Время — ташкентское.
 */
export function TaskStepList({
  t,
  steps,
  names,
  projects,
}: {
  t: T;
  steps: readonly TaskStep[];
  names: Map<string, string>;
  projects: Map<string, string>;
}) {
  const who = (id: string | null) => (id ? (names.get(id) ?? "—") : "—");
  const due = (at: string | null) => (at ? formatDue(at) : t.noDue);
  const project = (id: string | null) => (id ? (projects.get(id) ?? "—") : t.groupNoProject);
  const line = (step: TaskStep): string => {
    const actor = who(step.actor_id);
    if (step.kind === "created") return t.stepCreated(actor, step.new_due ? t.due(formatDue(step.new_due)) : t.noDue);
    if (step.kind === "taken") return t.stepTaken(actor);
    if (step.kind === "done") return t.stepDone(actor);
    if (step.kind === "failed") return t.stepFailed(actor);
    if (step.kind === "cancelled") return t.stepCancelled(actor);
    if (step.kind === "moved") return t.stepMoved(actor, due(step.old_due), due(step.new_due));
    const c = step.changes ?? {};
    const parts = [
      c.title ? t.changeTitle(c.title.from ?? "", c.title.to ?? "") : null,
      c.body ? t.changeBody : null,
      c.project ? t.changeProject(project(c.project.from), project(c.project.to)) : null,
      c.assignee ? t.changeAssignee(who(c.assignee.from), who(c.assignee.to)) : null,
    ].filter(Boolean);
    return parts.length ? `${t.stepEdited(actor)}: ${parts.join("; ")}` : t.stepEdited(actor);
  };
  return (
    <ol className="mt-2 flex flex-col gap-1 border-l border-line pl-3 text-xs text-muted">
      {steps.map((step) => (
        <li key={step.id}>
          <span className="font-mono text-faint">{formatDue(step.at)}</span> {line(step)}
        </li>
      ))}
    </ol>
  );
}

function bucketName(t: T, bucket: DueBucket): string {
  return {
    overdue: t.bucketOverdue,
    today: t.bucketToday,
    tomorrow: t.bucketTomorrow,
    week: t.bucketWeek,
    later: t.bucketLater,
    none: t.bucketNone,
  }[bucket];
}

/** Список задач — сплошной или по группам. */
function TaskList({
  tasks,
  ctx,
  group,
  personOf,
  empty,
}: {
  tasks: Task[];
  ctx: RowContext;
  group: TaskGroup;
  /** По какому человеку группировать: в «Мне» — кто поставил, в «Я поставил» — кому. */
  personOf: (task: Task) => string;
  empty: string;
}) {
  const { t } = ctx;
  if (!tasks.length) return <p className="text-sm text-faint">{empty}</p>;
  const rows = (list: Task[]) => (
    <ul className="flex flex-col gap-2 text-sm">
      {list.map((task) => (
        <TaskRow key={task.id} task={task} ctx={ctx} />
      ))}
    </ul>
  );
  if (group === "none") return rows(tasks);

  const groups =
    group === "due"
      ? groupTasks(tasks, (task) => dueBucket(task, ctx.now), DUE_BUCKETS)
      : group === "project"
        ? groupTasks(tasks, (task) => task.project_id ?? "")
        : groupTasks(tasks, personOf);
  const title = (key: string) =>
    group === "due"
      ? bucketName(t, key as DueBucket)
      : group === "project"
        ? key
          ? (ctx.projects.get(key) ?? "—")
          : t.groupNoProject
        : (ctx.names.get(key) ?? "—");

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <div key={g.key || "none"}>
          <h4 className="mb-1.5 text-xs text-muted">
            {title(g.key)} <span className="font-mono text-faint">{g.tasks.length}</span>
          </h4>
          {rows(g.tasks)}
        </div>
      ))}
    </div>
  );
}

const OK_NOTICES: ReadonlySet<string> = new Set([
  "created",
  "createdLater",
  "createdMany",
  "createdManyLater",
  "taken",
  "done",
  "failed",
  "moved",
  "cancelled",
  "edited",
  "editedNew",
  "editedNewLater",
]);

function Notice({ code, locale }: { code?: string; locale: PanelLocale }) {
  const notices = pick(taskNoticeDict, locale);
  if (!code || !(code in notices)) return null;
  const ok = OK_NOTICES.has(code);
  return (
    <p
      className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
        ok ? "border-green/30 bg-green/5 text-green" : "border-gold/30 bg-gold/5 text-gold"
      }`}
    >
      {notices[code as keyof typeof notices]}
    </p>
  );
}

export function TasksView({
  staff,
  locale,
  board,
  people,
  projects,
  notice,
  now,
  group = "none",
  projectFilter = "",
  prefillProject = "",
}: {
  staff: Pick<Staff, "id">;
  locale: PanelLocale;
  board: TaskBoard;
  people: { id: string; display_name: string }[];
  /** Открытые проекты — для формы и фильтра. */
  projects: { id: string; label: string }[];
  notice?: string;
  now: Date;
  group?: TaskGroup;
  /** Фильтр по проекту: id, «none» — без проекта, пусто — все. */
  projectFilter?: string;
  /** Проект, подставленный в форму, — пришли из карточки проекта. */
  prefillProject?: string;
}) {
  const t = pick(tasksDict, locale);
  // Себя — первым: задачу себе ставят часто.
  const options = [...people].sort((a, b) => (a.id === staff.id ? -1 : b.id === staff.id ? 1 : 0));
  const labels = new Map([...board.projects, ...projects.map((p) => [p.id, p.label] as const)]);
  const keep: Record<string, string> = {};
  if (group !== "none") keep.tg = group;
  if (projectFilter) keep.tf = projectFilter;
  const ctx: RowContext = {
    t,
    me: staff.id,
    names: board.names,
    projects: labels,
    now,
    back: "/admin/tasks",
    keep,
    steps: board.steps,
    people,
    projectOptions: projects,
  };

  const byProject = (task: Task) =>
    !projectFilter || (projectFilter === "none" ? !task.project_id : task.project_id === projectFilter);
  const mine = board.mine.filter(byProject);
  const given = board.given.filter(byProject);
  // Фильтр по проекту, которого уже нет в открытых, — всё равно в списке.
  const filterOptions = [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <section id="tasks" className="mb-6 scroll-mt-28 rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-faint">
          {t.title}
          <HelpHint topic={helpAnchor("/admin/tasks", "board")} />
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Link href="#history" className="text-xs text-green hover:underline">
            {t.historyLink} ↓
          </Link>
          <TaskAlertsButton />
        </div>
      </div>

      <Notice code={notice} locale={locale} />
      {board.offline ? <p className="mt-3 text-sm text-gold">{t.offline}</p> : null}

      {/* Фильтр — обычной формой в адрес: выбор переживает перезагрузку и
          нажатия кнопок в задачах. */}
      <form action="/admin/tasks" className="mt-3 flex flex-wrap items-end gap-2 text-xs text-muted">
        <label className="grid min-w-0 gap-1">
          {t.groupBy}
          <select name="tg" defaultValue={group} className="rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text">
            <option value="none">{t.groupNone}</option>
            <option value="due">{t.groupDue}</option>
            <option value="project">{t.groupProject}</option>
            <option value="person">{t.groupPerson}</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-1">
          {t.filterProject}
          <select
            name="tf"
            defaultValue={projectFilter}
            className="w-full min-w-0 max-w-[16rem] rounded-lg border border-line bg-ink px-2 py-1.5 text-xs text-text"
          >
            <option value="">{t.allProjects}</option>
            <option value="none">{t.groupNoProject}</option>
            {filterOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-xs text-text hover:border-green/50">
          {t.apply}
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-muted">
            {t.forMe}
            {mine.length ? <span className="ml-1.5 font-mono text-gold">{mine.length}</span> : null}
          </h3>
          <TaskList tasks={mine} ctx={ctx} group={group} personOf={(task) => task.creator_id} empty={t.nothingMine} />
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-muted">{t.iGave}</h3>
          <TaskList tasks={given} ctx={ctx} group={group} personOf={(task) => task.assignee_id} empty={t.nothingGiven} />
        </div>
      </div>

      <details
        className="mt-5 border-t border-line pt-4"
        open={Boolean(prefillProject) || (!board.mine.length && !board.given.length)}
      >
        <summary className="cursor-pointer text-sm text-green hover:underline">{t.newTask}</summary>
        <form action={createTaskAction} className="mt-3 grid grid-cols-1 gap-3 sm:max-w-xl">
          <input type="hidden" name="back" value="/admin/tasks" />
          {Object.entries(keep).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          {/* «Кому» — галочки, а не выпадающий список: задачу ставят и
              нескольким сразу (владелец, 04.10), каждому — своя. Себя
              первым и отмеченным: себе ставят чаще всего. */}
          <fieldset className="grid min-w-0 gap-1.5 text-xs text-muted">
            <legend className="mb-1">{t.fieldWho}</legend>
            <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {options.map((p) => (
                <label
                  key={p.id}
                  className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text has-[:checked]:border-green/50 has-[:checked]:bg-green/5"
                >
                  <input type="checkbox" name="assignee" value={p.id} defaultChecked={p.id === staff.id} className="accent-green" />
                  <span className="truncate">{p.id === staff.id ? t.self(p.display_name) : p.display_name}</span>
                </label>
              ))}
            </div>
            <span className="text-faint">{t.whoHint}</span>
          </fieldset>
          <label className="grid min-w-0 gap-1 text-xs text-muted">
            {t.fieldTitle}
            <input name="title" required maxLength={200} className={FIELD} />
          </label>
          <label className="grid min-w-0 gap-1 text-xs text-muted">
            {t.fieldBody}
            <textarea name="body" rows={2} maxLength={2000} className={FIELD} />
          </label>
          <label className="grid min-w-0 gap-1 text-xs text-muted">
            {t.fieldProject}
            <select name="project" defaultValue={prefillProject} className={FIELD}>
              <option value="">{t.projectNone}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {projects.length ? null : <span className="text-faint">{t.noProjects}</span>}
          </label>
          <fieldset className="grid min-w-0 gap-2 text-xs text-muted">
            <legend className="mb-1">{t.fieldDue}</legend>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text">
              {(
                [
                  ["today", t.dueToday],
                  ["tomorrow", t.dueTomorrow],
                  ["3days", t.due3days],
                  ["none", t.dueNone],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5">
                  <input type="radio" name="due" value={value} defaultChecked={value === "tomorrow"} />
                  {label}
                </label>
              ))}
              <label className="flex flex-wrap items-center gap-1.5">
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

/** Блок целиком: читает задачи, людей и проекты, рисует TasksView. */
export async function TasksBlock({
  staff,
  notice,
  group,
  projectFilter,
  prefillProject,
}: {
  staff: Staff;
  notice?: string;
  group?: string;
  projectFilter?: string;
  prefillProject?: string;
}) {
  const now = new Date();
  const [board, people, projects] = await Promise.all([taskBoard(staff.id, now), taskPeople(), taskProjects()]);
  const clean = (v?: string) => (v && /^[0-9a-z-]{1,40}$/i.test(v) ? v : "");
  return (
    <TasksView
      staff={staff}
      locale={staff.panel_locale}
      board={board}
      people={people}
      projects={projects}
      notice={notice}
      now={now}
      group={taskGroup(group)}
      projectFilter={clean(projectFilter)}
      prefillProject={projects.some((p) => p.id === prefillProject) ? prefillProject : ""}
    />
  );
}

/** Задачи проекта — в его карточке: кто, кому, срок, статус и кнопка поставить новую. */
export function ProjectTasksView({
  staff,
  locale,
  projectId,
  tasks,
  names,
  notice,
  now,
  steps,
  projects,
  people,
  projectOptions,
}: {
  staff: Pick<Staff, "id">;
  locale: PanelLocale;
  projectId: string;
  tasks: Task[];
  names: Map<string, string>;
  notice?: string;
  now: Date;
  steps?: Map<string, TaskStep[]>;
  /** Подписи проектов — для истории правок и формы «Изменить». */
  projects?: Map<string, string>;
  people?: { id: string; display_name: string }[];
  projectOptions?: { id: string; label: string }[];
}) {
  const t = pick(tasksDict, locale);
  const ctx: RowContext = {
    t,
    me: staff.id,
    names,
    projects: projects ?? new Map(),
    now,
    back: `/admin/projects/${projectId}`,
    keep: {},
    hideProject: true,
    steps,
    people,
    projectOptions,
  };
  return (
    <section id="tasks" className="scroll-mt-28 rounded-xl border border-line bg-surface px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider text-faint">
          {t.projectTasks}
          <HelpHint topic={helpAnchor("/admin/projects", "tasks")} />
        </h2>
        <Link href={`/admin/tasks?tp=${projectId}#tasks`} className="ml-auto text-sm text-green hover:underline">
          {t.newTask}
        </Link>
      </div>
      <Notice code={notice} locale={locale} />
      <div className="mt-3">
        <TaskList tasks={tasks} ctx={ctx} group="none" personOf={(task) => task.assignee_id} empty={t.nothingProject} />
      </div>
    </section>
  );
}

export async function ProjectTasksBlock({ staff, projectId, notice }: { staff: Staff; projectId: string; notice?: string }) {
  const [{ tasks, names, projects, steps }, people, projectOptions] = await Promise.all([
    projectTasks(projectId),
    taskPeople(),
    taskProjects(),
  ]);
  return (
    <ProjectTasksView
      staff={staff}
      locale={staff.panel_locale}
      projectId={projectId}
      tasks={tasks}
      names={names}
      notice={notice}
      now={new Date()}
      steps={steps}
      projects={projects}
      people={people}
      projectOptions={projectOptions}
    />
  );
}
