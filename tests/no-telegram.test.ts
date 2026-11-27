import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NO_TG_LIST, noTgDue, noTgNewsKey, noTgText } from "@/lib/admin/no-telegram";

test("письма без Telegram: строка менеджеру по будням утром, со ссылками на карточки", () => {
  assert.equal(noTgDue(1, 10), true);
  assert.equal(noTgDue(5, 11), true);
  assert.equal(noTgDue(5, 12), false);
  assert.equal(noTgDue(1, 9), false);
  assert.equal(noTgDue(6, 10), false);
  assert.equal(noTgDue(7, 10), false);
  assert.equal(noTgNewsKey("2026-11-30"), "no-tg:2026-11-30");
  const cards = Array.from({ length: NO_TG_LIST + 2 }, (_, i) => ({ id: `id-${i}`, label: i === 0 ? "A&B <x>" : `Компания ${i}` }));
  const text = noTgText(cards, "https://devuz.studio");
  assert.match(text, /ждут WhatsApp или звонка: 7/);
  assert.match(text, /href="https:\/\/devuz\.studio\/admin\/prospect\?open=id-0"/);
  assert.match(text, /A&amp;B &lt;x&gt;/);
  assert.match(text, /…и ещё 2/);
  assert.doesNotMatch(text, /id-5/);
  assert.doesNotMatch(text, /[—–]/);
});

test("письма без Telegram: свип зовёт, берёт только «руками» и под галочкой «Порция дня»", () => {
  const store = readFileSync("lib/admin/no-telegram-store.ts", "utf8");
  assert.match(store, /\.eq\("status", "manual"\)/);
  assert.match(store, /"portion"\)\) continue/);
  assert.match(readFileSync("app/api/reminders/sweep/route.ts", "utf8"), /sendNoTelegram\(new Date\(\)\)/);
});
