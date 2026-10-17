/**
 * Объявление «Новая „Главная“» — руководителю и менеджерам 17.10.2026 от
 * имени владельца, со скриншотом.
 *
 * Владелец, 17.10.2026: «Закинь скриншоты новой панели в тг оповещение от
 * бота для всех по новой странице „главная“… От моего лица».
 */
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { test } from "node:test";

import { hqMyDict } from "@/content/admin-panel/hq-my";
import { NEWS, hqHomeNews, newsActive } from "@/lib/admin/team-news";

const news = NEWS.find((n) => n.id === "2026-10-17-hq-home");
const plain = (s: string) => s.replace(/<\/?[bi]>/g, "");
// Telegram считает подпись в UTF-16, как String.length.
const CAPTION_MAX = 1024;

test("уходит руководителю и менеджерам 17.10 с 07:00 по Ташкенту, ночью — нет", () => {
  assert.ok(news?.window);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  const at = (iso: string) => new Date(iso);
  assert.equal(newsActive(news, at("2026-10-16T20:00:00Z")), false, "16.10 — ещё рано");
  assert.equal(news.window(at("2026-10-17T01:59:00Z")), false, "06:59 по Ташкенту — ждём");
  assert.equal(news.window(at("2026-10-17T02:00:00Z")), true, "07:00 по Ташкенту, суббота");
  assert.equal(newsActive(news, at("2026-10-17T02:00:00Z")), true);
  assert.equal(news.window(at("2026-10-17T18:30:00Z")), false, "23:30 — ночь");
  assert.equal(newsActive(news, at("2026-10-20T03:00:00Z")), false, "через три дня — устарело");
});

test("со скриншотом, подпись и копия владельцу влезают в Telegram", () => {
  assert.ok(news?.photo);
  const file = new URL(`../public${news.photo}`, import.meta.url);
  assert.ok(existsSync(file) && statSync(file).size > 50_000, "картинки нет");
  for (const role of ["head", "manager"] as const) {
    assert.ok(plain(hqHomeNews(role)).length < CAPTION_MAX, `подпись ${role} длиннее предела Telegram`);
  }
  const copy = plain([news.copyNote ?? "", "", hqHomeNews(news.copyRole ?? "head")].join("\n"));
  assert.ok(copy.length < CAPTION_MAX, `копия владельцу длиннее предела Telegram: ${copy.length}`);
});

test("от имени владельца, названия блоков и кнопок — как в панели", () => {
  for (const role of ["head", "manager"] as const) {
    const text = hqHomeNews(role);
    assert.match(text, /Егор$/);
    for (const key of ["hotTitle", "lateTitle", "contactTitle", "mockTitle", "write"] as const) {
      assert.ok(text.includes(`«${hqMyDict[key].ru}»`), `в тексте ${role} нет «${hqMyDict[key].ru}»`);
    }
    for (const key of ["won", "lost", "wait"] as const) {
      const label = hqMyDict[key].ru.replace(/^\S+\s/, "");
      assert.ok(text.includes(`«${label}»`), `в тексте ${role} нет «${label}»`);
    }
  }
  assert.match(hqHomeNews("head"), /командным центром/);
  assert.doesNotMatch(hqHomeNews("manager"), /командным центром/);
});
