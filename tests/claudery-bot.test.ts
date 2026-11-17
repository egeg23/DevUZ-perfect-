import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { leadKindOf } from "@/lib/admin/lead-kinds";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { CB, handle, type Deps, type Flow, type Row, type Who } from "@/lib/claudery/flow";
import { DEFAULT_SCENARIO, PAY_PURPOSE, scenarioFromForm, scenarioProblems, type Scenario } from "@/lib/claudery/scenario";

const read = (p: string) => readFileSync(p, "utf8");
const who: Who = { chatId: 7, username: "client", name: "Иван", languageCode: "ru" };

function fake(state: { pay?: "paid" | "pending" | "failed"; invoice?: boolean } = {}) {
  const flows = new Map<number, Flow>();
  const sent: { text: string; rows?: Row[] }[] = [];
  const leads: string[] = [];
  const invoices: { amount: number; purpose: string }[] = [];
  const deps: Deps = {
    scenario: async () => DEFAULT_SCENARIO,
    flowOf: async (id) => (flows.has(id) ? structuredClone(flows.get(id)!) : null),
    saveFlow: async (id, f) => void flows.set(id, structuredClone(f)),
    send: async (_id, text, rows) => void sent.push({ text, rows }),
    answer: async () => {},
    lead: async (_w, f, why) => {
      if (!f.requestNo) leads.push(why);
      return { leadId: "L1", requestNo: f.requestNo ?? "DZ-1" };
    },
    invoice: async (_f, amount, purpose) => {
      invoices.push({ amount, purpose });
      return state.invoice === false ? null : { txn: "T1", url: "https://pay.example/T1" };
    },
    paid: async () => state.pay ?? "pending",
  };
  return { deps, flows, sent, leads, invoices };
}

const btn = (data: string) => ({ type: "button" as const, data, callbackId: "c" });

test("сценарий по умолчанию проходит проверку и начинается одной кнопкой", () => {
  assert.deepEqual(scenarioProblems(DEFAULT_SCENARIO), []);
  const start = DEFAULT_SCENARIO.steps.find((s) => s.id === DEFAULT_SCENARIO.start)!;
  assert.equal(start.buttons.length, 1);
  assert.equal(PAY_PURPOSE, "Claudery: удалённая помощь");
});

test("кнопка → что случилось → счёт: лид заводится до оплаты, оплату решает Platega", async () => {
  const f = fake();
  await handle(who, { type: "text", text: "/start" }, f.deps, "https://x/offer");
  await handle(who, btn(CB.step + "ask"), f.deps, "https://x/offer");
  await handle(who, { type: "text", text: "ChatGPT не открывается" }, f.deps, "https://x/offer");
  assert.deepEqual(f.leads, ["priced"]);
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
  assert.deepEqual(f.leads, ["priced"]);
  assert.match(f.sent.at(-1)!.text, /не получается выставить счёт/);
});

test("язык: узбекский по кнопке", async () => {
  const f = fake();
  await handle(who, btn(CB.lang + "uz"), f.deps, "o");
  assert.equal(f.flows.get(7)?.lang, "uz");
  assert.match(f.sent.at(-1)!.text, /Assalomu alaykum/);
});

test("конструктор: форма → сценарий, ошибки ловит проверка", () => {
  const form = new FormData();
  form.set("start", "a");
  form.set("n.0.id", "a");
  form.set("n.0.kind", "message");
  form.set("n.0.ru", "Привет");
  form.set("n.0.uz", "Salom");
  form.set("n.0.b.0.ru", "Дальше");
  form.set("n.0.b.0.to", "nope");
  const s: Scenario = scenarioFromForm(form);
  assert.equal(s.steps.length, 1);
  assert.ok(scenarioProblems(s).some((p) => p.includes("несуществующий")));
  form.set("n.0.b.0.to", "");
  form.set("n.0.b.0.url", "http://insecure");
  assert.ok(scenarioProblems(scenarioFromForm(form)).some((p) => p.includes("https")));
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
