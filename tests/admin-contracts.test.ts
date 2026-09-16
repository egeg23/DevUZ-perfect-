import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  acceptsScan,
  approvesContract,
  contractNumber,
  editable,
  preparesContract,
  problemsBeforeApproval,
  readyForApproval,
  returnable,
  sendable,
  signatureVisible,
  signedFileName,
  toContractInput,
} from "@/lib/admin/contracts";
import { MAX_SIGNATURE_BYTES } from "@/lib/admin/upload-limits";
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
  estimateItems: [
    { title: "Дизайн главной и внутренних", unit: "стр", qty: 5, price: 200, total: 1000 },
    { title: "Разработка и админка", unit: "", qty: 1, price: 1500, total: 1500 },
  ],
  deadlineText: "60 рабочих дней с даты поступления аванса",
};

/** Текст договора ровно так, как его собирает страница печати. */
const clauseText = () =>
  contractClauses(
    toContractInput({
      id: "c1", created_at: "", project_id: "p1", status: "draft",
      prepared_by: null, prepared_at: null, approved_by: null,
      approved_at: null, void_reason: null,
      estimate_path: null, estimate_name: null,
      // snake_case, потому что toContractInput читает поле базы. camelCase
      // из фикстуры `ok` сюда не долетает — первая версия теста на этом и
      // споткнулась: текст собирался с пустой сметой.
      estimate_items: ok.estimateItems,
      deadline_text: ok.deadlineText,
      sent_at: null, sent_by: null, notified_at: null,
      signed_path: null, signed_at: null, signed_by: null, ...ok,
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
  assert.match(mod, /bytes\.byteLength > MAX_SIGNATURE_BYTES/);
  // Само число живёт рядом с лимитами nginx и server action, иначе оно
  // оказывается недостижимым: tests/upload-limits.test.ts сверяет три слоя.
  assert.equal(MAX_SIGNATURE_BYTES, 2 * 1024 * 1024);
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

/* ── Маршрут договора целиком ───────────────────────────────────────────── */

test("подписывается то, что прислали, а не черновик со стола менеджера", () => {
  // Иначе владелец подтверждает документ, который никто не объявлял готовым
  // и который продолжает меняться.
  const store = read("lib/admin/contract-store.ts");
  const at = store.indexOf("export async function approveContract(");
  const end = store.indexOf("export async function", at + 10);
  const body = store.slice(at, end > 0 ? end : undefined);
  assert.match(body, /current\.status !== "pending"/);
  assert.match(body, /\.eq\("status", "pending"\)/, "гонка на уровне запроса не закрыта");
});

test("отправленный на подпись заморожен", () => {
  // Владельцу ушло уведомление со ссылкой. Документ, изменившийся между
  // уведомлением и нажатием кнопки, — это подпись под тем, чего он не читал.
  assert.equal(editable({ status: "pending" }), false);
  assert.equal(editable({ status: "draft" }), true);
  assert.equal(sendable({ ...ok, status: "draft" }), true);
  assert.equal(sendable({ ...ok, status: "pending" }), false);
});

test("без сметы и срока на подпись не уходит", () => {
  // Владелец просил полный вариант «со сметой и сроками» — неполный до него
  // доходить не должен.
  const noEstimate = problemsBeforeApproval({ ...ok, estimateItems: [] });
  assert.ok(noEstimate.some((p) => p.field === "estimate"), "смета не проверяется");

  const noDeadline = problemsBeforeApproval({ ...ok, deadlineText: "" });
  assert.ok(noDeadline.some((p) => p.field === "deadline"), "срок не проверяется");

  assert.equal(sendable({ ...ok, status: "draft", estimateItems: [] }), false);
});

test("статус меняется до уведомления, а не после", () => {
  // Обратный порядок оставил бы владельца с уведомлением на договор,
  // который остался черновиком и продолжает меняться под ним.
  const store = read("lib/admin/contract-store.ts");
  const at = store.indexOf("export async function sendForSignature(");
  const body = store.slice(at, at + 2600);
  const update = body.indexOf('status: "pending"');
  const notify = body.indexOf("sendMessage(");
  assert.ok(update > 0 && notify > 0, "не нашёл обе операции");
  assert.ok(update < notify, "уведомление уходит раньше записи статуса");
});

test("чат владельца берётся из базы, а не из переменной окружения", () => {
  // Переменная разъезжается с составом команды молча.
  const store = read("lib/admin/contract-store.ts");
  assert.match(store, /\.eq\("role", "admin"\)/);
  assert.ok(!store.includes("TELEGRAM_OWNER_CHAT_ID"), "чат владельца зашит в окружение");
});

test("скан грузится только к подтверждённому, и статус закрывает маршрут", () => {
  assert.equal(acceptsScan({ status: "approved" }), true);
  assert.equal(acceptsScan({ status: "draft" }), false);
  assert.equal(acceptsScan({ status: "pending" }), false);
  assert.equal(acceptsScan({ status: "signed" }), false);

  const store = read("lib/admin/contract-store.ts");
  const at = store.indexOf("export async function attachSignedScan(");
  assert.match(store.slice(at, at + 1400), /\.eq\("status", "approved"\)/);
});

test("вернуть на доработку может только владелец и только присланное", () => {
  assert.equal(returnable({ status: "pending" }), true);
  assert.equal(returnable({ status: "draft" }), false);
  assert.equal(returnable({ status: "approved" }), false);

  const store = read("lib/admin/contract-store.ts");
  const at = store.indexOf("export async function returnForRevision(");
  assert.match(store.slice(at, at + 600), /approvesContract\(staff\.role\)/);
});

test("сумма договора берётся из сметы, а не вводится вторым числом", () => {
  // Два числа, которые обязаны совпадать, не должны вводиться дважды.
  const store = read("lib/admin/contract-store.ts");
  assert.match(store, /patch\.amount_usd = estimateTotal\(items\)/);
});

test("смета и срок печатаются в самом договоре", () => {
  // Ссылаться на вложение, которого читатель не видит, значит получить спор
  // о его содержании — а о смете спорят чаще, чем о сроках.
  const text = clauseText();
  assert.match(text, /Дизайн главной и внутренних/, "позиции сметы не в тексте");
  assert.match(text, /60 рабочих дней/, "срок не в тексте");
  assert.match(text, /Приложение № 2/, "смета не названа приложением");
});

test("путь к файлу берётся из записи, а не из адреса", () => {
  // Пустить путь параметром значило бы отдать всё приватное хранилище любому
  // сотруднику: подставил ../signature/owner.png — и забрал подпись владельца.
  const route = read("app/admin/contracts/[id]/file/route.ts");
  assert.match(route, /contract\.signed_path : contract\.estimate_path/);
  assert.ok(!/searchParams\.get\("path"\)/.test(route), "путь приходит из адреса");
});

test("неушедшее уведомление не выдаётся за отправленное", () => {
  // Иначе менеджер думает, что отправил, а владелец не знает о договоре.
  const actions = read("app/admin/contracts/actions.ts");
  assert.match(actions, /sent=\$\{result\.notified \? "1" : "silent"\}/);
  const page = read("app/admin/contracts/[id]/page.tsx");
  assert.match(page, /уведомление в Telegram не ушло/);
});

test("смета и срок правятся только у черновика", () => {
  const page = read("app/admin/contracts/[id]/page.tsx");
  // Ищем защиту непосредственно перед формой, а не где-нибудь выше по файлу:
  // на странице есть другие проверки статуса, и lastIndexOf находил их —
  // тест проходил даже со снятой защитой.
  const at = page.indexOf("action={uploadEstimate}");
  assert.ok(at > 0, "формы сметы нет");
  const before = page.slice(Math.max(0, at - 400), at);
  assert.match(before, /contract\.status === "draft" \? \(/, "форма сметы не закрыта статусом");
});

test("имя скана не теряет букву, когда расширения нет", () => {
  assert.equal(
    signedFileName("1", "contracts/abc/signed-skan.pdf"),
    "dogovor-1-podpisan.pdf",
  );
  // Скан с телефона приходит и без расширения. Поиск точки по всему
  // пути отдавал тогда «dogovor-1-podpisann»: последнюю букву имени.
  assert.equal(
    signedFileName("1", "contracts/abc/signed-skan"),
    "dogovor-1-podpisan",
  );
  // Точка в папке, а не в имени, расширением не является.
  assert.equal(
    signedFileName("1", "contracts/a.b/signed-skan"),
    "dogovor-1-podpisan",
  );
});
