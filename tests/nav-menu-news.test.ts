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
  // Объявление ушло 13.10 с тогдашними названиями групп: «Проекты и деньги» с 23.10 зовётся «Деньги».
  for (const name of [shellDict.navNew.ru, shellDict.findSection.ru, shellDict.menu.ru, navGroupDict.sales.ru, "Проекты и деньги"]) {
    assert.ok(text.includes(`«${name}»`), `в тексте нет «${name}»`);
  }
  assert.match(text, /Ctrl\+K/);
  assert.match(text, /как раньше/);
});

test("скриншот уходит загрузкой, а не ссылкой; не принялся — уходит текст", async () => {
  // 13.10.2026: по ссылке Telegram картинку с нашего сервера не забрал, и
  // объявление в 08:00 не ушло никому.
  const { readFileSync } = await import("node:fs");
  const store = readFileSync(new URL("../lib/admin/team-news.ts", import.meta.url), "utf8");
  assert.doesNotMatch(store, /absoluteUrl\(news\.photo\)/);
  const helper = store.slice(store.indexOf("async function sendWithPhoto("));
  assert.match(helper, /readFile\(path\.join\(process\.cwd\(\), "public", photo\)\)/);
  assert.match(helper, /await sendPhotoFile\(chat, file, path\.basename\(photo\), caption\)\)\) return true;\s*return sendMessage\(chat, caption\);/);
});
