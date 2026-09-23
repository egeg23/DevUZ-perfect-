import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Панель делает то, что говорит.
 *
 * Собрано, когда инструкцию переписывали по коду: в шести местах текст на
 * экране обещал одно, а код делал другое. Инструкция, описывающая кнопку,
 * которая отвечает «Недоступно», — хуже, чем её отсутствие.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("«Взять в работу» и «Отклонить» работают в личке, а не только в чате продаж", () => {
  // Карточка лида приходит каждому в личку, предложение очереди — только в
  // личку. Раньше кнопки под ними отвечали «Недоступно» самому адресату.
  const hook = read("app/api/telegram/webhook/route.ts");
  const handler = hook.slice(hook.indexOf("async function handleButton"));
  const gate = handler.indexOf("chatId !== undefined && !isSalesChat(chatId) && chatId !== query.from?.id");
  assert.ok(gate > 0, "кнопки лида снова только в чате продаж");
  assert.ok(gate < handler.indexOf("await takeLead("), "проверка места стоит после взятия");
  // Посторонний в личку к боту попасть может, а в сотрудники — нет.
  assert.ok(handler.indexOf("staffByTelegramId(query.from.id)") < handler.indexOf("await takeLead("));
});

test("«Связался сам» снимает письмо с очереди бота", () => {
  // Панель советует не ждать очереди и написать со своего аккаунта. Без
  // отметки бот отправил бы ту же копию — клиент получил бы два письма.
  const store = read("lib/admin/outreach-store.ts");
  assert.match(store, /const SELF_CONTACT_FROM = \["new", "contacting", "manual", "sending"\] as const;/);
  const mark = store.slice(store.indexOf("export async function markSelfContacted"));
  assert.match(mark.slice(0, 4000), /\.in\("status", \[\.\.\.SELF_CONTACT_FROM\]\)\s*\.select\("id"\);/);
  assert.match(mark.slice(0, 4000), /if \(!updated\?\.length\) return \{ ok: false/);

  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /row\.status === "new" \|\| row\.status === "contacting" \|\| row\.status === "sending" \? \(\s*<form\s*action=\{markSelfContactedAction\}/);
  assert.match(list, /нажмите «Связался сам» ниже — бот тогда свою копию не\s*отправит/);
});

test("«два в час» считает только то, что ушло с рабочего аккаунта", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  assert.match(queue, /const SENT_BY_ACCOUNT = "target_kind\.is\.null,target_kind\.neq\.manual";/);
  const hour = queue.slice(queue.indexOf("export async function sentLastHour"));
  assert.match(hour.slice(0, 900), /\.or\(SENT_BY_ACCOUNT\)/);
  const next = queue.slice(queue.indexOf("export async function nextQueued"));
  assert.match(next.slice(0, 900), /\.or\(SENT_BY_ACCOUNT\)/, "пауза между отправками считает ручные");
});

test("«не пишем» работает и на карточке «писать руками»", () => {
  const store = read("lib/admin/outreach-store.ts");
  const skip = store.slice(store.indexOf("export async function skipProspect"));
  assert.match(skip.slice(0, 900), /\.in\("status", \["new", "contacting", "manual"\]\);/);
});

test("бюджет в списке — как клиент говорит о деньгах, а не сумма", () => {
  // Модель ставит B1–B3 по отношению к деньгам (lib/qualify/prompt.ts), а
  // список показывал суммы: у формы и касаний с B3 по умолчанию стояло
  // «от 15 тыс.».
  const table = read("components/admin/lead-table.tsx");
  const labels = table.slice(table.indexOf("const BUDGET_LABEL"), table.indexOf("};", table.indexOf("const BUDGET_LABEL")));
  assert.doesNotMatch(labels, /тыс\./);
  assert.match(read("lib/qualify/prompt.ts"), /B1 — сумма или диапазон названы и утверждены/);
});

test("приглашение называет настоящий срок ссылки входа", () => {
  assert.doesNotMatch(read("lib/admin/staff-notice.ts"), /живёт пять минут/);
  assert.match(read("lib/admin/session.ts"), /15/);
});

test("карточка лида не говорит, что переписка в панели не показывается", () => {
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /Показать переписку/);
  assert.doesNotMatch(page, /Переписка с клиентом в панели не показывается/);
});
