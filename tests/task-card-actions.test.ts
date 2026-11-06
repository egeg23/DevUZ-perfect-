/**
 * Задачи: кнопки на странице задачи и «Получат: …» в форме.
 *
 * Владелец, 06.11.2026: «Менеджеры не могут редактировать задачи почему-то»
 * и «Салиха поставила задачу на Александра, а Александр ее не видит нигде.
 * Почему?». Бот и пуш ведут на /admin/tasks/<id>, а там была только история;
 * «себе» в «Кому» отмечено заранее, и отметивший коллегу получал и свою копию.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { savedTexts, SAVED_PREFIX } from "@/lib/scout/saved-outbox";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("страница задачи — те же кнопки, что в списке, и «Изменить» тому, кто поставил", () => {
  const page = read("app/admin/tasks/[id]/page.tsx");
  assert.match(page, /<TaskCardControls/);
  const block = read("components/admin/tasks-block.tsx");
  assert.match(block, /export function TaskCardControls/);
  assert.match(block, /back: `\/admin\/tasks\/\$\{task\.id\}`/, "после нажатия — обратно на задачу");
  assert.match(block, /<TaskActions task=\{task\} ctx=\{ctx\} \/>/);
  assert.match(block, /open && task\.creator_id === staff\.id \? <EditForm/, "правит тот, кто поставил (canEdit)");
  // Сервер пускает вернуться на страницу задачи, но не на чужой адрес.
  assert.match(read("app/admin/tasks/actions.ts"), /\^\\\/admin\\\/\(projects\|tasks\)\\\/\[0-9a-f-\]\{36\}\$/);
});

test("«Получат: …» над кнопкой — кому на самом деле уйдёт задача", () => {
  const form = read("components/admin/tasks-block.tsx");
  assert.match(form, /<PickedAssignees people=\{options\} selfId=\{staff\.id\}/);
  const picked = read("components/admin/picked-assignees.tsx");
  assert.match(picked, /input\[name="assignee"\]:checked/);
  assert.match(picked, /t\.selfToo/, "себе тоже уйдёт копия — предупреждение");
});

test("«Избранное» скаута: только тексты, по порядку, без пустых", () => {
  assert.equal(SAVED_PREFIX, "scout-saved:");
  assert.deepEqual(
    savedTexts({ items: [{ kind: "text", name: "1", text: " a " }, { kind: "photo", name: "2" }, { kind: "text", name: "3", text: "" }, { kind: "text", name: "4", text: "b" }] }),
    ["a", "b"],
  );
  assert.deepEqual(savedTexts(null), []);
  assert.deepEqual(savedTexts({ items: "x" }), []);
  const runner = read("scout/runner.mjs");
  assert.match(runner, /client\.sendMessage\("me", \{ message: text/, "пишет только себе");
  assert.match(runner, /startSavedOutbox\(client\)/);
});
