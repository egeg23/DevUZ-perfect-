import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { leadKindOf } from "@/lib/admin/lead-kinds";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { CB, handle, type Deps, type Flow, type Row, type Who } from "@/lib/claudery/flow";
import { DEFAULT_SETUP, PAY_PURPOSE, scenarioOf, setupFromForm, setupProblems, type Setup } from "@/lib/claudery/scenario";

const read = (p: string) => readFileSync(p, "utf8");
const who: Who = { chatId: 7, username: "client", name: "Иван" };

function fake(state: { pay?: "paid" | "pending" | "failed"; invoice?: boolean; setup?: Setup; before?: boolean } = {}) {
  const flows = new Map<number, Flow>();
  const sent: { text: string; rows?: Row[] }[] = [];
  const leads: number[] = [];
  const invoices: { amount: number; full: number; discount: number }[] = [];
  const deps: Deps = {
    setup: async () => state.setup ?? DEFAULT_SETUP,
    flowOf: async (id) => (flows.has(id) ? structuredClone(flows.get(id)!) : null),
    saveFlow: async (id, f) => void flows.set(id, structuredClone(f)),
    send: async (_id, text, rows) => void sent.push({ text, rows }),
    answer: async () => {},
    lead: async (_w, f, amount) => {
      if (!f.requestNo) leads.push(amount);
      return { leadId: "L1", requestNo: f.requestNo ?? "DZ-1" };
    },
    order: async (_w, _f, price) => {
      invoices.push(price);
      return state.invoice === false ? null : { token: "t1", url: "https://devuz.studio/claudery/z/t1" };
    },
    paidBefore: async () => state.before ?? false,
  };
  return { deps, flows, sent, leads, invoices };
}

const btn = (data: string) => ({ type: "button" as const, data, callbackId: "c" });

test("настройки по умолчанию проходят проверку, путь начинается одной кнопкой", () => {
  assert.deepEqual(setupProblems(DEFAULT_SETUP), []);
  const start = scenarioOf(DEFAULT_SETUP).steps[0];
  assert.equal(start.buttons.length, 1);
  assert.equal(PAY_PURPOSE, "Claudery: подписка на нейросеть");
  // Только по-русски (владелец, 17.11.2026: «бот только на рф аудиторию»).
  assert.doesNotMatch(JSON.stringify(DEFAULT_SETUP) + read("lib/claudery/flow.ts"), /uz|O‘zbek|Assalomu/);
});

test("кнопка → что случилось → ссылка на заявку: в боте ни оплаты, ни цены", async () => {
  const f = fake();
  await handle(who, { type: "text", text: "/start" }, f.deps, "https://x/offer");
  await handle(who, btn(CB.step + "ask"), f.deps, "https://x/offer");
  await handle(who, { type: "text", text: "ChatGPT не открывается" }, f.deps, "https://x/offer");
  assert.deepEqual(f.leads, [5000]);
  assert.deepEqual(f.invoices, [{ amount: 5000, full: 5000, discount: 30 }]);
  const last = f.sent.at(-1)!;
  const buttons = last.rows!.flat();
  assert.ok(buttons.some((b) => b.url === "https://devuz.studio/claudery/z/t1"));
  // Telegram блокирует ботов с оплатой мимо Stars: ни слова об оплате и цене.
  const shown = [last.text, ...buttons.map((b) => b.text)].join(" ");
  assert.doesNotMatch(shown, /оплат|плат[её]ж|₽|руб|счёт|счет/i);
  assert.ok(!buttons.some((b) => /platega/i.test(b.url ?? "")));
  assert.equal(f.flows.get(7)?.problem, "ChatGPT не открывается");

  // Слова клиента и прежняя кнопка «Я оплатил» ничего не меняют.
  await handle(who, { type: "text", text: "я оплатил" }, f.deps, "https://x/offer");
  await handle(who, btn(CB.check), f.deps, "https://x/offer");
  assert.equal(f.flows.get(7)?.step, "pay");
  assert.equal(f.invoices.length, 1, "вторая заявка не заводится");
});

test("оплата на сайте по токену заявки: Platega подтвердила — бот сам пишет «спасибо»", () => {
  assert.match(DEFAULT_SETUP.paid, /Спасибо/);
  assert.doesNotMatch(DEFAULT_SETUP.pay + DEFAULT_SETUP.greet + DEFAULT_SETUP.ask, /оплат|₽/i);
  const store = read("lib/claudery/store.ts");
  assert.match(store, /ORDER_PATH = "\/claudery\/z"/);
  assert.match(store, /randomBytes\(16\)/);
  assert.match(store, /async function settle/);
  assert.match(read("app/claudery/z/[token]/page.tsx"), /orderView\(token\)/);
  assert.match(read("app/claudery/z/[token]/pay/route.ts"), /orderPayUrl\(token, /);
});

test("страница заявки не завелась — заявка всё равно лид, клиенту честно", async () => {
  const f = fake({ invoice: false });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "photo", fileId: "F", caption: "помогите" }, f.deps, "o");
  assert.deepEqual(f.leads, [5000]);
  assert.equal(f.flows.get(7)?.photo, "F");
  assert.match(f.sent.at(-1)!.text, /Заказ мы записали/);
});

test("своя кнопка отвечает текстом и возвращает назад", async () => {
  const setup: Setup = { ...DEFAULT_SETUP, extras: [{ label: "Гарантия", answer: "Не помогли — вернём деньги." }] };
  const f = fake({ setup });
  await handle(who, btn(CB.step + "x0"), f.deps, "o");
  assert.match(f.sent.at(-1)!.text, /вернём/);
  assert.ok(f.sent.at(-1)!.rows?.flat().some((b) => b.data === CB.step + "start"));
});

test("форма настроек: пустая строка кнопки пропускается, ошибки ловит проверка", () => {
  const form = new FormData();
  for (const k of ["greet", "helpLabel", "ask", "pay", "paid"]) form.set(k, "текст");
  form.set("p0.title", "Подписка");
  form.set("p0.price", "5 000");
  form.set("x0.label", "Сайт");
  form.set("x0.url", "http://insecure");
  const s = setupFromForm(form);
  assert.equal(s.amount, 5000);
  assert.equal(s.extras.length, 1);
  assert.ok(setupProblems(s).some((p) => p.includes("https")));
  form.set("x0.url", "https://devuz.studio");
  assert.deepEqual(setupProblems(setupFromForm(form)), []);
});

test("источник claudery: свой вид лида, входящий в ступенях, миграция пускает", () => {
  assert.equal(leadKindOf({ source: "claudery" }), "claudery");
  assert.ok(INBOUND_SOURCES.includes("claudery"));
  assert.match(read("supabase/migrations/0188_lead_source_claudery.sql"), /'claudery'/);
});

test("ключи — только из хранилища, поллер ставится выкаткой, оплата — опросом Platega", () => {
  const store = read("lib/claudery/store.ts");
  assert.match(store, /CLAUDERY_BOT_TOKEN/);
  assert.match(store, /PLATEGA_API_KEY/);
  assert.match(store, /\/transaction\/process/);
  assert.match(store, /PAY_PURPOSE/);
  assert.match(store, /\/transaction\/\$\{/);
  assert.doesNotMatch(store, /console\.(log|error)\([^)]*(token|apiKey|key)\b\)/);
  const unit = read("deploy/devuz-claudery-bot.service");
  assert.match(unit, /POLLER_FROM_VAULT=1/);
  assert.match(unit, /\/api\/claudery\/tg\/\{secret\}/);
  const deploy = read("scripts/vps-deploy.sh");
  assert.match(deploy, /install_unit devuz-claudery-bot\.service/);
  assert.match(deploy, /systemctl restart devuz-claudery-bot\.service/);
  assert.match(read("app/api/claudery/tg/[secret]/route.ts"), /secretOk\(header, expected\)/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /checkClauderyPayments/);
  // Реквизиты ИП — из хранилища, в коде оферты их нет.
  assert.match(read("app/claudery/offer/page.tsx"), /sellerData\(\)/);
  assert.match(read("app/claudery/docs.tsx"), /appSecret\("INVOICE_RU_PAYEE"\)/);
});

test("повторное обращение: кто уже оплачивал — скидка 30%, 3 500 ₽ вместо 5 000 ₽ на странице заявки", async () => {
  assert.equal(DEFAULT_SETUP.repeatDiscount, 30);
  const f = fake({ before: true });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "text", text: "опять не работает" }, f.deps, "o");
  assert.deepEqual(f.leads, [3500]);
  assert.deepEqual(f.invoices, [{ amount: 3500, full: 5000, discount: 30 }]);
  assert.match(read("app/claudery/z/[token]/page.tsx"), /скидка \{order\.discount\}%/);
  assert.match(read("lib/claudery/store.ts"), /payload->>status", "paid"/);
});

test("оплата Claudery в деньгах: ведущему 40% с суммы, без руководителя, остальное соучредителям, не в грейд", async () => {
  const { accrualsOf, foundersPool, CLAUDERY_MANAGER_PERCENT } = await import("@/lib/admin/finance");
  const { gradeBook } = await import("@/lib/admin/grade-month");
  const { usdOf, usdRateFromCbr } = await import("@/lib/claudery/money");
  assert.equal(CLAUDERY_MANAGER_PERCENT, 40);
  const earners = new Map([
    ["m", { id: "m", grade: "manager" as const, rate_percent: null, head_staff_id: "h", founder_percent: null }],
    ["h", { id: "h", grade: "head" as const, rate_percent: null, head_staff_id: null, founder_percent: null }],
  ]);
  const project = { id: "p", owner_staff_id: "m", kind: "new" as const, amount_usd: 60, tax_percent: 6, dev_cost_usd: 0, stage: "build", product: "claudery" };
  const pay = [{ project_id: "p", amount_usd: 60 }];
  const lines = accrualsOf(project, pay, earners);
  assert.deepEqual(lines.map((l) => [l.staff_id, l.percent, l.amount_usd, l.state]), [["m", 40, 24, "earned"]]);
  // Остаток студии — прибыль минус 40%: он и делится между соучредителями.
  assert.equal(foundersPool([project], pay, lines, []).pool, 60 - 4 - 24);
  // Лид ещё ничей — всё соучредителям.
  assert.deepEqual(accrualsOf({ ...project, owner_staff_id: null }, pay, earners), []);
  const book = gradeBook([project], [{ ...pay[0], paid_on: "2026-11-17" }], new Date("2026-11-17T12:00:00Z"));
  assert.equal(book.counts.size, 0);
  assert.equal(usdOf(5000, 92.5), 54);
  assert.equal(usdRateFromCbr("<Valute><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal><Name>Доллар США</Name><Value>92,5012</Value></Valute>"), 92.5012);
  assert.equal(usdRateFromCbr("<x/>"), null);
  // Проект заводит оплата, ведущего ставит взявший лид (триггер миграции).
  assert.match(read("lib/claudery/store.ts"), /paidProject\(pay, now\)/);
  assert.match(read("supabase/migrations/0189_claudery_projects.sql"), /after update of assigned_staff_id on public\.leads/);
});

test("Platega — напрямую, как AI-юрист; отказ виден на странице заявки", async () => {
  const { readFile } = await import("node:fs/promises");
  const store = await readFile("lib/claudery/store.ts", "utf8");
  const call = store.slice(store.indexOf("async function plategaFetch"), store.indexOf("/** Платёжная ссылка"));
  assert.match(call, /directDispatcher\(\)/);
  assert.doesNotMatch(call, /roadFetch\(/);
  assert.match(call, /PLATEGA_LAST_KEY/);
  const route = await readFile("app/claudery/z/[token]/pay/route.ts", "utf8");
  assert.match(route, /\?pay=failed/);
  const page = await readFile("app/claudery/z/[token]/page.tsx", "utf8");
  assert.match(page, /Не получилось открыть страницу оплаты/);
});

test("продаём товар, не услугу: витрина подписок, выбор на странице заказа, в текстах клиенту нет услуг", async () => {
  const { productAt, repeatAmount, parseSetup } = await import("@/lib/claudery/scenario");
  // Сохранённое до витрины: одна сумма становится ценой единственного товара.
  const old = parseSetup({ ...DEFAULT_SETUP, products: undefined, amount: 4000 });
  assert.equal(old.products.length, 1);
  assert.equal(old.products[0].price, 4000);
  assert.equal(old.amount, 4000);
  // Несколько товаров: цена лида — первого, чужой номер из формы — первый товар.
  const s: Setup = { ...DEFAULT_SETUP, products: [{ title: "A", price: 3000 }, { title: "B", note: "год", price: 9000 }], amount: 3000 };
  assert.deepEqual(setupProblems(s), []);
  assert.equal(productAt(s, 1).title, "B");
  assert.equal(productAt(s, 7).title, "A");
  assert.equal(productAt(s, Number.NaN).title, "A");
  assert.equal(repeatAmount(productAt(s, 1).price, 30), 6300);
  assert.ok(setupProblems({ ...s, products: [] }).length > 0);
  assert.ok(setupProblems({ ...s, products: [{ title: "", price: 10 }] }).length >= 2);
  // Тексты, которые видит клиент и платёжная система: товар, а не услуга.
  const SERVICE = /помощ|консультац|услуг|специалист/i;
  const d = DEFAULT_SETUP;
  assert.doesNotMatch([d.greet, d.helpLabel, d.ask, d.pay, d.paid, PAY_PURPOSE, d.products[0].title].join(" "), SERVICE);
  const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  for (const file of ["app/claudery/page.tsx", "app/claudery/z/[token]/page.tsx", "app/claudery/offer/page.tsx"]) {
    assert.doesNotMatch(strip(read(file)).replace(/оказани\S+ услуг/g, ""), /помощ|консультац|услуг[аиу]? |специалист/i, file);
  }
  const page = read("app/claudery/z/[token]/page.tsx");
  assert.match(page, /name="p"/);
  assert.match(page, /order\.products\.map/);
  assert.match(read("app/claudery/page.tsx"), /products\.map/);
  assert.match(read("app/claudery/offer/page.tsx"), /цифровой товар/);
  assert.match(read("lib/claudery/store.ts"), /productAt\(await loadSetup\(\), productIndex\)/);
});

test("документы для банка Platega: соглашение, политика, поддержка — на сайте и кнопками в боте; почта покупателя в платеже", async () => {
  const { supportLink } = await import("@/lib/claudery/scenario");
  const { docRows } = await import("@/lib/claudery/flow");
  const { buyerId } = await import("@/lib/claudery/store");
  // Контакт поддержки: почта, @username, t.me или https; группа словами — нет.
  assert.deepEqual(supportLink("help@example.com"), { text: "help@example.com", href: "mailto:help@example.com", web: null });
  assert.equal(supportLink("@someone")?.web, "https://t.me/someone");
  assert.equal(supportLink("https://t.me/someone")?.text, "@someone");
  assert.equal(supportLink("напишите в группу"), null);
  assert.equal(supportLink(""), null);
  assert.ok(setupProblems({ ...DEFAULT_SETUP, support: "группа поддержки" }).length > 0);
  assert.deepEqual(setupProblems({ ...DEFAULT_SETUP, support: "@someone" }), []);
  const form = new FormData();
  form.set("support", " @someone ");
  assert.equal(setupFromForm(form).support, "@someone");
  // Кнопки в боте: соглашение и политика всегда, «Поддержка» — когда контакт задан.
  const sc = scenarioOf(DEFAULT_SETUP);
  const urls = docRows(sc, "https://devuz.studio/claudery/offer").flat().map((b) => b.url);
  assert.deepEqual(urls, ["https://devuz.studio/claudery/terms", "https://devuz.studio/claudery/privacy"]);
  const withSupport = docRows(scenarioOf({ ...DEFAULT_SETUP, support: "help@example.com" }), "https://devuz.studio/claudery/offer").flat();
  assert.equal(withSupport.at(-1)?.url, "https://devuz.studio/claudery#support");
  // Документы есть кнопками и на первом шаге, и рядом с заказом.
  const f = fake();
  await handle(who, { type: "text", text: "/start" }, f.deps, "https://x/claudery/offer");
  assert.ok(f.sent[0].rows!.flat().some((b) => b.url === "https://x/claudery/privacy"));
  await handle(who, btn(CB.step + "ask"), f.deps, "https://x/claudery/offer");
  await handle(who, { type: "text", text: "Нужен ChatGPT" }, f.deps, "https://x/claudery/offer");
  assert.ok(f.sent.at(-1)!.rows!.flat().some((b) => b.url === "https://x/claudery/terms"));
  // Страницы: дата редакции, поддержка, продавец из хранилища, без услуг.
  const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  for (const file of ["app/claudery/terms/page.tsx", "app/claudery/privacy/page.tsx", "app/claudery/docs.tsx"]) {
    assert.doesNotMatch(strip(read(file)), /помощ|консультац|услуг|специалист/i, file);
  }
  assert.match(read("app/claudery/docs.tsx"), /DOCS_DATE = "\d\d\.\d\d\.\d{4}"/);
  assert.match(read("app/claudery/docs.tsx"), /INVOICE_RU_PAYEE/);
  for (const file of ["app/claudery/page.tsx", "app/claudery/z/[token]/page.tsx", "app/claudery/offer/page.tsx", "app/claudery/terms/page.tsx", "app/claudery/privacy/page.tsx"]) {
    assert.match(read(file), /<Footer s=/, file);
  }
  // Почта покупателя в платеже (памятка Platega): Telegram ID@telegram.org.
  assert.equal(buyerId(42), "42@telegram.org");
  assert.match(read("lib/claudery/store.ts"), /metadata: \{ user_email: buyerId\(order\.chatId\) \}/);
});

test("«Купить» на витрине: ссылка в бот с номером подписки, заказ сразу на её цену", async () => {
  const { buyStart, BUY_START } = await import("@/lib/claudery/flow");
  const setup: Setup = { ...DEFAULT_SETUP, products: [{ title: "Claude Pro", price: 4000 }, { title: "ChatGPT Plus", price: 6000 }], amount: 4000 };
  const f = fake({ setup });
  await handle(who, { type: "text", text: `/start ${buyStart(1)}` }, f.deps, "https://x/claudery/offer");
  // Шаг «что нужно» пропущен: заказ на выбранную подписку, по её цене.
  assert.deepEqual(f.invoices, [{ amount: 6000, full: 6000, discount: 30 }]);
  assert.equal(f.flows.get(7)?.pick?.index, 1);
  assert.match(f.flows.get(7)?.problem ?? "", /ChatGPT Plus/);
  const last = f.sent.at(-1)!;
  assert.ok(last.rows!.flat().some((b) => b.url === "https://devuz.studio/claudery/z/t1"));
  assert.doesNotMatch([last.text, ...last.rows!.flat().map((b) => b.text)].join(" "), /оплат|₽|руб/i);
  // Чужой номер — обычное приветствие, без заказа.
  const g = fake({ setup });
  await handle(who, { type: "text", text: "/start buy7" }, g.deps, "https://x/claudery/offer");
  assert.equal(g.invoices.length, 0);
  assert.ok(BUY_START.test("/start buy0"));
  // Витрина: кнопка «Купить» у каждой подписки ведёт в бот с этим номером; заказ помнит товар.
  const page = read("app/claudery/page.tsx");
  assert.match(page, /\?start=\$\{buyStart\(i\)\}/);
  assert.match(read("lib/claudery/store.ts"), /if \(flow\.pick\) row\.product = productAt\(await loadSetup\(\), flow\.pick\.index\)\.title/);
});
