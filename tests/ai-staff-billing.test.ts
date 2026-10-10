/**
 * ИИ-сотрудники: оплата картой (Payme, Click) и отчёт дня.
 *
 * Платёжная система повторяет запросы, присылает чужие суммы и подписи, а
 * тариф должен продлиться ровно один раз. Всё это — на хранилище в памяти.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PAYME_TIMEOUT_MS,
  click,
  clickLink,
  clickSign,
  payme,
  paymeAuthorized,
  paymeLink,
  type Invoice,
  type PayRepo,
  type Tx,
} from "@/lib/ai-staff/billing";
import { dayStats, reportText, tashkentDay } from "@/lib/ai-staff/report";
import type { Conversation, Lead } from "@/lib/ai-staff/store";

const INV = "11111111-2222-3333-4444-555555555555";

function memoryRepo(amount = 490_000) {
  const invoices = new Map<string, Invoice>([[INV, { id: INV, tenant_id: "t", amount_uzs: amount, status: "pending" }]]);
  const txs: Tx[] = [];
  const paid: string[] = [];
  const repo: PayRepo = {
    invoice: async (id) => invoices.get(id) ?? null,
    tx: async (provider, extId) => txs.find((t) => t.provider === provider && t.ext_id === extId) ?? null,
    txById: async (id) => txs.find((t) => t.id === id) ?? null,
    openTx: async (provider, invoiceId) => txs.find((t) => t.provider === provider && t.invoice_id === invoiceId && t.state === 1) ?? null,
    createTx: async (input) => {
      const tx = { ...input, id: txs.length + 1, perform_time: 0, cancel_time: 0, reason: null };
      txs.push(tx);
      return tx;
    },
    updateTx: async (id, patch) => {
      Object.assign(txs.find((t) => t.id === id)!, patch);
    },
    txBetween: async (provider, from, to) => txs.filter((t) => t.provider === provider && t.create_time >= from && t.create_time <= to),
    paid: async (invoice, provider) => {
      paid.push(`${invoice.id}:${provider}`);
      invoices.set(invoice.id, { ...invoice, status: "paid" });
    },
  };
  return { repo, txs, paid, invoices };
}

const account = { order_id: INV };

test("Payme: авторизация по ключу кассы", () => {
  const header = `Basic ${Buffer.from("Paycom:secret-key").toString("base64")}`;
  assert.equal(paymeAuthorized(header, "secret-key"), true);
  assert.equal(paymeAuthorized(header, "other"), false);
  assert.equal(paymeAuthorized(null, "secret-key"), false);
  assert.equal(paymeAuthorized(`Basic ${Buffer.from("Paycom:secret-keyX").toString("base64")}`, "secret-key"), false);
});

test("Payme: полный цикл — проверка, создание, проведение; тариф продлён один раз", async () => {
  const { repo, paid } = memoryRepo();
  const now = 1_760_000_000_000;
  assert.deepEqual(await payme(repo, "CheckPerformTransaction", { amount: 49_000_000, account }, now), { result: { allow: true } });
  assert.equal(((await payme(repo, "CheckPerformTransaction", { amount: 100, account }, now)) as { error: { code: number } }).error.code, -31001);
  assert.equal(
    ((await payme(repo, "CheckPerformTransaction", { amount: 49_000_000, account: { order_id: "нет" } }, now)) as { error: { code: number; data?: string } }).error.code,
    -31050,
  );

  const created = await payme(repo, "CreateTransaction", { id: "pm-1", time: now, amount: 49_000_000, account }, now);
  assert.deepEqual(created, { result: { create_time: now, transaction: "1", state: 1 } });
  // Повтор CreateTransaction с тем же id — тот же ответ, вторая транзакция не заводится.
  assert.deepEqual(await payme(repo, "CreateTransaction", { id: "pm-1", time: now, amount: 49_000_000, account }, now + 5), created);
  // Другая попытка по тому же счёту, пока первая открыта, — отказ.
  assert.equal(((await payme(repo, "CreateTransaction", { id: "pm-2", time: now, amount: 49_000_000, account }, now)) as { error: { code: number } }).error.code, -31052);

  const performed = await payme(repo, "PerformTransaction", { id: "pm-1" }, now + 1000);
  assert.deepEqual(performed, { result: { transaction: "1", perform_time: now + 1000, state: 2 } });
  assert.deepEqual(await payme(repo, "PerformTransaction", { id: "pm-1" }, now + 2000), performed, "повтор — тот же ответ");
  assert.deepEqual(paid, [`${INV}:payme`], "тариф продлён ровно один раз");

  assert.equal(((await payme(repo, "CancelTransaction", { id: "pm-1", reason: 5 }, now + 3000)) as { error: { code: number } }).error.code, -31007);
  const checked = (await payme(repo, "CheckTransaction", { id: "pm-1" }, now)) as { result: { state: number; perform_time: number } };
  assert.equal(checked.result.state, 2);
  assert.equal(((await payme(repo, "CheckPerformTransaction", { amount: 49_000_000, account }, now)) as { error: { code: number } }).error.code, -31051, "оплаченный счёт второй раз не оплатить");
  const statement = (await payme(repo, "GetStatement", { from: now - 1, to: now + 1 }, now)) as { result: { transactions: Array<{ id: string; account: unknown }> } };
  assert.equal(statement.result.transactions[0].id, "pm-1");
  assert.deepEqual(statement.result.transactions[0].account, account);
});

test("Payme: отмена до проведения и тайм-аут 12 часов", async () => {
  const { repo, paid } = memoryRepo();
  const now = 1_760_000_000_000;
  await payme(repo, "CreateTransaction", { id: "pm-1", time: now, amount: 49_000_000, account }, now);
  const cancelled = await payme(repo, "CancelTransaction", { id: "pm-1", reason: 3 }, now + 10);
  assert.deepEqual(cancelled, { result: { transaction: "1", cancel_time: now + 10, state: -1 } });
  assert.deepEqual(await payme(repo, "CancelTransaction", { id: "pm-1", reason: 3 }, now + 20), cancelled, "повтор отмены — тот же ответ");
  assert.equal(((await payme(repo, "PerformTransaction", { id: "pm-1" }, now + 30)) as { error: { code: number } }).error.code, -31008);

  await payme(repo, "CreateTransaction", { id: "pm-2", time: now, amount: 49_000_000, account }, now);
  const late = await payme(repo, "PerformTransaction", { id: "pm-2" }, now + PAYME_TIMEOUT_MS + 1);
  assert.equal((late as { error: { code: number } }).error.code, -31008);
  const state = (await payme(repo, "CheckTransaction", { id: "pm-2" }, now)) as { result: { state: number; reason: number } };
  assert.deepEqual([state.result.state, state.result.reason], [-1, 4]);
  assert.deepEqual(paid, []);
  assert.equal(((await payme(repo, "Неизвестный", {}, now)) as { error: { code: number } }).error.code, -32601);
  assert.equal(((await payme(repo, "PerformTransaction", { id: "нет" }, now)) as { error: { code: number } }).error.code, -31003);
});

function clickForm(over: Record<string, string>, secret = "s3cret") {
  const f: Record<string, string> = {
    click_trans_id: "777",
    service_id: "42",
    click_paydoc_id: "1",
    merchant_trans_id: INV,
    amount: "490000",
    action: "0",
    error: "0",
    error_note: "Success",
    sign_time: "2026-10-10 20:00:00",
    ...over,
  };
  f.sign_string = clickSign(f, secret, f.action === "1");
  return f;
}

test("Click: подпись, Prepare, Complete; повтор не продлевает второй раз", async () => {
  const { repo, paid } = memoryRepo();
  const cfg = { secret: "s3cret", serviceId: "42" };
  const now = 1_760_000_000_000;

  const forged = clickForm({}, "чужой-секрет");
  assert.equal((await click(repo, forged, cfg, now)).error, -1);
  assert.equal((await click(repo, clickForm({ amount: "1000" }), cfg, now)).error, -2);
  assert.equal((await click(repo, clickForm({ merchant_trans_id: "22222222-2222-3333-4444-555555555555" }), cfg, now)).error, -5);

  const prepared = await click(repo, clickForm({}), cfg, now);
  assert.equal(prepared.error, 0);
  assert.equal(prepared.merchant_prepare_id, 1);

  const done = await click(repo, clickForm({ action: "1", merchant_prepare_id: "1", amount: "490000.00" }), cfg, now + 1);
  assert.equal(done.error, 0);
  assert.equal(done.merchant_confirm_id, 1);
  assert.equal((await click(repo, clickForm({ action: "1", merchant_prepare_id: "1" }), cfg, now + 2)).error, -4);
  assert.deepEqual(paid, [`${INV}:click`]);
  assert.equal((await click(repo, clickForm({ action: "1", merchant_prepare_id: "99" }), cfg, now)).error, -6);
  assert.equal((await click(repo, clickForm({ action: "5" }), cfg, now)).error, -3);
});

test("Click: отказ на стороне Click отменяет транзакцию", async () => {
  const { repo, paid, txs } = memoryRepo();
  const cfg = { secret: "s3cret", serviceId: "42" };
  await click(repo, clickForm({}), cfg, 1);
  const res = await click(repo, clickForm({ action: "1", merchant_prepare_id: "1", error: "-5017" }), cfg, 2);
  assert.equal(res.error, -9);
  assert.equal(txs[0].state, -1);
  assert.deepEqual(paid, []);
});

test("ссылки на оплату: сумма в тийинах у Payme, в сумах у Click", () => {
  const link = paymeLink("m-1", INV, 490_000, "https://devuz.studio/cabinet/plan");
  const decoded = Buffer.from(link.replace("https://checkout.paycom.uz/", ""), "base64").toString();
  assert.equal(decoded, `m=m-1;ac.order_id=${INV};a=49000000;c=https://devuz.studio/cabinet/plan`);
  const c = new URL(clickLink("42", "7", INV, 490_000, "https://devuz.studio/cabinet/plan"));
  assert.equal(c.host, "my.click.uz");
  assert.equal(c.searchParams.get("amount"), "490000");
  assert.equal(c.searchParams.get("transaction_param"), INV);
});

test("отчёт дня: день по Ташкенту, разговоры с ответом ИИ сегодня, вопросы без ответа", () => {
  const { day, start, hour } = tashkentDay(new Date("2026-10-10T15:30:00Z"));
  assert.deepEqual([day, hour], ["2026-10-10", 20]);
  assert.equal(start.toISOString(), "2026-10-09T19:00:00.000Z");
  const today = "2026-10-10T10:00:00Z";
  const convs = [
    {
      id: "a",
      kind: "widget",
      off_hours: true,
      messages: [
        { role: "customer", text: "Есть рассрочка?", at: today },
        { role: "ai", text: "Уточню у менеджера", at: today, fallback: true },
      ],
    },
    { id: "b", kind: "test", off_hours: false, messages: [{ role: "ai", text: "x", at: today }] },
    { id: "c", kind: "tg_bot", off_hours: false, messages: [{ role: "ai", text: "вчера", at: "2026-10-08T10:00:00Z" }] },
  ] as unknown as Conversation[];
  const leads = [
    { conversation_id: "a", test: false, created_at: today },
    { conversation_id: "b", test: true, created_at: today },
  ] as Lead[];
  const s = dayStats(convs, leads, start);
  assert.deepEqual(s, { talks: 1, leads: 1, offHours: 1, unanswered: ["Есть рассрочка?"] });
  const ru = reportText("Мебель <Плюс>", s, "ru");
  assert.match(ru, /&lt;Плюс&gt;/);
  assert.match(ru, /в нерабочее время: 1/);
  assert.match(reportText("X", s, "uz"), /bugungi hisobot/);
});
