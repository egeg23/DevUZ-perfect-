/**
 * Объявление «Меню панели сгруппировали» — команде 13.10 в 08:00 по
 * Ташкенту, со скриншотом.
 *
 * Владелец, 13.10.2026: «Короткое уведомление в тг для команды должно уйти
 * в 8 утра по Ташкенту… Желательно показать скриншотом».
 */
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { test } from "node:test";

import { navGroupDict, shellDict } from "@/content/admin-panel/shell";
import { NEWS, navMenuNews, newsActive } from "@/lib/admin/team-news";

const news = NEWS.find((n) => n.id === "2026-10-13-nav-menu");

test("уходит руководителю и менеджерам 13.10 не раньше 08:00 по Ташкенту", () => {
  assert.ok(news?.window);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  const at = (iso: string) => new Date(iso);
  assert.equal(newsActive(news, at("2026-10-12T22:00:00Z")), false, "12.10 — ещё рано");
  assert.equal(news.window(at("2026-10-13T02:59:00Z")), false, "07:59 по Ташкенту — ждём");
  assert.equal(news.window(at("2026-10-13T03:00:00Z")), true, "08:00 по Ташкенту");
  assert.equal(newsActive(news, at("2026-10-13T03:00:00Z")), true);
  assert.equal(news.window(at("2026-10-13T18:30:00Z")), false, "23:30 — ночь");
  assert.equal(newsActive(news, at("2026-10-16T03:00:00Z")), false, "через три дня — устарело");
});

test("со скриншотом, подпись влезает в Telegram, названия — как в панели", () => {
  assert.ok(news?.photo);
  const file = new URL(`../public${news.photo}`, import.meta.url);
  assert.ok(existsSync(file) && statSync(file).size > 10_000, "картинки нет");
  const text = navMenuNews();
  const plain = text.replace(/<\/?b>/g, "");
  assert.ok(plain.length < 900, `подпись длиннее предела Telegram: ${plain.length}`);
  for (const name of [shellDict.navNew.ru, shellDict.findSection.ru, shellDict.menu.ru, navGroupDict.sales.ru, navGroupDict.money.ru]) {
    assert.ok(text.includes(`«${name}»`), `в тексте нет «${name}»`);
  }
  assert.match(text, /Ctrl\+K/);
  assert.match(text, /как раньше/);
});
