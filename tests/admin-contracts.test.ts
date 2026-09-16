import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  approvesContract,
  contractNumber,
  editable,
  preparesContract,
  problemsBeforeApproval,
  readyForApproval,
  signatureVisible,
  toContractInput,
} from "@/lib/admin/contracts";
import {
  ACCEPTANCE_WORKDAYS,
  ARBITRATION,
  PENALTY_CAP_PERCENT,
  amountInWords,
  contractClauses,
} from "@/content/contract";

/**
 * Договор.
 *
 * Проверяется не «собирается ли текст», а три вещи, каждая из которых
 * когда-нибудь будет стоить денег: кто вправе подписаться за владельца,
 * что нельзя подписать не глядя, и не пропали ли условия, ради которых
 * договор вообще писался.
 */

const ok = {
  number: "DU-2026-01",
  signed_date: "2026-09-16",
  client_name: 'ООО "Заказчик"',
  client_details: "г. Ташкент, ул. Примерная 1, ИНН 123456789, client@example.uz",
  subject: "корпоративный сайт на четырёх языках с админкой и формой заявки",
  amount_usd: 2500,
  stages: [
    { title: "Дизайн", percent: 30, workdays: 10 },
    { title: "Разработка", percent: 50, workdays: 20 },
    { title: "Запуск", percent: 20, workdays: 5 },
  ],
};

/** Текст договора ровно так, как его собирает страница печати. */
const clauseText = () =>
  contractClauses(
    toContractInput({
      id: "c1", created_at: "", project_id: "p1", status: "draft",
      prepared_by: null, prepared_at: null, approved_by: null,
      approved_at: null, void_reason: null, ...ok,
    }),
  )
    .flatMap((c) => c.items)
    .join(" ");

/* ── Кто что может ──────────────────────────────────────────────────────── */

test("подписаться за владельца не может никто, кроме него", () => {
  // Подтверждение — это момент, когда под документом появляется подпись
  // физического лица. Руководитель проектов ведёт работу, но не расписывается
  // за владельца, и менеджер тем более.
  assert.equal(approvesContract("admin"), true);
  assert.equal(approvesContract("head"), false);
  assert.equal(approvesContract("manager"), false);
});

test("готовить договор может вся команда — это работа менеджера", () => {
  assert.equal(preparesContract("admin"), true);
  assert.equal(preparesContract("head"), true);
  assert.equal(preparesContract("manager"), true);
});

test("подписи нет, пока владелец не подтвердил", () => {
  // Не «скрыта стилями»: скрытую картинку достают через «сохранить как».
  assert.equal(signatureVisible({ status: "draft" }), false);
  assert.equal(signatureVisible({ status: "void" }), false);
  assert.equal(signatureVisible({ status: "approved" }), true);
});

test("подтверждённый договор не правится", () => {
  assert.equal(editable({ status: "draft" }), true);
  assert.equal(editable({ status: "approved" }), false);
  assert.equal(editable({ status: "void" }), false);
});

/* ── Что нельзя подписать не глядя ──────────────────────────────────────── */

test("заполненный договор проходит", () => {
  assert.deepEqual(problemsBeforeApproval(ok), []);
  assert.equal(readyForApproval(ok), true);
});

test("несходящиеся доли этапов называются числом, а не «ошибкой»", () => {
  const bad = { ...ok, stages: [
    { title: "Дизайн", percent: 33, workdays: 10 },
    { title: "Разработка", percent: 33, workdays: 20 },
    { title: "Запуск", percent: 33, workdays: 5 },
  ] };
  const problems = problemsBeforeApproval(bad);
  assert.equal(problems.length, 1);
  assert.match(problems[0].text, /99% вместо 100%/);

  // А дроби, дающие сотню, проходить обязаны.
  const fractional = { ...ok, stages: [
    { title: "A", percent: 33.3, workdays: 5 },
    { title: "B", percent: 33.3, workdays: 5 },
    { title: "C", percent: 33.4, workdays: 5 },
  ] };
  assert.deepEqual(problemsBeforeApproval(fractional), []);
});

test("неустановленная сторона и расплывчатый предмет не проходят", () => {
  // Договор с неустановленным заказчиком оспаривается первым: некому
  // предъявлять претензию и некуда слать уведомления.
  const fields = problemsBeforeApproval({
    ...ok,
    client_name: "ООО",  // форма без имени — не сторона
    client_details: "—",
    subject: "сайт",
  }).map((p) => p.field);

  assert.ok(fields.includes("client_name"));
  assert.ok(fields.includes("client_details"));
  assert.ok(fields.includes("subject"));
});

test("все проблемы возвращаются разом, а не по одной", () => {
  // Иначе владелец выясняет их в пять заходов и перестаёт читать.
  const problems = problemsBeforeApproval({
    number: "", signed_date: "", client_name: "", client_details: "",
    subject: "", amount_usd: 0, stages: [],
  });
  assert.ok(problems.length >= 6, `вернулось ${problems.length}`);
  assert.equal(readyForApproval({
    number: "", signed_date: "", client_name: "", client_details: "",
    subject: "", amount_usd: 0, stages: [],
  }), false);
});

/* ── Условия, ради которых договор писался ──────────────────────────────── */

test("арбитражная оговорка на месте и уводит спор из суда", () => {
  // Главное условие всего договора: оно меняет не аргументы, а того, кто их
  // слушает. Пропадёт — останется районный суд, то есть ровно тот риск, от
  // которого договор и защищает.
  const text = clauseText();
  assert.match(text, /арбитраж/i);
  assert.ok(text.includes(ARBITRATION.name), "не назван арбитражный центр");
  assert.match(text, /окончательным и обязательным/);
  assert.match(text, /претензи/i, "нет досудебного порядка");
});

test("потолки ответственности не пропали", () => {
  const text = clauseText();
  // \w в JS не покрывает кириллицу — ищем подстрокой, а не классом символов.
  assert.ok(text.includes("упущенную выгоду"), "упущенная выгода не исключена");
  assert.match(text, new RegExp(`не более ${PENALTY_CAP_PERCENT}%`), "неустойка без потолка");
  assert.match(text, /ограничена суммой, фактически полученной/, "нет потолка ответственности");
});

test("приёмка не зависает на молчании заказчика", () => {
  const text = clauseText();
  assert.match(text, new RegExp(`${ACCEPTANCE_WORKDAYS} рабочих дн`), "нет срока приёмки");
  assert.match(text, /считаются принятыми в полном объёме/, "нет автоприёмки");
});

test("права на код переходят только после оплаты", () => {
  const text = clauseText();
  assert.match(text, /с момента поступления Исполнителю полной оплаты/);
});

test("сумма в договоре стоит и цифрой, и прописью", () => {
  // Цифру в бумажном экземпляре правят одним росчерком, пропись — нет.
  const text = clauseText();
  // toLocaleString ставит неразрывный пробел (U+00A0), а не обычный: сравнение
  // с «2 500», набранным с клавиатуры, молча не совпадёт.
  assert.ok(text.includes("2\u00a0500") || text.includes("2 500"), "нет суммы цифрой");
  assert.ok(text.includes("две тысячи пятьсот"), "нет суммы прописью");
});

/* ── Пропись ────────────────────────────────────────────────────────────── */

test("склонение тысяч не врёт на исключениях", () => {
  // Правило имеет исключение на 11–14, и «двадцать одна тысяч долларов»
  // в договоре стоит дороже, чем выглядит.
  assert.equal(amountInWords(1000), "одна тысяча");
  assert.equal(amountInWords(2000), "две тысячи");
  assert.equal(amountInWords(5000), "пять тысяч");
  assert.equal(amountInWords(11000), "одиннадцать тысяч");
  assert.equal(amountInWords(12000), "двенадцать тысяч");
  assert.equal(amountInWords(21000), "двадцать одна тысяча");
  assert.equal(amountInWords(22000), "двадцать две тысячи");
  assert.equal(amountInWords(25000), "двадцать пять тысяч");
});

test("миллионы не обрезаются молча", () => {
  // Цифра и пропись обязаны совпадать: спорить будут о прописи.
  assert.equal(amountInWords(1000000), "один миллион");
  assert.equal(amountInWords(2500000), "два миллиона пятьсот тысяч");
  assert.equal(amountInWords(0), "ноль");
});

test("номер договора сквозной по году и с ведущим нулём", () => {
  assert.equal(contractNumber(2026, 1), "DU-2026-01");
  assert.equal(contractNumber(2026, 17), "DU-2026-17");
  assert.equal(contractNumber(2027, 100), "DU-2027-100");
});

/* ── Подпись как файл, а не как картинка в вёрстке ──────────────────────── */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("подпись не отдаётся, пока договор не подтверждён", () => {
  // Это и есть обещание владельца самому себе. Спрятать картинку стилями
  // недостаточно: скрытое изображение достают через «сохранить как».
  const route = read("app/admin/contracts/[id]/signature/route.ts");
  assert.match(route, /signatureVisible\(contract\)/);
  assert.match(route, /if \(!staff\) return new Response\(null, \{ status: 404 \}\)/);
  // 404, а не 403: 403 сообщает, что файл существует. Проверяем код, а не
  // комментарий — в комментарии число как раз упомянуто, и поиск подстрокой
  // ловил его, то есть проверял не то.
  assert.ok(!/status:\s*403/.test(route), "маршрут отвечает 403 и выдаёт существование файла");
  assert.match(route, /no-store/, "подпись кэшируется");
});

test("страница печати не рисует подпись у черновика", () => {
  const page = read("app/admin/contracts/[id]/page.tsx");
  assert.match(page, /signed && hasSignatureFile \?/);
  // И честно говорит, если подтвердили, а файла нет: иначе владелец узнает
  // об этом от заказчика, получившего договор без подписи.
  assert.match(page, /файл подписи не загружен/);
});

test("подпись принимается только как настоящий PNG", () => {
  // Расширение переименует кто угодно, восемь байт заголовка — нет.
  const mod = read("lib/admin/signature.ts");
  assert.match(mod, /0x89, 0x50, 0x4e, 0x47/);
  assert.match(mod, /2 \* 1024 \* 1024/);
  assert.match(mod, /BUCKET = "private"/, "подпись лежит в публичном бакете");
});

test("хранилище договоров проверяет права само, не полагаясь на интерфейс", () => {
  // Кнопку можно не нарисовать, а действие всё равно вызвать.
  const store = read("lib/admin/contract-store.ts");
  assert.match(store, /if \(!approvesContract\(staff\.role\)\) return fail\("forbidden"\)/);
  assert.match(store, /if \(!preparesContract\(staff\.role\)\) return fail\("forbidden"\)/);
  // Повторное подтверждение отсекается и на уровне запроса.
  assert.match(store, /\.eq\("status", "draft"\)/);
  // Подтверждённый договор не правится.
  assert.match(store, /if \(!editable\(current\)\) return fail\("locked"\)/);
});

/* ── Фирменный бланк ────────────────────────────────────────────────────── */

test("документы студии идут на одном бланке", () => {
  // Два разных бланка у одной студии читаются как два разных отправителя,
  // и первым это замечает бухгалтер заказчика.
  const sheet = read("components/docs/letterhead.tsx");
  assert.match(sheet, /LogoMark/, "нет знака студии");
  assert.match(sheet, /DevUz Studio/);
  assert.match(sheet, /legal\.pinfl/, "нет ПИНФЛ в подвале");
  assert.match(sheet, /bank\.account/, "нет расчётного счёта");

  const contract = read("app/admin/contracts/[id]/page.tsx");
  assert.match(contract, /<Letterhead/, "договор не на бланке");
});

test("бланк напечатается на белом, а не чёрным прямоугольником", () => {
  // На сайте тёмная тема. Документ, унаследовавший её, уходит в принтер
  // залитым чёрным — и это обнаруживают возле принтера, а не в коде.
  const sheet = read("components/docs/letterhead.tsx");
  assert.match(sheet, /bg-white/);
  assert.match(sheet, /text-black/);
  assert.match(sheet, /max-w-\[210mm\]/, "ширина не под A4");
});

test("бланк без банковских реквизитов говорит об этом, а не молчит", () => {
  // Документ без счёта выглядит законченным, а оплатить по нему нельзя.
  const sheet = read("components/docs/letterhead.tsx");
  assert.match(sheet, /Банковские реквизиты не заданы/);
});
