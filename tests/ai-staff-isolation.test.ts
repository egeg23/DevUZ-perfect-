/**
 * ИИ-сотрудники: данные одного клиента не видны другому.
 *
 * RLS в базе включён без политик, а сервер ходит по сервисному ключу,
 * который его обходит: изоляцию держит только код (lib/ai-staff/store.ts).
 * Тест читает этот код и не пропускает функцию, которая ходит в таблицу
 * `ai_*` без фильтра по клиенту, — кроме тех, что клиента и ищут.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

/** Функции, которые ищут клиента или работают со всем сервисом. Новая — только сюда. */
const LOOKUPS = new Set([
  "serviceEnabled", // флаг сервиса
  "setServiceEnabled",
  "createTenant", // новый клиент: его id ещё нет
  "allTenants", // панель владельца студии
  "tenantByInvite", // приглашение менеджера по коду
  "membershipsOf", // кабинеты человека по его Telegram id
  "channelByExternal", // канал Business по business_connection_id
  "channelByWidgetKey", // канал виджета по ключу
  "channelForHook", // канал бота по id из адреса вебхука (секрет сверяет маршрут)
  "saveLoginToken", // вход в кабинет: человек, а не клиент
  "useLoginToken",
  "saveSession",
  "sessionByHash",
  "setSessionTenant", // клиент сессии сверяет auth.ts по membershipsOf
  "dropSession",
  "setting", // настройки сервиса (демо на странице сервиса)
  "saveSetting",
  // Оплата картой: платёжная система знает счёт и свою транзакцию, а не
  // клиента; клиента знает сам счёт (lib/ai-staff/pay.ts).
  "invoiceForPayment",
  "claimInvoicePaid",
  "payTx",
  "payTxById",
  "openPayTx",
  "insertPayTx",
  "patchPayTx",
  "payTxBetween",
]);

function functions(source: string): Array<{ name: string; body: string; params: string }> {
  const out: Array<{ name: string; body: string; params: string }> = [];
  const re = /export async function (\w+)\(([^)]*)\)/g;
  const starts = [...source.matchAll(re)];
  for (let i = 0; i < starts.length; i++) {
    const m = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1].index : source.length;
    out.push({ name: m[1], params: m[2], body: source.slice(m.index, end) });
  }
  return out;
}

test("каждый запрос к данным клиента фильтрует по tenant_id", () => {
  const source = read("lib/ai-staff/store.ts");
  const list = functions(source);
  assert.ok(list.length > 20, "функции store.ts нашлись");
  for (const fn of list) {
    if (!/\.from\("(ai_|model_usage)/.test(fn.body) || LOOKUPS.has(fn.name)) continue;
    assert.match(fn.params, /^\s*tenantId: string/, `${fn.name}: первый аргумент — tenantId`);
    // Каждый вызов .from(...) в функции — с фильтром по клиенту или вставкой его id.
    const calls = fn.body.split(/(?=\.from\(")/).slice(1);
    for (const call of calls) {
      const chunk = call.split(/;\s*\n/)[0];
      const scoped =
        /\.eq\("tenant_id", tenantId\)/.test(chunk) ||
        /\.eq\("id", tenantId\)/.test(chunk) ||
        /tenant_id: tenantId/.test(chunk) ||
        // Вставка строки, собранной выше в той же функции с tenant_id клиента.
        (/\.(insert|upsert)\(\w+\)/.test(chunk) && /tenant_id: tenantId/.test(fn.body)) ||
        /\.eq\("site", usageSite\(tenantId\)\)/.test(chunk);
      assert.ok(scoped, `${fn.name}: запрос без фильтра по клиенту:\n${chunk.slice(0, 200)}`);
    }
  }
});

test("в таблицы ai_* ходит только store.ts", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(path);
      } else if (/\.(ts|tsx)$/.test(entry.name) && path !== "lib/ai-staff/store.ts") {
        if (/\.from\("ai_/.test(read(path))) offenders.push(path);
      }
    }
  };
  for (const dir of ["lib", "app", "components"]) walk(dir);
  assert.deepEqual(offenders, []);
});
