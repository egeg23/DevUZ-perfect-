/**
 * Балл видимости в поиске и правило «дальше — с менеджером».
 *
 * Владелец: «сделай ещё СЕО аудит под гугл, который бы выдавал балл, пусть
 * он выдаётся в касании и проверке сайта. Не выдавай чёткие ответы, просто
 * укажи 1-2 проблемы и дальше — в разборе с нашим менеджером».
 *
 * Отсюда две вещи, которые здесь и проверяются. Первая: балл считает только
 * то, что стоит между сайтом и выдачей, — иначе это просто второй общий
 * балл, и владельцу он ничего не отвечает. Вторая: наружу уходит проблема,
 * а не её решение, и это записано в типе, а не в договорённости.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Finding, Severity } from "@/lib/audit/checks";
import { isSeoCode, seoReport } from "@/lib/audit/seo";

const f = (code: string, severity: Severity = "major"): Finding => ({
  code,
  severity,
  title: `Заголовок ${code}`,
  impact: "Чем оборачивается — тут длинное объяснение на языке владельца бизнеса.",
  fix: "Что делаем — тут порядок работ и сколько занимает.",
});

test("балл считает только то, что мешает быть найденным", () => {
  // Нет кнопки в телеграм и нет цен — это про того, кто уже открыл сайт.
  // К видимости в Google это отношения не имеет, и балл трогать не должно.
  const conversion = seoReport({ findings: [f("no_phone", "critical"), f("no_messenger"), f("no_prices")] });
  assert.equal(conversion.score, 100);
  assert.equal(conversion.total, 0);

  // А это — ровно про неё.
  const search = seoReport({ findings: [f("no_title"), f("no_sitemap")] });
  assert.equal(search.score, 100 - 14 - 8);
  assert.equal(search.total, 2);
});

test("запрет индексации — не «минус сколько-то», а потолок", () => {
  // Одна эта строка означает, что страницы в поиске нет вовсе. Складывать к
  // ней минусы за отсутствующий заголовок — всё равно что перечислять
  // царапины на машине без двигателя.
  const blocked = seoReport({ findings: [f("noindex", "critical")] });
  assert.ok(blocked.score <= 10, `балл ${blocked.score} — сайту, которому запрещено быть в поиске`);
  assert.equal(blocked.grade, "blocked");

  // Без запрета тот же одиночный минус балла почти не роняет.
  assert.ok(seoReport({ findings: [f("no_schema", "minor")] }).score > 90);
});

test("сайт, который не открылся, не получает балла — ни хорошего, ни плохого", () => {
  const down = seoReport({ findings: [f("http_error", "critical")] });
  assert.equal(down.measured, false);

  const alive = seoReport({ findings: [f("no_canonical", "minor")] });
  assert.equal(alive.measured, true);
});

test("наружу уходят одна-две проблемы, остальное остаётся на разбор", () => {
  const many = seoReport({
    findings: [f("no_schema", "minor"), f("no_title"), f("client_rendered", "critical"), f("no_sitemap"), f("one_language", "minor")],
  });

  assert.equal(many.shown.length, 2);
  assert.equal(many.hidden, 3);
  assert.equal(many.total, 5);

  // Порядок — по цене для поиска, а не по тяжести из общего аудита: «нет
  // карты сайта» там мелочь, а для того, кого не находят, — одна из главных
  // причин.
  assert.deepEqual(
    many.shown.map((p) => p.code),
    ["client_rendered", "no_title"],
  );
});

test("показанная проблема не несёт «что делаем» — это не договорённость, а тип", () => {
  const [shown] = seoReport({ findings: [f("no_title")] }).shown;
  assert.ok(shown);
  assert.equal(shown.title.length > 0, true);
  assert.equal(shown.impact.length > 0, true);
  // Правило, записанное в комментарии, держится до первого, кто напишет
  // f.fix в вёрстке. Записанное в типе — не даст это скомпилировать, а этот
  // тест сторожит и сам тип.
  assert.ok(!("fix" in shown), "решение не должно уезжать вместе с проблемой");
});

test("нечего показывать — значит, и звать не с чем", () => {
  const clean = seoReport({ findings: [] });
  assert.equal(clean.score, 100);
  assert.equal(clean.grade, "good");
  assert.deepEqual(clean.shown, []);
  assert.equal(clean.hidden, 0);
});

test("оценка словами меняется на границах, а не на глаз", () => {
  // 80 и выше — «всё в порядке». no_title (14) роняет ровно до 86.
  assert.equal(seoReport({ findings: [f("no_title")] }).grade, "good");
  // client_rendered (30) + no_viewport (18) = 52 — «есть что поправить».
  assert.equal(seoReport({ findings: [f("client_rendered"), f("no_viewport")] }).grade, "fixable");
  // Плюс no_title и no_https — 26, уже «находят плохо».
  assert.equal(
    seoReport({ findings: [f("client_rendered"), f("no_viewport"), f("no_title"), f("no_https")] }).grade,
    "poor",
  );
});

test("что считается поисковой находкой, знают и снаружи", () => {
  // Публичная проверка убирает эти находки из общего списка: там рядом с
  // каждой стоит «что делаем», и оставить их значило бы закрыть дверь и тут
  // же открыть окно.
  assert.equal(isSeoCode("no_title"), true);
  assert.equal(isSeoCode("noindex"), true);
  assert.equal(isSeoCode("no_phone"), false);
  assert.equal(isSeoCode("no_prices"), false);
});
