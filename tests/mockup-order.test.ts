/**
 * Заказ макета в задаче (lib/admin/mockup-order.ts).
 *
 * Владелец, 23.10.2026: «На меня менеджеры через нашу crm ставят задачу,
 * может сделать обязательное поле: МАКЕТ (да/нет)? Тогда мы кодом сможем
 * определять ответственного за макеты. Если нажимает — да, значит он
 * ответственный за работу по этому макету с клиентом». На план — «Делаем».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { tasksDict, taskNoticeDict } from "@/content/admin-panel/tasks";
import { mockupsDict } from "@/content/admin-panel/mockups";
import {
  MOCKUP_MAKER_ROLES,
  NO_ORDER,
  canLinkOrder,
  makesMockups,
  orderColumns,
  orderForSite,
  orderFromForm,
  orderProblem,
  protoHrefFor,
  siteHost,
  type MockupOrder,
} from "@/lib/admin/mockup-order";
import { mockupOwner } from "@/lib/admin/mockups";
import { mockupOwnerId } from "@/lib/admin/hq-my";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const LEAD = "11111111-1111-4111-8111-111111111111";
const PROSPECT = "22222222-2222-4222-8222-222222222222";

const form = (fields: Record<string, string>) => (name: string) => fields[name] ?? null;

test("вопрос обязателен, когда исполнитель собирает макеты — владелец", () => {
  assert.deepEqual([...MOCKUP_MAKER_ROLES], ["admin"]);
  assert.equal(makesMockups("admin"), true);
  assert.equal(makesMockups("head"), false);
  assert.equal(makesMockups("manager"), false);
  assert.equal(orderProblem(NO_ORDER, true), "mockup", "владельцу без ответа — не ставится");
  assert.equal(orderProblem(NO_ORDER, false), null, "другим — вопрос не нужен");
  assert.equal(orderProblem({ ...NO_ORDER, mockup: false }, true), null, "«нет» — ответ");
});

test("«да» — нужен клиент из поиска и сайт", () => {
  const yes = orderFromForm(form({ mockup: "yes", mockup_lead: LEAD, mockup_site: "https://www.Tirex.uz/ru" }));
  assert.deepEqual(yes, { mockup: true, leadId: LEAD, prospectId: null, site: "https://www.Tirex.uz/ru" });
  assert.equal(orderProblem(yes, true), null);
  assert.deepEqual(orderColumns(yes), { mockup: true, mockup_lead_id: LEAD, mockup_prospect_id: null, mockup_site: "tirex.uz" });

  assert.equal(orderProblem(orderFromForm(form({ mockup: "yes", mockup_site: "tirex.uz" })), true), "mockup_client");
  assert.equal(orderProblem(orderFromForm(form({ mockup: "yes", mockup_prospect: PROSPECT })), true), "mockup_site");
  assert.equal(orderProblem(orderFromForm(form({ mockup: "yes", mockup_prospect: PROSPECT, mockup_site: "не сайт" })), true), "mockup_site");
  // Чужое в полях — как пусто: id только UUID, ответ только yes/no.
  assert.equal(orderFromForm(form({ mockup: "yes", mockup_lead: "1 or 1=1" })).leadId, null);
  assert.equal(orderFromForm(form({ mockup: "maybe" })).mockup, null);
  // «Нет» — только ответ, без клиента и сайта.
  assert.deepEqual(orderColumns(orderFromForm(form({ mockup: "no", mockup_lead: LEAD }))), { mockup: false });
});

test("сайт — хост без www; заказ находится по сайту макета", () => {
  assert.equal(siteHost("https://www.Tirex.uz/ru?x=1"), "tirex.uz");
  assert.equal(siteHost("tirex.uz"), "tirex.uz");
  assert.equal(siteHost("просто текст"), null);
  assert.equal(siteHost(""), null);
  const order = (taskId: string, site: string | null, ref: string | null = null): MockupOrder => ({
    taskId, title: "Макет", creatorId: "m", assigneeId: "egor", leadId: null, prospectId: null, site, ref, open: true,
  });
  const orders = [order("old", "tirex.uz"), order("linked", "soffice.uz", "p:x"), order("new", "tirex.uz")];
  assert.equal(orderForSite(orders, "https://www.tirex.uz/")?.taskId, "old", "самый старый — его ждут дольше");
  assert.equal(orderForSite(orders, "soffice.uz"), null, "привязанный не предлагается");
  assert.equal(orderForSite(orders, null), null);
  assert.equal(protoHrefFor({ taskId: "t1", site: "tirex.uz", prospectId: PROSPECT }), `/admin/proto?url=tirex.uz&prospect=${PROSPECT}&order=t1#build`);
});

test("ответственный: назначенный руками, потом заказавший, потом лид, касание, кто собрал", () => {
  const names = new Map([["set", "Руками"], ["ord", "Заказал"], ["lead", "Лид"], ["made", "Собрал"]]);
  assert.equal(mockupOwner({ set: "set", order: "ord", lead: "lead", touch: null, made: "made" }, names)?.source, "set");
  assert.deepEqual(mockupOwner({ set: null, order: "ord", lead: "lead", touch: null, made: "made" }, names), { id: "ord", name: "Заказал", source: "order" });
  assert.equal(mockupOwner({ set: null, order: null, lead: "lead", touch: null, made: "made" }, names)?.source, "lead");
  assert.equal(mockupOwnerId({ set: null, order: "ord", lead: "lead", touch: null, made: null }, new Set(["ord", "lead"])), "ord");
  assert.equal(mockupOwnerId({ set: null, order: "gone", lead: "lead", touch: null, made: null }, new Set(["lead"])), "lead", "ушедший — следующему");
  assert.equal(mockupsDict.ownerFrom_order.ru, "по заказу");
});

test("привязать: исполнитель задачи, руководитель, владелец; закрывает только исполнитель", () => {
  const order = { assigneeId: "egor" };
  assert.equal(canLinkOrder(order, { id: "egor", role: "admin" }), true);
  assert.equal(canLinkOrder(order, { id: "alex", role: "head" }), true);
  assert.equal(canLinkOrder(order, { id: "m1", role: "manager" }), false);
  assert.equal(canLinkOrder({ assigneeId: "m1" }, { id: "m1", role: "manager" }), true);
  const store = read("lib/admin/mockup-order-store.ts");
  const link = store.slice(store.indexOf("export async function linkMockupOrder("));
  assert.ok(link.indexOf("canLinkOrder(order, staff)") < link.indexOf('.update({ mockup_ref'), "права — до записи");
  assert.match(link, /\.is\("mockup_ref", null\)/, "поверх пустого: второй не перепишет");
  assert.match(link, /record\("mockup\.order"/, "в журнал");
  assert.match(link, /order\.assigneeId === staff\.id\) \{\n\s+const acted = await actOnTask\(order\.taskId, staff, "done"/, "закрывает «Сделано» тем же путём, что кнопка");
});

test("сервер не пропускает задачу владельцу без ответа — и при нескольких исполнителях до первой записи", () => {
  const store = read("lib/admin/task-store.ts");
  const one = store.slice(store.indexOf("export async function createTask("), store.indexOf("/** Клиент заказа есть в базе"));
  assert.match(one, /orderProblem\(order, makesMockups\(assignee\.role\)\)/);
  assert.match(one, /orderClientExists\(order\)/, "клиент — настоящий лид или касание");
  assert.ok(one.indexOf("orderProblem(") < one.indexOf('.from("staff_tasks")'));
  const many = store.slice(store.indexOf("export async function createTasks("));
  assert.ok(many.indexOf("orderProblem(") < many.indexOf("createTask({"), "до первой записи");
  for (const file of ["app/admin/tasks/actions.ts", "app/admin/hq/actions.ts"]) assert.match(read(file), /order: orderFromForm\(/, file);
  assert.equal(taskNoticeDict.mockup.ru.includes("«Заказ макета»"), true);
  assert.equal(tasksDict.mockupQ.ru, "Заказ макета");
});

test("форма: поле в «Задачах» и в быстрой задаче, клиент — тем же поиском, что Ctrl+K", () => {
  const fields = read("components/admin/mockup-order-fields.tsx");
  assert.match(fields, /required=\{required\}/, "обязательность — от отмеченных «Кому»");
  assert.match(fields, /useFindHits\(/);
  assert.match(fields, /name=\{picked\.kind === "lead" \? "mockup_lead" : "mockup_prospect"\}/);
  assert.match(read("components/admin/tasks-block.tsx"), /<MockupOrderFields makerIds=\{makerIds\} locale=\{locale\} \/>/);
  assert.match(read("components/admin/hq-task.tsx"), /<MockupOrderFields key=\{done\} makerIds=\{makerIds\} \/>/);
  // Прототип по заказу привязывается сам; черновик — без закрытия задачи.
  assert.match(read("app/admin/proto/actions.ts"), /linkMockupOrder\(order, `p:\$\{saved\.proto\.id\}`, staff, await requestIp\(\), \{ close: !saved\.problems\.length \}\)/);
  assert.match(read("app/admin/mockups/actions.ts"), /linkMockupOrder\(/);
  assert.match(read("supabase/migrations/0173_task_mockup_order.sql"), /add column if not exists mockup_ref text/);
});
