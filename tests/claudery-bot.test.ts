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
  const invoices: { amount: number; purpose: string }[] = [];
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
    invoice: async (_f, amount, purpose) => {
      invoices.push({ amount, purpose });
      return state.invoice === false ? null : { txn: "T1", url: "https://pay.example/T1" };
    },
    paid: async () => state.pay ?? "pending",
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

test("кнопка → что случилось → счёт: лид заводится до оплаты, оплату решает Platega", async () => {
  const f = fake();
  await handle(who, { type: "text", text: "/start" }, f.deps, "https://x/offer");
  await handle(who, btn(CB.step + "ask"), f.deps, "https://x/offer");
  await handle(who, { type: "text", text: "ChatGPT не открывается" }, f.deps, "https://x/offer");
  assert.deepEqual(f.leads, [5000]);
  assert.deepEqual(f.invoices, [{ amount: 5000, purpose: PAY_PURPOSE }]);
  const last = f.sent.at(-1)!;
  assert.ok(last.rows?.flat().some((b) => b.url === "https://pay.example/T1"));
  assert.equal(f.flows.get(7)?.problem, "ChatGPT не открывается");

  // Слова клиента «оплатил» ничего не меняют: Platega ещё не подтвердила.
  await handle(who, { type: "text", text: "я оплатил" }, f.deps, "https://x/offer");
  await handle(who, btn(CB.check), f.deps, "https://x/offer");
  assert.equal(f.flows.get(7)?.pay?.status, "pending");
  assert.equal(f.invoices.length, 1, "второй счёт не выставляется");
});

test("Platega подтвердила — шаг после оплаты", async () => {
  const f = fake({ pay: "paid" });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "photo", fileId: "F", caption: "ошибка" }, f.deps, "o");
  await handle(who, btn(CB.check), f.deps, "o");
  assert.equal(f.flows.get(7)?.step, "paid");
  assert.equal(f.flows.get(7)?.photo, "F");
  assert.match(f.sent.at(-1)!.text, /Оплата прошла/);
});

test("счёт не выставился — заявка всё равно лид, клиенту честно", async () => {
  const f = fake({ invoice: false });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "text", text: "помогите" }, f.deps, "o");
  assert.deepEqual(f.leads, [5000]);
  assert.match(f.sent.at(-1)!.text, /не получается выставить счёт/);
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

test("повторное обращение: кто уже оплачивал — скидка 30%, 3 500 ₽ вместо 5 000 ₽", async () => {
  assert.equal(DEFAULT_SETUP.repeatDiscount, 30);
  const f = fake({ before: true });
  await handle(who, btn(CB.step + "ask"), f.deps, "o");
  await handle(who, { type: "text", text: "опять не работает" }, f.deps, "o");
  assert.deepEqual(f.leads, [3500]);
  assert.deepEqual(f.invoices, [{ amount: 3500, purpose: PAY_PURPOSE }]);
  const last = f.sent.at(-1)!;
  assert.match(last.text, /скидка 30%: 3 500 ₽ вместо 5 000 ₽/);
  assert.match(last.text, /Стоимость помощи — 3 500 ₽/);
  assert.ok(last.rows?.flat().some((b) => b.text.includes("3 500 ₽")));

  const g = fake();
  await handle(who, btn(CB.step + "ask"), g.deps, "o");
  await handle(who, { type: "text", text: "помогите" }, g.deps, "o");
  assert.deepEqual(g.invoices, [{ amount: 5000, purpose: PAY_PURPOSE }]);
  assert.doesNotMatch(g.sent.at(-1)!.text, /скидка/);
  assert.match(read("lib/claudery/store.ts"), /payload->>status", "paid"/);
});
