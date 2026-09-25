import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { extractContacts } from "@/lib/audit/contacts";

/**
 * 24 сентября: касание владельца svoydom.kz так и не ушло с рабочего
 * аккаунта. Ссылка в Telegram на сайте вела в канал, и карточка сразу стала
 * «писать руками» — мобильный номер с того же сайта никто не попробовал. А
 * среди «адресов» были @click, @mousedown и @dblclick — обработчики из
 * разметки Vue, которые скаут принял бы за людей.
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("обработчики событий и правила CSS — не Telegram-адреса", () => {
  const c = extractContacts(`
    <html><body>
      <p>Пишите нам @svoydomkz</p>
      <p>Кнопка @click = открыть, @mousedown и @dblclick, @keyup, @media screen</p>
      <a href="https://t.me/svoydom_sales">Отдел продаж</a>
    </body></html>`);
  assert.ok(c.telegram.includes("@svoydomkz"), "настоящий адрес из текста потерялся");
  assert.ok(c.telegram.includes("@svoydom_sales"), "адрес из ссылки потерялся");
  for (const junk of ["@click", "@mousedown", "@dblclick", "@keyup", "@media"]) {
    assert.ok(!c.telegram.includes(junk), `${junk} принят за адрес`);
  }
});

test("адрес оказался каналом — пробуем номер с сайта, а не сдаёмся", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  const fn = queue.slice(queue.indexOf("export async function markUnreachable"));
  // Все мобильные с сайта по очереди, а не только первый.
  assert.match(fn, /const mobiles = \[\.\.\.new Set\(/);
  assert.match(fn, /mobiles\[mobiles\.indexOf\(tried \?\? ""\) \+ 1\]/);
  assert.match(fn, /target_kind: "phone"/);
  // Карточка остаётся в очереди — меняется только маршрут.
  assert.match(fn, /\.eq\("status", "sending"\)/);
  // Номер уже пробовали — тогда руками.
  assert.match(fn, /status: "manual", target_kind: "manual"/);

  const runner = read("scout/runner.mjs");
  assert.equal(
    (runner.match(/markUnreachable\(job\.id, note, job\.kind, job\.target\)/g) ?? []).length,
    2,
    "скаут не передаёт маршрут и адресата",
  );
});

test("письма владельца уходят вне очереди, но не пачкой", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  const next = queue.slice(queue.indexOf("export async function nextQueued"));
  const owner = next.indexOf('.in("claimed_by", owners)');
  const cap = next.indexOf("HOURLY_CAP");
  assert.ok(owner > 0 && owner < cap, "владелец ждёт часового предела вместе со всеми");
  assert.match(next, /now - lastAt >= OWNER_FLOOR_MS/);
  assert.match(queue, /export const OWNER_FLOOR_MS = 60_000;/);
  // Владелец — это роль admin, а не имя.
  assert.match(queue, /\.from\("staff"\)\.select\("id"\)\.eq\("role", "admin"\)\.eq\("is_active", true\)/);

  // Панель говорит то же, что делает очередь.
  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /Письмо владельца — вне очереди/);
});
