import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProjectTasksView, TasksView } from "@/components/admin/tasks-block";
import { moveRows, looksLikeDue, stepText, taskRows } from "@/lib/admin/task-bot";
import {
  byDue,
  canAct,
  dueBucket,
  feedFor,
  groupTasks,
  messageWindow,
  notifyOf,
  projectLabel,
  formatDue,
  initialStatus,
  movedDue,
  nudgesDue,
  parseDueText,
  parseLocalInput,
  quickDue,
  taskWindow,
  type Task,
} from "@/lib/admin/tasks";

/**
 * Задачи команды.
 *
 * Владелец, 01.10: «Все могут ставить задачи на всех. Тот, на кого
 * поставили, должен взять её в работу (можно через бота в тг сразу принять
 * задачу и там же нажать — сделано / не сделано / перенос срока)». Тест
 * держит то, что легко сломать незаметно: сроки по Ташкенту, кто что может,
 * когда напоминать и что считать новым для звука в браузере.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** Момент по часам Ташкента (UTC+5). */
const tk = (iso: string) => new Date(`${iso}+05:00`);

const task = (patch: Partial<Task> = {}): Task => ({
  id: "11111111-2222-3333-4444-555555555555",
  title: "Prepare offer",
  body: "",
  creator_id: "boss",
  assignee_id: "worker",
  due_at: tk("2026-10-05T18:00:00").toISOString(),
  project_id: null,
  status: "new",
  created_at: tk("2026-10-01T10:00:00").toISOString(),
  taken_at: null,
  closed_at: null,
  updated_at: tk("2026-10-01T10:00:00").toISOString(),
  last_event: "created",
  last_actor_id: "boss",
  tg_chat: null,
  tg_message_id: null,
  notified_at: null,
  take_nudged_at: null,
  soon_nudged_at: null,
  overdue_sent_at: null,
  awaiting_date_at: null,
  ...patch,
});

/* ── Сроки ────────────────────────────────────────────────────────────── */

test("срок, написанный боту, — по Ташкенту; без года — ближайший впереди", () => {
  const now = tk("2026-10-01T12:00:00");
  assert.equal(parseDueText("05.10 15:00", now)?.toISOString(), tk("2026-10-05T15:00:00").toISOString());
  assert.equal(parseDueText(" 5.10 9:30 ", now)?.toISOString(), tk("2026-10-05T09:30:00").toISOString());
  assert.equal(parseDueText("05.10.2027 15:00", now)?.toISOString(), tk("2027-10-05T15:00:00").toISOString());
  // Январь, написанный в декабре, — следующий год, а не прошедший.
  assert.equal(
    parseDueText("05.01 10:00", tk("2026-12-20T10:00:00"))?.toISOString(),
    tk("2027-01-05T10:00:00").toISOString(),
  );
  // Невозможная дата — не первое марта, а отказ.
  assert.equal(parseDueText("31.02 10:00", now), null);
  assert.equal(parseDueText("05.13 10:00", now), null);
  assert.equal(parseDueText("05.10 25:00", now), null);
  assert.equal(parseDueText("завтра", now), null);
  assert.equal(formatDue(tk("2026-10-05T15:00:00")), "05.10 15:00");
  assert.equal(parseLocalInput("2026-10-05T15:00")?.toISOString(), tk("2026-10-05T15:00:00").toISOString());
  assert.equal(parseLocalInput("2026-02-31T15:00"), null);
});

test("быстрые сроки — до 18:00 по Ташкенту", () => {
  const now = tk("2026-10-01T23:30:00");
  assert.equal(quickDue("today", now).toISOString(), tk("2026-10-01T18:00:00").toISOString());
  assert.equal(quickDue("tomorrow", now).toISOString(), tk("2026-10-02T18:00:00").toISOString());
  assert.equal(quickDue("3days", now).toISOString(), tk("2026-10-04T18:00:00").toISOString());
  // В UTC это ещё 1-е число, в Ташкенте уже 2-е: «завтра» — 3-е.
  const late = new Date("2026-10-01T20:00:00Z");
  assert.equal(quickDue("tomorrow", late).toISOString(), tk("2026-10-03T18:00:00").toISOString());
});

test("перенос считается от срока, а у просроченной — от «сейчас»", () => {
  const due = tk("2026-10-05T18:00:00");
  const before = tk("2026-10-05T10:00:00");
  assert.equal(movedDue("1h", due, before).toISOString(), tk("2026-10-05T19:00:00").toISOString());
  assert.equal(movedDue("3d", due, before).toISOString(), tk("2026-10-08T18:00:00").toISOString());
  assert.equal(movedDue("week", due, before).toISOString(), tk("2026-10-12T18:00:00").toISOString());
  assert.equal(movedDue("tomorrow", due, before).toISOString(), tk("2026-10-06T18:00:00").toISOString());
  const after = tk("2026-10-07T09:00:00");
  assert.equal(movedDue("1h", due, after).toISOString(), tk("2026-10-07T10:00:00").toISOString());
});

/* ── Кто что может ────────────────────────────────────────────────────── */

test("закрывает задачу только исполнитель, отменяет — поставивший, срок двигают оба", () => {
  assert.equal(canAct(task(), "worker", "take"), null);
  assert.equal(canAct(task(), "boss", "done"), "not_yours");
  assert.equal(canAct(task(), "boss", "take"), "not_yours");
  assert.equal(canAct(task(), "boss", "move"), null);
  assert.equal(canAct(task(), "boss", "cancel"), null);
  assert.equal(canAct(task(), "worker", "cancel"), "not_yours", "исполнителю — «Не сделано», а не стереть");
  assert.equal(canAct(task(), "stranger", "move"), "not_yours");
  assert.equal(canAct(task({ status: "cancelled" }), "boss", "move"), "closed");
  // О шаге узнаёт другая сторона; себе — никто.
  assert.equal(notifyOf(task(), "worker"), "boss");
  assert.equal(notifyOf(task(), "boss"), "worker");
  assert.equal(notifyOf(task({ creator_id: "worker" }), "worker"), null);
  assert.equal(canAct(task(), "worker", "done"), null, "сделал сразу — брать незачем");
  assert.equal(canAct(task({ status: "in_work" }), "worker", "take"), "taken");
  assert.equal(canAct(task({ status: "done" }), "worker", "move"), "closed");
  assert.equal(canAct(task({ status: "failed" }), "worker", "done"), "closed");
  assert.equal(initialStatus("a", "a"), "in_work", "себе — сразу в работе");
  assert.equal(initialStatus("a", "b"), "new");
});

/* ── Напоминания ──────────────────────────────────────────────────────── */

test("не взяли за 30 минут после сообщения бота — напомнить, один раз", () => {
  const notified = tk("2026-10-01T10:00:00").toISOString();
  assert.deepEqual(nudgesDue(task({ notified_at: notified }), tk("2026-10-01T10:29:00")), []);
  assert.deepEqual(nudgesDue(task({ notified_at: notified }), tk("2026-10-01T10:30:00")), ["take"]);
  assert.deepEqual(nudgesDue(task({ notified_at: notified, take_nudged_at: notified }), tk("2026-10-01T11:00:00")), []);
  // Бот ещё не написал (поставили ночью) — упрекать не за что.
  assert.deepEqual(nudgesDue(task(), tk("2026-10-01T12:00:00")), []);
  assert.deepEqual(nudgesDue(task({ status: "in_work", notified_at: notified }), tk("2026-10-01T12:00:00")), []);
});

test("за час до срока — напомнить; задаче, у которой часа и не было, — нет", () => {
  const t = task({ status: "in_work" });
  assert.deepEqual(nudgesDue(t, tk("2026-10-05T16:59:00")), []);
  assert.deepEqual(nudgesDue(t, tk("2026-10-05T17:00:00")), ["soon"]);
  assert.deepEqual(nudgesDue({ ...t, soon_nudged_at: "x" }, tk("2026-10-05T17:30:00")), []);
  const rushed = task({
    status: "in_work",
    created_at: tk("2026-10-05T17:20:00").toISOString(),
    updated_at: tk("2026-10-05T17:20:00").toISOString(),
  });
  assert.deepEqual(nudgesDue(rushed, tk("2026-10-05T17:30:00")), []);
});

test("просрочено — один раз; закрытой — ничего", () => {
  const t = task({ status: "in_work" });
  assert.deepEqual(nudgesDue(t, tk("2026-10-05T18:00:00")), ["overdue"]);
  assert.deepEqual(nudgesDue({ ...t, overdue_sent_at: "x" }, tk("2026-10-06T10:00:00")), []);
  assert.deepEqual(nudgesDue({ ...t, status: "done" }, tk("2026-10-06T10:00:00")), []);
});

test("без срока — только «ещё не взяли», напоминаний о сроке нет", () => {
  const notified = tk("2026-10-01T10:00:00").toISOString();
  const t = task({ due_at: null, notified_at: notified });
  assert.deepEqual(nudgesDue(t, tk("2026-10-01T10:30:00")), ["take"]);
  assert.deepEqual(nudgesDue({ ...t, status: "in_work" }, tk("2027-01-01T10:00:00")), []);
  assert.equal(movedDue("1h", null, tk("2026-10-01T10:00:00")).toISOString(), tk("2026-10-01T11:00:00").toISOString());
});

test("сообщения о действиях — сразу, кроме ночи 23:00–07:00, и в выходной тоже", () => {
  assert.equal(messageWindow(tk("2026-10-01T20:30:00")), true);
  assert.equal(messageWindow(tk("2026-10-04T12:00:00")), true); // воскресенье
  assert.equal(messageWindow(tk("2026-10-01T23:00:00")), false);
  assert.equal(messageWindow(tk("2026-10-02T06:59:00")), false);
  assert.equal(messageWindow(tk("2026-10-02T07:00:00")), true);
  const action = read("app/admin/tasks/actions.ts");
  assert.match(action, /if \(messageWindow\(now\)\) \{\s+after\(\(\) => deliverAll\(others\)\);/);
  assert.match(action, /async function deliverAll[\s\S]*?await deliverAssignment\(task\.id\)/);
});

test("порядок — от ближайшего срока к дальнему, без срока в конце", () => {
  const rows = [
    task({ id: "late", due_at: tk("2026-10-09T10:00:00").toISOString() }),
    task({ id: "none-old", due_at: null, created_at: tk("2026-09-01T10:00:00").toISOString() }),
    task({ id: "soon", due_at: tk("2026-10-02T10:00:00").toISOString() }),
    task({ id: "none-new", due_at: null, created_at: tk("2026-10-01T10:00:00").toISOString() }),
  ];
  assert.deepEqual([...rows].sort(byDue).map((r) => r.id), ["soon", "late", "none-new", "none-old"]);
});

test("группы: по сроку — в своём порядке, по проекту — «без проекта» в конце", () => {
  const now = tk("2026-10-01T12:00:00");
  const at = (iso: string) => tk(iso).toISOString();
  assert.equal(dueBucket(task({ due_at: at("2026-10-01T11:00:00") }), now), "overdue");
  assert.equal(dueBucket(task({ due_at: at("2026-10-01T23:59:00") }), now), "today");
  assert.equal(dueBucket(task({ due_at: at("2026-10-02T00:30:00") }), now), "tomorrow");
  assert.equal(dueBucket(task({ due_at: at("2026-10-08T10:00:00") }), now), "week");
  assert.equal(dueBucket(task({ due_at: at("2026-10-09T10:00:00") }), now), "later");
  assert.equal(dueBucket(task({ due_at: null }), now), "none");
  const rows = [task({ id: "a", project_id: null }), task({ id: "b", project_id: "p1" }), task({ id: "c", project_id: "p1" })];
  assert.deepEqual(
    groupTasks(rows, (t) => t.project_id ?? "").map((g) => [g.key, g.tasks.map((t) => t.id)]),
    [["p1", ["b", "c"]], ["", ["a"]]],
  );
  assert.equal(projectLabel({ title: "Site", client: "Ivanov" }), "Ivanov — Site");
  assert.equal(projectLabel({ title: "Site", client: null }), "Site");
});

test("бот пишет о задачах в рабочее время, как порция", () => {
  assert.equal(taskWindow(tk("2026-10-01T09:00:00")), true); // четверг
  assert.equal(taskWindow(tk("2026-10-01T18:59:00")), true);
  assert.equal(taskWindow(tk("2026-10-01T19:00:00")), false);
  assert.equal(taskWindow(tk("2026-10-01T08:59:00")), false);
  assert.equal(taskWindow(tk("2026-10-04T12:00:00")), false); // воскресенье
});

/* ── Браузер ──────────────────────────────────────────────────────────── */

test("новое для открытой панели: задача мне и шаг по моей задаче, но не мои нажатия", () => {
  const since = tk("2026-10-01T10:00:00");
  const later = tk("2026-10-01T10:01:00").toISOString();
  const rows = [
    task({ id: "a", updated_at: later }),
    task({ id: "b", updated_at: later, last_event: "taken", last_actor_id: "worker" }),
    task({ id: "c", updated_at: later, last_event: "done", last_actor_id: "worker", creator_id: "worker" }),
    task({ id: "d", updated_at: since.toISOString(), last_event: "moved", last_actor_id: "worker" }),
  ];
  assert.deepEqual(
    feedFor(rows, "worker", since).map((i) => [i.id, i.kind]),
    [["a", "assigned"]],
  );
  assert.deepEqual(
    feedFor(rows, "boss", since).map((i) => [i.id, i.kind]),
    [["b", "taken"]],
  );
  // Поставивший перенёс или отменил — звенит у исполнителя, не у него.
  const fromBoss = [
    task({ id: "m", updated_at: later, last_event: "moved", last_actor_id: "boss" }),
    task({ id: "x", updated_at: later, last_event: "cancelled", last_actor_id: "boss" }),
  ];
  assert.deepEqual(feedFor(fromBoss, "worker", since).map((i) => [i.id, i.kind]), [["m", "moved"], ["x", "cancelled"]]);
  assert.deepEqual(feedFor(fromBoss, "boss", since), []);
});

/* ── Telegram ─────────────────────────────────────────────────────────── */

test("кнопки бота: новая — «Взять», в работе — сделано / не сделано / перенос", () => {
  const flat = (rows: ReturnType<typeof taskRows>) =>
    rows.flat().map((b) => ("callback_data" in b ? b.callback_data : ""));
  assert.deepEqual(flat(taskRows(task())), [`tk:take:${task().id}`]);
  assert.deepEqual(flat(taskRows(task({ status: "in_work" }))), [
    `tk:done:${task().id}`,
    `tk:failed:${task().id}`,
    `tk:move:${task().id}`,
  ]);
  assert.deepEqual(flat(taskRows(task({ status: "done" }))), [`tk:noop:${task().id}`]);
  const moves = flat(moveRows(task().id));
  assert.deepEqual(moves.map((m) => m.split(":")[1]), ["1h", "tomorrow", "3d", "week", "own", "back"]);
  for (const data of [...moves, ...flat(taskRows(task({ status: "in_work" })))]) {
    assert.ok(Buffer.byteLength(data) <= 64, `${data}: длиннее 64 байт`);
  }
  assert.match(stepText("moved", "Ali", task(), tk("2026-10-06T18:00:00").toISOString()), /на <b>06\.10 18:00<\/b>/);
  assert.equal(looksLikeDue("05.10 15:00"), true);
  assert.equal(looksLikeDue("привет"), false);
});

test("бот разбирает кнопки задач и «свою дату» раньше клиентского разговора", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === TASK_CALLBACK/);
  const date = hook.indexOf("looksLikeDue(update.message.text)");
  assert.ok(date > 0 && date < hook.indexOf("await handleClient(update.message)"), "«своя дата» ушла бы в разговор с клиентом");
  assert.match(hook, /actOnTask\(task\.id, staff, kind, \{ ip: "", via: "telegram", newDue \}\)/);
});

test("свип напоминает о задачах; запись — поверх того, что видел нажавший", () => {
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runTaskSweep\(new Date\(\)\)/);
  const store = read("lib/admin/task-store.ts");
  assert.match(store, /\.eq\("updated_at", task\.updated_at\)/);
  assert.match(store, /if \(!taskWindow\(now\)\) return out;/);
  assert.match(store, /record\("task\.created"/);
  // Ответ панели — только своё: сотрудник из куки, а не из запроса.
  assert.match(read("app/admin/tasks/feed/route.ts"), /const staff = await currentStaff\(\);/);
  const sql = read("supabase/migrations/0071_staff_tasks.sql");
  assert.match(sql, /status in \('new', 'in_work', 'done', 'failed'\)/);
  assert.match(sql, /old_due timestamptz,\s+new_due timestamptz/);
  assert.match(read("supabase/migrations/0071_staff_tasks.down.sql"), /drop table if exists public\.staff_tasks;/);
});

/* ── Панель на трёх языках ────────────────────────────────────────────── */

test("блок «Задачи» рисуется на каждом языке, в узбекском и польском — без русского", () => {
  const now = tk("2026-10-05T19:00:00");
  const board = {
    offline: false,
    mine: [task({ status: "in_work" }), task({ id: "x", title: "Call Ali" })],
    given: [task({ id: "y", creator_id: "worker", assignee_id: "boss", status: "done", closed_at: now.toISOString() })],
    names: new Map([
      ["boss", "Egor"],
      ["worker", "Ali"],
    ]),
    projects: new Map([["p1", "Ivanov — Site"]]),
  };
  board.mine.push(task({ id: "z", due_at: null, project_id: "p1", status: "in_work" }));
  const projects = [{ id: "p1", label: "Ivanov — Site" }];
  const people = [
    { id: "worker", display_name: "Ali" },
    { id: "boss", display_name: "Egor" },
  ];
  const ru = renderToStaticMarkup(
    createElement(TasksView, { staff: { id: "worker" }, locale: "ru", board, people, projects, notice: "created", now }),
  );
  assert.match(ru, /Взять в работу/);
  assert.match(ru, /просрочена/);
  assert.match(ru, /Задача поставлена/);
  assert.match(ru, /href="\/admin\/help#leads-tasks"/);
  assert.match(ru, /без срока/);
  assert.match(ru, /проект: Ivanov — Site/);
  // Порядок: ближайший срок выше, задача без срока — последней.
  assert.ok(ru.indexOf("Prepare offer") < ru.indexOf("Call Ali"), "просроченная выше");
  const grouped = renderToStaticMarkup(
    createElement(TasksView, { staff: { id: "worker" }, locale: "ru", board, people, projects, now, group: "due" }),
  );
  assert.match(grouped, /Срок прошёл/);
  assert.match(grouped, /Без срока/);
  for (const locale of ["uz", "pl"] as const) {
    for (const group of ["none", "due", "project", "person"] as const) {
      const html = renderToStaticMarkup(
        createElement(TasksView, { staff: { id: "worker" }, locale, board, people, projects, notice: "moved", now, group }),
      );
      const text = html.replace(/<[^>]+>/g, " ");
      assert.ok(!/[а-яё]/i.test(text), `${locale} ${group}: русское в блоке: ${text.match(/\S*[а-яё]\S*/i)}`);
    }
    const card = renderToStaticMarkup(
      createElement(ProjectTasksView, {
        staff: { id: "boss" },
        locale,
        projectId: "p1",
        tasks: board.mine,
        names: board.names,
        now,
      }),
    );
    assert.ok(!/[а-яё]/i.test(card.replace(/<[^>]+>/g, " ")), `${locale}: русское в карточке проекта`);
    assert.match(card, /href="\/admin\?tp=p1#tasks"/);
  }
});

/* ── Нескольким сразу и телефон ───────────────────────────────────────── */

test("«Кому» — галочки: себя отмечено сразу, можно нескольких, каждому своя задача", async () => {
  const now = tk("2026-10-05T12:00:00");
  const board = { offline: false, mine: [], given: [], names: new Map<string, string>(), projects: new Map<string, string>() };
  const people = [
    { id: "worker", display_name: "Ali" },
    { id: "boss", display_name: "Egor" },
    { id: "head", display_name: "Timur" },
  ];
  const html = renderToStaticMarkup(
    createElement(TasksView, { staff: { id: "boss" }, locale: "ru", board, people, projects: [], now }),
  );
  const boxes = html.match(/<input type="checkbox"[^>]*name="assignee"[^>]*>/g) ?? [];
  assert.equal(boxes.length, 3, "по галочке на каждого");
  assert.match(boxes[0], /value="boss"/, "себя — первым");
  assert.match(boxes[0], /checked/, "себя — отмечено");
  assert.ok(!boxes.slice(1).some((b) => /checked/.test(b)), "остальные — нет");
  assert.match(html, /каждому придёт своя задача/);
  assert.doesNotMatch(html, /<select name="assignee"/, "выпадающий список на одного больше не нужен");

  const action = read("app/admin/tasks/actions.ts");
  assert.match(action, /assigneeIds: formData\.getAll\("assignee"\)\.map\(String\)/);
  assert.match(action, /deliverAll\(others\)/, "сообщение — каждому, кроме себя");

  // Без базы: пустой выбор и перебор отбиваются до записи.
  const { createTasks, ASSIGNEES_MAX } = await import("@/lib/admin/task-store");
  const actor = { id: "boss" } as Parameters<typeof createTasks>[1];
  const base = { title: "Call", body: "", due: null, projectId: null };
  assert.deepEqual(await createTasks({ ...base, assigneeIds: ["", " "] }, actor, ""), { ok: false, reason: "no_assignee" });
  const many = Array.from({ length: ASSIGNEES_MAX + 1 }, (_, i) => `p${i}`);
  assert.deepEqual(await createTasks({ ...base, assigneeIds: many }, actor, ""), { ok: false, reason: "assignee" });
});

test("на телефоне форма задач не шире экрана", () => {
  // 04.10: длинное название проекта растягивало выпадающий список, форма
  // вылезала за экран, и телефон уменьшал всю панель.
  const block = read("components/admin/tasks-block.tsx");
  assert.match(block, /const FIELD = "w-full min-w-0 /);
  assert.match(block, /<form action=\{createTaskAction\} className="mt-3 grid grid-cols-1 /);
  const css = read("app/globals.css");
  const phone = css.slice(css.indexOf("@media (width < 40rem)"));
  assert.match(phone, /\.admin-panel input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\) \{\n\s+min-width: 0;\n\s+max-width: 100%;/);
  assert.match(phone, /\.admin-panel label,\n\s+\.admin-panel fieldset \{\n\s+min-width: 0;/);
});
