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
  assert.equal(PAY_PURPOSE, "Claudery: удалённая помощь");
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
  assert.match(read("app/claudery/z/[token]/pay/route.ts"), /orderPayUrl\(token\)/);
});

test("страница заявки не завелась — заявка всё равно лид, клиенту честно", async () => {
  const f = fake({ invoice: false });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "photo", fileId: "F", caption: "помогите" }, f.deps, "o");
  assert.deepEqual(f.leads, [5000]);
  assert.equal(f.flows.get(7)?.photo, "F");
  assert.match(f.sent.at(-1)!.text, /Заявку мы записали/);
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
  form.set("amount", "5 000");
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
  assert.match(read("app/claudery/offer/page.tsx"), /appSecret\("INVOICE_RU_PAYEE"\)/);
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
