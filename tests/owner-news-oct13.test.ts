/**
 * Что сделано 13.10.2026 — владельцу и руководителям сразу, менеджерам
 * 14.10 в 08:00 по Ташкенту.
 *
 * Владелец: «Вышли мне и руководителям сейчас обновления сделанные, а
 * команде в 08:00 по Ташкенту. Напиши простым языком со смайликами,
 * согласуй текст со мной сначала» — «Отправляй».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PROMO } from "@/lib/admin/mockup-offer";
import { TIDY_BUTTONS } from "@/lib/admin/lead-tidy";
import { NEWS, headNewsOct13, newsActive, teamNewsOct13 } from "@/lib/admin/team-news";

const heads = NEWS.find((n) => n.id === "2026-10-13-heads-day");
const team = NEWS.find((n) => n.id === "2026-10-14-team-day");

test("владельцу и руководителям — сразу, ночью тоже", async () => {
  assert.ok(heads?.window);
  assert.deepEqual([...heads.roles].sort(), ["admin", "head"]);
  const midnight = new Date("2026-10-13T19:30:00Z"); // 00:30 по Ташкенту
  assert.equal(newsActive(heads, midnight), true);
  assert.equal(heads.window(midnight), true);
  assert.equal(await heads.text("head"), headNewsOct13());
  assert.equal(newsActive(heads, new Date("2026-10-16T03:00:00Z")), false, "через три дня — устарело");
});

test("менеджерам — 14.10 не раньше 08:00 по Ташкенту, владельцу копия", async () => {
  assert.ok(team?.window);
  assert.deepEqual([...team.roles], ["manager"], "руководители своё уже получили");
  const at = (iso: string) => new Date(iso);
  assert.equal(newsActive(team, at("2026-10-13T20:00:00Z")), false, "13.10 по UTC — ещё рано");
  assert.equal(team.window(at("2026-10-14T02:59:00Z")), false, "07:59 по Ташкенту — ждём");
  assert.equal(team.window(at("2026-10-14T03:00:00Z")), true, "08:00 по Ташкенту");
  assert.equal(newsActive(team, at("2026-10-14T03:00:00Z")), true);
  assert.equal(team.copyRole, "manager");
  assert.match(team.copyNote ?? "", /Копия/);
  assert.equal(await team.text("manager"), teamNewsOct13());
});

test("цены и кнопки — те же, что в коде акции и бота", () => {
  const money = (n: number) => `${n.toLocaleString("ru-RU").replace(/\s/g, " ")} $`;
  for (const text of [headNewsOct13(), teamNewsOct13()]) {
    for (const price of [PROMO.landing.price, PROMO.landing.regular, PROMO.corporate.price, PROMO.corporate.regular]) {
      assert.ok(text.includes(money(price)), `нет цены ${money(price)}`);
    }
    assert.ok(text.includes(`${PROMO.landing.addons} допами`));
    for (const label of Object.values(TIDY_BUTTONS)) assert.ok(text.includes(`«${label}»`), `нет кнопки «${label}»`);
    assert.ok(text.length < 4000, "не влезает в одно сообщение Telegram");
  }
});

test("менеджерам — без отчёта руководителям и без кнопок владельца", () => {
  const text = teamNewsOct13();
  assert.doesNotMatch(text, /Сотрудники за день|18:00|Закрыть паролем|Утверждён|\/mockups|15:00/);
  assert.match(headNewsOct13(), /«Сотрудники за день»/);
  assert.match(headNewsOct13(), /«🔒 Закрыть паролем»/);
});
