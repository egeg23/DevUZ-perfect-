import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskHistoryView } from "@/components/admin/task-history";
import { ProjectTasksView, TasksView } from "@/components/admin/tasks-block";
import { helpTopicFor } from "@/lib/admin/help";
import { changedText, handedOverCard, handedOverText, stepText } from "@/lib/admin/task-bot";
import type { TaskHistory } from "@/lib/admin/task-store";
import {
  canEdit,
  feedFor,
  hasHistory,
  historyCounts,
  historyDays,
  historyKind,
  movesOf,
  personRows,
  seesTask,
  taskChanges,
  type Task,
  type TaskStep,
} from "@/lib/admin/tasks";

/**
 * Правка задач и история.
 *
 * Владелец, 13.10.2026: «Сделай возможность редактировать задачи + видеть
 * историю выполненных / отклонённых задач или переноса срока».
 *
 * Держит: кто правит (только поставивший, только открытую), что попадает в
 * историю (было → стало), кто чью историю видит (менеджер — свои,
 * руководитель — команду без личных задач владельца, владелец — всё), и что
 * панель рисует это на трёх языках.
 *
 * Запуск: npm test
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const tk = (iso: string) => new Date(`${iso}+05:00`);

const task = (patch: Partial<Task> = {}): Task => ({
  id: "11111111-2222-3333-4444-555555555555",
  title: "Prepare offer",
  body: "",
  creator_id: "boss",
  assignee_id: "worker",
  due_at: tk("2026-10-15T18:00:00").toISOString(),
  project_id: null,
  status: "in_work",
  created_at: tk("2026-10-10T10:00:00").toISOString(),
  taken_at: tk("2026-10-10T10:05:00").toISOString(),
  closed_at: null,
  updated_at: tk("2026-10-12T10:00:00").toISOString(),
  last_event: "moved",
  last_actor_id: "worker",
  tg_chat: null,
  tg_message_id: null,
  notified_at: tk("2026-10-10T10:00:00").toISOString(),
  take_nudged_at: null,
  soon_nudged_at: null,
  overdue_sent_at: null,
  awaiting_date_at: null,
  ...patch,
});

let seq = 0;
const step = (patch: Partial<TaskStep>): TaskStep => ({
  id: ++seq,
  task_id: "11111111-2222-3333-4444-555555555555",
  actor_id: "boss",
  kind: "created",
  old_due: null,
  new_due: null,
  at: tk("2026-10-10T10:00:00").toISOString(),
  changes: null,
  ...patch,
});

const STEPS: TaskStep[] = [
  step({ kind: "created", new_due: tk("2026-10-12T18:00:00").toISOString() }),
  step({ kind: "taken", actor_id: "worker", at: tk("2026-10-10T10:05:00").toISOString() }),
  step({
    kind: "moved",
    actor_id: "worker",
    old_due: tk("2026-10-12T18:00:00").toISOString(),
    new_due: tk("2026-10-15T18:00:00").toISOString(),
    at: tk("2026-10-12T10:00:00").toISOString(),
  }),
  step({
    kind: "edited",
    at: tk("2026-10-12T11:00:00").toISOString(),
    changes: { title: { from: "Offer", to: "Prepare offer" }, assignee: { from: "head", to: "worker" } },
  }),
];

/* ── Правила ──────────────────────────────────────────────────────────── */

test("править может только тот, кто поставил, и только открытую задачу", () => {
  assert.equal(canEdit(task(), "boss"), null);
  assert.equal(canEdit(task(), "worker"), "not_yours", "исполнитель не переписывает поручение");
  assert.equal(canEdit(task({ status: "done" }), "boss"), "closed");
  assert.equal(canEdit(task({ status: "cancelled" }), "boss"), "closed");
  assert.equal(canEdit(task({ status: "new" }), "boss"), null);
});

test("что поменялось — было → стало; пробелы и пустой проект — не изменение", () => {
  const t = task({ title: "Prepare offer", body: "For Ali", project_id: "p1" });
  assert.deepEqual(taskChanges(t, { title: "  Prepare   offer ", body: "For Ali ", projectId: "p1", assigneeId: "worker" }), {});
  assert.deepEqual(taskChanges(task(), { title: "Prepare offer", body: "", projectId: "", assigneeId: "worker" } as never), {});
  assert.deepEqual(taskChanges(t, { title: "Send offer", body: "", projectId: null, assigneeId: "head" }), {
    title: { from: "Prepare offer", to: "Send offer" },
    body: { from: "For Ali", to: "" },
    project: { from: "p1", to: null },
    assignee: { from: "worker", to: "head" },
  });
});

test("историю менеджер видит свою, руководитель — команду без личных задач владельца, владелец — всё", () => {
  const owners = new Set(["boss"]);
  const ownerSelf = task({ creator_id: "boss", assignee_id: "boss" });
  const team = task({ creator_id: "head", assignee_id: "worker" });
  const mine = task({ creator_id: "boss", assignee_id: "worker" });
  assert.equal(seesTask(mine, { id: "worker", role: "manager" }, owners), true);
  assert.equal(seesTask(team, { id: "other", role: "manager" }, owners), false);
  assert.equal(seesTask(team, { id: "head2", role: "head" }, owners), true);
  assert.equal(seesTask(ownerSelf, { id: "head2", role: "head" }, owners), false);
  assert.equal(seesTask(ownerSelf, { id: "boss", role: "admin" }, owners), true);
  assert.equal(seesTask(team, { id: "boss", role: "admin" }, owners), true);
});

test("итоги периода и таблица по людям — по исполнителю", () => {
  const steps: Pick<TaskStep, "task_id" | "kind">[] = [
    { task_id: "a", kind: "done" },
    { task_id: "a", kind: "moved" },
    { task_id: "a", kind: "moved" },
    { task_id: "b", kind: "failed" },
    { task_id: "c", kind: "cancelled" },
    { task_id: "c", kind: "edited" },
  ];
  assert.deepEqual(historyCounts(steps), { done: 1, failed: 1, cancelled: 1, moved: 2, edited: 1 });
  const rows = personRows(steps, new Map([["a", "ali"], ["b", "timur"], ["c", "ali"]]));
  assert.deepEqual(rows[0], { id: "ali", done: 1, failed: 0, moved: 2, cancelled: 1 });
  assert.deepEqual(rows[1], { id: "timur", done: 0, failed: 1, moved: 0, cancelled: 0 });
  assert.equal(movesOf(STEPS), 1);
  assert.equal(hasHistory([step({ kind: "created" })]), false, "одна постановка — истории нет");
  assert.equal(hasHistory(STEPS), true);
  assert.equal(historyDays("90"), 90);
  assert.equal(historyDays("5"), 30, "чужое значение — 30 дней");
  assert.equal(historyKind("moved"), "moved");
  assert.equal(historyKind("x"), "all");
});

/* ── Telegram ─────────────────────────────────────────────────────────── */

test("бот: что изменили — словами; передали — прежнему строка, карточка без кнопок", () => {
  assert.equal(changedText({ body: { from: "", to: "x" }, title: { from: "a", to: "b" } }), "название, описание");
  assert.match(stepText("edited", "Egor", { title: "Send offer" }, null, { project: { from: null, to: "p1" } }), /✏️ Egor изменил\(а\) задачу «Send offer»: проект\./);
  assert.match(handedOverText({ title: "Send offer" }, "Egor", "Timur"), /передал\(а\) задачу «Send offer» — теперь она у Timur\. С вас она снята\./);
  assert.match(handedOverCard({ title: "Send <b>", body: "", due_at: null }, "Timur"), /Задача передана.*Timur[\s\S]*Send &lt;b&gt;/);
});

test("правка звенит исполнителю; новому исполнителю — как новая задача", () => {
  const since = tk("2026-10-12T09:00:00");
  const later = tk("2026-10-12T11:00:00").toISOString();
  const edited = feedFor([task({ updated_at: later, last_event: "edited", last_actor_id: "boss" })], "worker", since);
  assert.equal(edited[0]?.kind, "edited");
  // Передали другому: last_event — «created», и новый исполнитель видит «поставил(а) вам задачу».
  const handed = feedFor([task({ assignee_id: "timur", updated_at: later, last_event: "created", last_actor_id: "boss" })], "timur", since);
  assert.equal(handed[0]?.kind, "assigned");
  const store = read("lib/admin/task-store.ts");
  assert.match(store, /last_event: changes\.assignee \? "created" : "edited"/);
});

/* ── База ─────────────────────────────────────────────────────────────── */

test("правка пишется поверх увиденного и оставляет шаг «edited» с тем, что поменяли", () => {
  const store = read("lib/admin/task-store.ts");
  const edit = store.slice(store.indexOf("export async function editTask("), store.indexOf("export async function afterEdit("));
  assert.ok(edit.indexOf("canEdit(task, actor.id)") < edit.indexOf(".update(patch)"), "проверка прав — до записи");
  assert.match(edit, /\.eq\("updated_at", task\.updated_at\)/);
  assert.match(edit, /kind: "edited", changes, at/);
  assert.match(edit, /record\("task\.edited"/);
  // Сменили исполнителя — у нового всё с нуля: статус, сообщение бота, напоминания.
  for (const field of ["status: initialStatus(task.creator_id, edit.assigneeId)", "notified_at: self ? at : null", "tg_message_id: null", "overdue_sent_at: null"]) {
    assert.ok(edit.includes(field), `при передаче не сбрасывается ${field}`);
  }
  const after = store.slice(store.indexOf("export async function afterEdit("), store.indexOf("/* ── История за период"));
  assert.match(after, /if \(!messageWindow\(now\)\) return;/, "ночью бот молчит — утром дошлёт свип");
  assert.match(after, /deliverAssignment\(task\.id\)/);

  const sql = read("supabase/migrations/0160_task_edits.sql");
  assert.match(sql, /add column if not exists changes jsonb/);
  assert.match(sql, /'cancelled', 'edited'\)\);[\s\S]*'cancelled', 'edited'\)\);/);
  assert.match(read("supabase/migrations/0160_task_edits.down.sql"), /drop column if exists changes/);
  assert.match(read("lib/admin/audit.ts"), /"task\.edited"/);
});

/* ── Панель ───────────────────────────────────────────────────────────── */

const people = [
  { id: "boss", display_name: "Egor" },
  { id: "worker", display_name: "Ali" },
  { id: "head", display_name: "Timur" },
];
const names = new Map(people.map((p) => [p.id, p.display_name]));
const now = tk("2026-10-13T12:00:00");

test("«Изменить» — у поставившего; «История» — у задачи с шагами; ссылка на историю", () => {
  const board = {
    offline: false,
    mine: [] as Task[],
    given: [task()],
    names,
    projects: new Map<string, string>(),
    steps: new Map([[task().id, STEPS]]),
  };
  const boss = renderToStaticMarkup(createElement(TasksView, { staff: { id: "boss" }, locale: "ru", board, people, projects: [], now }));
  assert.match(boss, /Изменить/);
  assert.match(boss, /<select name="assignee"/);
  assert.match(boss, /value="Prepare offer"/);
  assert.match(boss, /История · 4/);
  assert.match(boss, /переносов: 1/);
  assert.match(boss, /Ali перенёс\(ла\) срок: 12\.10 18:00 → 15\.10 18:00/);
  assert.match(boss, /название: «Offer» → «Prepare offer»; исполнитель: Timur → Ali/);
  assert.match(boss, /href="#history"/, "история — ниже на той же странице");
  assert.match(boss, /name="back" value="\/admin\/tasks"/, "нажатие возвращает в раздел «Задачи»");

  const worker = renderToStaticMarkup(
    createElement(TasksView, { staff: { id: "worker" }, locale: "ru", board: { ...board, mine: [task()], given: [] }, people, projects: [], now }),
  );
  assert.doesNotMatch(worker, /<select name="assignee"/, "исполнитель задачу не правит");
  assert.match(worker, /История · 4/, "историю видит и исполнитель");

  for (const locale of ["uz", "pl"] as const) {
    const html = renderToStaticMarkup(createElement(TasksView, { staff: { id: "boss" }, locale, board, people, projects: [], now }));
    const text = html.replace(/<[^>]+>/g, " ").replace(/«Offer»|«Prepare offer»|Prepare offer/g, "");
    assert.ok(!/[а-яё]/i.test(text), `${locale}: русское в блоке: ${text.match(/\S*[а-яё]\S*/i)}`);
    const card = renderToStaticMarkup(
      createElement(ProjectTasksView, { staff: { id: "boss" }, locale, projectId: "p1", tasks: [task()], names, now, steps: board.steps, people }),
    );
    assert.ok(!/[а-яё]/i.test(card.replace(/<[^>]+>/g, " ").replace(/«Offer»|«Prepare offer»|Prepare offer/g, "")), `${locale}: русское в карточке проекта`);
  }
});

const history = (patch: Partial<TaskHistory> = {}): TaskHistory => ({
  offline: false,
  tasks: [task()],
  steps: new Map([[task().id, STEPS]]),
  period: STEPS.filter((s) => s.kind !== "created" && s.kind !== "taken"),
  assigneeOf: new Map([[task().id, "worker"]]),
  names,
  projects: new Map(),
  people,
  more: false,
  ...patch,
});

test("«История задач»: менеджеру — свои без фильтра «Чьи»; руководителю — таблица по людям", () => {
  const manager = renderToStaticMarkup(
    createElement(TaskHistoryView, { viewer: { id: "worker", role: "manager" }, locale: "ru", history: history(), days: 30, kind: "all", person: "", now }),
  );
  assert.match(manager, /История задач/);
  assert.doesNotMatch(manager, /name="p"/, "менеджеру «Чьи» не нужно");
  assert.doesNotMatch(manager, /По людям/);
  assert.match(manager, /переносов срока: 1/);
  assert.match(manager, /изменений: 1/);

  const head = renderToStaticMarkup(
    createElement(TaskHistoryView, { viewer: { id: "head", role: "head" }, locale: "ru", history: history(), days: 30, kind: "all", person: "", now }),
  );
  assert.match(head, /name="p"/);
  assert.match(head, /По людям/);
  assert.match(head, /href="\/admin\/tasks\?p=worker&amp;d=30#history"/);
  const one = renderToStaticMarkup(
    createElement(TaskHistoryView, { viewer: { id: "head", role: "head" }, locale: "ru", history: history(), days: 30, kind: "all", person: "worker", now }),
  );
  assert.doesNotMatch(one, /По людям/, "выбран один человек — таблица не нужна");

  const empty = renderToStaticMarkup(
    createElement(TaskHistoryView, { viewer: { id: "head", role: "head" }, locale: "ru", history: history({ tasks: [], period: [] }), days: 7, kind: "done", person: "", now }),
  );
  assert.match(empty, /ничего не происходило/);

  for (const locale of ["uz", "pl"] as const) {
    const html = renderToStaticMarkup(
      createElement(TaskHistoryView, { viewer: { id: "boss", role: "admin" }, locale, history: history({ more: true }), days: 30, kind: "all", person: "", now }),
    );
    const text = html.replace(/<[^>]+>/g, " ").replace(/«Offer»|«Prepare offer»|Prepare offer/g, "");
    assert.ok(!/[а-яё]/i.test(text), `${locale}: русское на странице истории: ${text.match(/\S*[а-яё]\S*/i)}`);
  }
});

test("раздел «Задачи» — у всех ролей, блок и история на одной странице", () => {
  const page = read("app/admin/tasks/page.tsx");
  assert.match(page, /await requireSection\("\/admin\/tasks"\)/);
  assert.match(page, /<TasksBlock/);
  assert.match(page, /<TaskHistoryView/);
  assert.doesNotMatch(read("app/admin/page.tsx"), /<TasksBlock/, "на «Лидах» блока задач нет");
  assert.match(page, /staff\.role !== "manager"/, "чужого человека менеджер в адресе не подставит");
  assert.equal(helpTopicFor("/admin/tasks"), "/admin/help#tasks");
  assert.equal(helpTopicFor("/admin/tasks?d=7"), "/admin/help#tasks");
  assert.equal(helpTopicFor("/admin/tasks/7"), "/admin/help#tasks-history");
  assert.equal(helpTopicFor("/admin/leads/abc"), "/admin/help#leads-card", "карточки лида — как раньше");
  assert.equal(helpTopicFor("/admin/leads"), "/admin/help#leads", "список лидов — как раньше");
});
