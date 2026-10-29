/**
 * Договор проще: «Состав из макета», «Вставить реквизиты», без двойных
 * черновиков, «чего не хватает» до нажатия.
 *
 * Владелец, 29.10.2026: «У нас сложный раздел проектов, очень много всего
 * заполнять надо. Давай проще сделаем как-то, чтобы сразу выбрали какие допы
 * взяли из макета, сделай это скриптом, а не нейронкой».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import plansJson from "@/content/mockup-plans.json" with { type: "json" };
import { compose, deadlineOf, extrasFrom, planById, planChoices, starredIds } from "@/lib/admin/mockup-plan";
import { detailsOf, missingOf, parseRequisites } from "@/lib/admin/requisites-parse";
import { collectPlans } from "../scripts/mockup-plans.mjs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/* ── Генератор: plan.mjs → content/mockup-plans.json ───────────────────── */

test("mockup-plans.json совпадает с plan.mjs — правка цены без перезапуска скрипта не пройдёт", async () => {
  const { plans } = await collectPlans();
  assert.deepEqual(plansJson, plans, "запустите: node scripts/mockup-plans.mjs");
});

test("генератор не придумывает цен: другая форма плана и не доллары — пропущены", async () => {
  const { plans, skipped } = (await collectPlans()) as { plans: { id: string }[]; skipped: string[] };
  const ids = plans.map((p) => p.id);
  for (const id of ["medikor", "syanie", "dilrabo", "inapp", "shox-hospital"]) {
    assert.ok(!ids.includes(id), `${id} не должен попасть в смету`);
    assert.ok(skipped.some((line) => line.startsWith(`${id}:`)), `${id} — строка в выводе`);
  }
  assert.ok(ids.includes("chechfarm"));
});

test("основа — цена по акции, если есть; допы — цена и ★ из плана", () => {
  const plan = planById("chechfarm")!;
  assert.equal(plan.base.price, 1000);
  assert.deepEqual(plan.base.weeks, [3, 5]);
  assert.equal(plan.base.title, "Корпоративный сайт CZECHFARM");
  const panel = plan.addons.find((a) => a.id === "panel")!;
  assert.equal(panel.price, 400);
  assert.equal(panel.star, true);
  assert.deepEqual(starredIds(plan), ["launch", "scene", "chain", "panel"]);
  // Без `promo` — обычная цена (aipply: 1 300 $).
  assert.equal(planById("aipply")!.base.price, 1300);
});

/* ── Состав → смета, сумма, предмет, срок ──────────────────────────────── */

test("состав: строки сметы, сумма, предмет и срок — кодом", () => {
  const plan = planById("chechfarm")!;
  const extras = extrasFrom(["Перенос старых новостей", "Хостинг на год", "", "лишняя"], ["0", "120", "50", "10"]);
  const comp = compose(plan, [...starredIds(plan), "нет-такого"], extras);

  assert.equal(comp.items.length, 1 + 4 + 2);
  assert.equal(comp.amountUsd, 1000 + 160 + 240 + 140 + 400 + 0 + 120);
  assert.match(comp.items[0].title, /^Корпоративный сайт CZECHFARM: Семь страниц/);
  // Цена 0 — подарок, строка остаётся.
  const gift = comp.items.find((i) => i.title.startsWith("Перенос старых новостей"))!;
  assert.equal(gift.total, 0);
  assert.match(gift.title, /в подарок/);
  assert.match(comp.subject, /^Корпоративный сайт CZECHFARM с дополнительными функциями: /);
  assert.match(comp.subject, /Сцена на первом экране/);
  assert.ok(comp.subject.length >= 20);
  assert.equal(comp.deadline, "до 5 недель с даты аванса");
});

test("своих строк — не больше трёх, отрицательная цена — не строка", () => {
  assert.equal(extrasFrom(["a", "b", "c", "d"], ["1", "2", "3", "4"]).length, 3);
  assert.deepEqual(extrasFrom(["a", "b"], ["-5", "1 000"]), [{ title: "b", price: 1000 }]);
  assert.equal(deadlineOf(null), null);
  assert.equal(deadlineOf([1]), "до 1 недели с даты аванса");
});

test("в браузер — без описаний допов", () => {
  const choice = planChoices().find((p) => p.id === "chechfarm")!;
  assert.equal(choice.weeks, 5);
  assert.ok(!("text" in choice.addons[0]));
});

/* ── Реквизиты одним текстом (пример выдуманный) ───────────────────────── */

const SAMPLE = `1. ООО «Ромашка Фарм Трейд»
Адрес: г. Ташкент, Мирзо-Улугбекский район, ул. Примерная, 7
р\\с 2020 8000 1234 5678 9012
в «Тестбанк» Юнусабадский ф.
МФО 00999 ОКЭД 46460
ИНН 301234567
Код плательщика НДС 326010012345
2. Директор Иванов Пётр Сергеевич`;

test("реквизиты раскладываются по полям регулярными выражениями", () => {
  const r = parseRequisites(SAMPLE);
  assert.equal(r.name, "ООО «Ромашка Фарм Трейд»");
  assert.equal(r.address, "г. Ташкент, Мирзо-Улугбекский район, ул. Примерная, 7");
  assert.equal(r.account, "20208000123456789012");
  assert.equal(r.bank, "«Тестбанк» Юнусабадский ф.");
  assert.equal(r.mfo, "00999");
  assert.equal(r.oked, "46460");
  assert.equal(r.taxId, "301234567");
  assert.equal(r.vat, "326010012345");
  assert.equal(r.director, "Иванов Пётр Сергеевич");
  assert.deepEqual(missingOf(r), []);
  assert.match(detailsOf(r), /^Адрес: г\. Ташкент.*Код плательщика НДС: 326010012345; ОКЭД: 46460; Директор: Иванов/);
});

test("чего нет — пусто, ничего не угадывается", () => {
  const r = parseRequisites("ИП Каримов А.\nИНН 12345\nр/с 2020 8000 1234\nПИНФЛ 31234567890123");
  assert.equal(r.name, "ИП Каримов А.");
  // ИНН не 9 цифр — не ИНН; ПИНФЛ — 14, берётся.
  assert.equal(r.taxId, "31234567890123");
  // Счёт не 20 цифр — пусто.
  assert.equal(r.account, "");
  assert.equal(r.mfo, "");
  assert.equal(r.bank, "");
  assert.deepEqual(missingOf(r), ["address", "account", "mfo", "bank"]);
});

test("пустое поле формы сервер заполняет тем же разбором, вписанное — не трогает", () => {
  const actions = read("app/admin/contracts/actions.ts");
  assert.match(actions, /field\("client_account"\) \|\| parsed\.account/);
  assert.match(actions, /parseRequisites\(String\(formData\.get\("requisites"\)/);
});

/* ── Второй договор не создаётся ────────────────────────────────────────── */

test("у проекта с договором второй не создаётся: проверка до вставки и после", () => {
  const store = read("lib/admin/contract-store.ts");
  const create = store.slice(store.indexOf("export async function createContract"), store.indexOf("export async function activeContractOf"));
  const before = create.indexOf("await activeContractOf(fields.projectId)");
  const insert = create.indexOf(".insert(");
  assert.ok(before > 0 && before < insert, "проверка — до вставки");
  assert.match(create.slice(0, insert), /if \(existing\) return \{ ok: true, id: existing, existed: true \}/);
  // Два нажатия одновременно: свой лишний черновик удаляется, открывается ранний.
  const after = create.slice(insert);
  assert.match(after, /activeContractOf\(fields\.projectId\)/);
  assert.match(after, /\.delete\(\)\.eq\("id", id\)\.eq\("status", "draft"\)/);
  // Действующий — не отменённый, самый ранний.
  assert.match(store, /\.neq\("status", "void"\)\s*\.order\("created_at", \{ ascending: true \}\)/);

  const actions = read("app/admin/contracts/actions.ts");
  assert.match(actions, /result\.existed \? "\?existed=1" : ""/);
});

test("кнопки договора гаснут на время запроса, «чего не хватает» видно до нажатия", () => {
  const project = read("app/admin/projects/[id]/page.tsx");
  const form = project.slice(project.indexOf("<form action={prepareContract}"));
  assert.match(form.slice(0, form.indexOf("</form>")), /<SubmitButton pendingLabel=\{tc\.preparing\}/);
  assert.match(project, /problemsBeforeApproval\(\{/);
  assert.match(project, /signNow \? tc\.openSign : tc\.open/);

  const draft = read("app/admin/contracts/[id]/page.tsx");
  const send = draft.slice(draft.indexOf("<form action={sendToOwner}"));
  assert.match(send.slice(0, send.indexOf("</form>")), /<SubmitButton pendingLabel=\{tc\.sending\}/);
  assert.match(draft, /problemsBeforeApproval\(\{/);
  assert.match(draft, /<form action=\{composeContract\}/);
});

test("модели нет ни в составе, ни в разборе реквизитов", () => {
  for (const path of ["lib/admin/mockup-plan.ts", "lib/admin/requisites-parse.ts", "scripts/mockup-plans.mjs"]) {
    assert.doesNotMatch(read(path), /anthropic|callModel|ask\(|MODEL/, path);
  }
});

test("форма выбора не тянет весь состав макетов в браузер", () => {
  const client = read("components/admin/contract-compose.tsx");
  assert.doesNotMatch(client, /from "@\/lib\/admin\/mockup-plan"|mockup-plans\.json/);
});
