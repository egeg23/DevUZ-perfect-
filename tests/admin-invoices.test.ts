import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  BLOCK_TEXT,
  canIssue,
  dueDate,
  invoiceNumber,
  overdue,
  stageAmountUsd,
} from "@/lib/admin/invoices";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const THIRDS = [
  { title: "Дизайн", percent: 33.3, workdays: 10 },
  { title: "Разработка", percent: 33.3, workdays: 20 },
  { title: "Запуск", percent: 33.4, workdays: 5 },
];

const HALVES = [
  { title: "Аванс", percent: 30, workdays: 10 },
  { title: "Остаток", percent: 70, workdays: 20 },
];

test("сумма счетов сходится с суммой договора до доллара", () => {
  // Доли 33,3 + 33,3 + 33,4 после округления каждой дают не ту сумму, и
  // заказчик заплатит на доллар меньше или больше, чем подписал.
  for (const amount of [2500, 1999, 3333, 10_000, 777]) {
    const total = THIRDS.map((_, i) => stageAmountUsd(amount, THIRDS, i)).reduce((a, b) => a + b, 0);
    assert.equal(total, amount, `на сумме ${amount} счета не сошлись с договором`);
  }
});

test("последний этап добирает остаток, а не считает свою долю", () => {
  assert.deepEqual(
    THIRDS.map((_, i) => stageAmountUsd(2500, THIRDS, i)),
    [833, 833, 834],
  );
  assert.deepEqual(
    HALVES.map((_, i) => stageAmountUsd(2500, HALVES, i)),
    [750, 1750],
  );
});

test("несуществующий этап не превращается в счёт", () => {
  assert.equal(stageAmountUsd(2500, THIRDS, -1), 0);
  assert.equal(stageAmountUsd(2500, THIRDS, 3), 0);
});

test("номер счёта читается вместе с номером договора", () => {
  assert.equal(invoiceNumber("DU-2026-01", 0), "DU-2026-01-1");
  assert.equal(invoiceNumber("DU-2026-01", 2), "DU-2026-01-3");
});

test("срок оплаты считается от даты выставления", () => {
  assert.equal(dueDate("2026-09-17", 14), "2026-10-01");
  // Через границу месяца и года — там, где ручной расчёт и ошибается.
  assert.equal(dueDate("2026-12-28", 5), "2027-01-02");
  assert.equal(dueDate("2026-02-27", 2), "2026-03-01");
});

test("просроченным счёт становится на следующий день после срока", () => {
  assert.equal(overdue({ due_at: "2026-10-01", paid_at: null }, "2026-10-01"), false);
  assert.equal(overdue({ due_at: "2026-10-01", paid_at: null }, "2026-10-02"), true);
  // Оплаченный не просрочен никогда, даже если заплатили позже срока.
  assert.equal(overdue({ due_at: "2026-10-01", paid_at: "2026-10-05T10:00:00Z" }, "2026-11-01"), false);
});

test("счёт не выставляется до подписи, дважды и без реквизитов", () => {
  const base = { stages: THIRDS, stageIndex: 0, issuedStages: [] as number[], hasBank: true };

  assert.equal(canIssue({ ...base, status: "approved" }), "ok");
  assert.equal(canIssue({ ...base, status: "signed" }), "ok");

  // До подписи платить не за что: договор ещё могут вернуть на доработку.
  assert.equal(canIssue({ ...base, status: "draft" }), "not_approved");
  assert.equal(canIssue({ ...base, status: "pending" }), "not_approved");
  assert.equal(canIssue({ ...base, status: "void" }), "not_approved");

  // Два счёта на один этап — это два платежа за одну работу.
  assert.equal(canIssue({ ...base, status: "approved", issuedStages: [0] }), "already");
  assert.equal(canIssue({ ...base, status: "approved", issuedStages: [1] }), "ok");

  assert.equal(canIssue({ ...base, status: "approved", stageIndex: 9 }), "no_such_stage");
  assert.equal(canIssue({ ...base, status: "approved", hasBank: false }), "no_bank");

  // У каждого отказа есть объяснение словами: менеджер видит причину, а не
  // погасшую кнопку.
  for (const key of Object.keys(BLOCK_TEXT)) {
    if (key !== "ok") assert.ok(BLOCK_TEXT[key as keyof typeof BLOCK_TEXT].length > 20, key);
  }
});

test("счёт рождается вместе с подписью, а не отдельной кнопкой", () => {
  // Отдельный шаг «а теперь выставьте счёт» — ровно тот, который забывают,
  // а потом выясняют, почему заказчик не платит.
  const actions = read("app/admin/contracts/actions.ts");
  const approve = actions.indexOf("await approveContract(id, staff)");
  const issue = actions.indexOf("await issueInvoice(id, 0, staff)");
  assert.ok(approve > 0 && issue > approve, "счёт не выставляется при подтверждении");
});

test("два счёта на один этап отсекаются базой, а не только кодом", () => {
  // Проверка в коде видит состояние на момент чтения; между чтением и
  // записью успевает пройти второе нажатие.
  const migration = read("supabase/migrations/0032_contract_invoices.sql");
  assert.match(migration, /create unique index[\s\S]{0,120}contract_invoices \(contract_id, stage_index\)/);
});

test("ссылка заказчика хранится хешем, а не сама", () => {
  const store = read("lib/admin/invoice-store.ts");
  assert.match(store, /access_hash: hashAccessToken\(token\)/);
  // Самого токена в базе нет — значит показать его второй раз нельзя, и
  // это должно быть сказано менеджеру, а не выясняться.
  assert.doesNotMatch(store, /access_token: token|raw_token/);
  const page = read("app/admin/contracts/[id]/page.tsx");
  assert.match(page, /второй раз эта ссылка не покажется/);
});

test("счёт собран на том же бланке, что и договор", () => {
  // Два разных бланка у одной студии читаются как два разных отправителя.
  const invoice = read("components/docs/invoice-document.tsx");
  assert.match(invoice, /<Letterhead/);
  // Оплата в сумах по курсу дня — то же правило, что и в счёте магазина.
  assert.match(invoice, /по курсу ЦБ РУз на дату платежа/);
  // Счёт чужого договора не открывается ни по одному из двух адресов: ни в
  // панели, ни по ссылке заказчика. Номер счёта в адресе — это ввод, а не
  // доказательство принадлежности.
  for (const page of [
    "app/admin/contracts/[id]/invoice/[invoice]/page.tsx",
    "app/[locale]/contract/[token]/invoice/[invoice]/page.tsx",
  ]) {
    assert.match(read(page), /invoice\.contract_id !== contract\.id/, page);
  }
});

// Ссылка заказчика. Доступ — неугадываемая ссылка; всё, что за ней видно,
// должно быть тем же, что видит менеджер, и ничем сверх того.

test("по ссылке заказчика открывается только подписанный договор", () => {
  // Черновик и отменённый — это то, что ещё обсуждают внутри студии.
  for (const page of [
    "app/[locale]/contract/[token]/page.tsx",
    "app/[locale]/contract/[token]/invoice/[invoice]/page.tsx",
  ]) {
    const code = read(page);
    assert.match(code, /contract\.status !== "approved" && contract\.status !== "signed"/, page);
    assert.match(code, /looksLikeAccessToken\(token\)/, `${page}: мусор из адреса идёт в базу`);
    // Страница с реквизитами сторон и суммами в поиске не нужна.
    assert.match(code, /robots: \{ index: false/, `${page}: страница индексируется`);
  }
});

test("подпись заказчику отдаётся по токену и только у подтверждённого договора", () => {
  const route = read("app/api/contract/[token]/signature/route.ts");
  // Порядок тот же, что в маршруте панели: сначала «кто спрашивает», потом
  // «есть ли что показывать». Оба отказа — 404, а не 403: 403 сообщает, что
  // файл существует, и это уже подсказка.
  assert.match(route, /!contract \|\| !signatureVisible\(contract\)/);
  assert.match(route, /status: 404/);
  assert.doesNotMatch(route, /status: 403/);
  assert.match(route, /"Cache-Control": "no-store/);
});

test("текст договора один на панель и на ссылку заказчика", () => {
  // Две вёрстки одного документа расходятся на первой же правке, и
  // расхождение обнаруживает та сторона, которой оно выгодно.
  for (const page of [
    "app/admin/contracts/[id]/page.tsx",
    "app/[locale]/contract/[token]/page.tsx",
  ]) {
    assert.match(read(page), /<ContractDocument/, page);
  }
  for (const page of [
    "app/admin/contracts/[id]/invoice/[invoice]/page.tsx",
    "app/[locale]/contract/[token]/invoice/[invoice]/page.tsx",
  ]) {
    assert.match(read(page), /<InvoiceDocument/, page);
  }
  // Сам документ про доступ ничего не знает: адрес подписи приходит ему
  // параметром. Знай он про роли — проверка доступа оказалась бы в вёрстке.
  const doc = read("components/docs/contract-document.tsx");
  assert.doesNotMatch(doc, /requireStaff|currentStaff|access_hash/);
});
