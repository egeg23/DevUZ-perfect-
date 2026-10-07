/**
 * Макеты — без длинных тире и без штампов ИИ-текста (lib/proto/plain-text).
 *
 * Владелец, 07.10.2026: «Запиши правило — никаких длинных тире в макетах и
 * маркеров ИИ текста!». Проверяется каждая страница каждой сборки из
 * content/proto-bundles и шаблон прототипа из панели.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PROTO_NICHES } from "@/content/proto/models";
import { bundlePages, BUNDLE_NAMES } from "@/lib/proto/bundles";
import { emptyFacts } from "@/lib/proto/facts";
import { buildProto } from "@/lib/proto/render";
import {
  aiMarkers,
  dashInCode,
  dashSpots,
  pageProblems,
  readableText,
  withoutDashes,
} from "@/lib/proto/plain-text";

test("штампы ловятся: тире, «не просто …, а …», «погрузитесь в мир», dunyosiga, seamless", () => {
  assert.equal(dashSpots("Ташкент — столица").length, 1);
  assert.equal(dashSpots("Ташкент - столица").length, 1, "тире дефисом — тоже тире");
  assert.equal(dashSpots("Пн-Пт 9:00-18:00, Toshkent-City").length, 0, "дефис в слове и в промежутке — не тире");
  assert.deepEqual(aiMarkers("Не просто клиника, а пространство заботы"), ["«не просто …, а …»"]);
  assert.ok(aiMarkers("Погрузитесь в мир красоты").length >= 1);
  assert.ok(aiMarkers("Go‘zallik dunyosiga xush kelibsiz").length === 1);
  assert.ok(aiMarkers("A seamless experience").length === 1);
  assert.deepEqual(aiMarkers("Запишитесь на чистку зубов, перезвоним за 15 минут"), []);
});

test("слова самой компании — её слова: штамп из фактов не считается", () => {
  assert.deepEqual(aiMarkers("Индивидуальный подход к каждому", "Наш девиз: индивидуальный подход к каждому"), []);
  assert.equal(aiMarkers("Индивидуальный подход к каждому", "Лечение кариеса").length, 1);
});

test("тире в фактах компании чинится без потери смысла", () => {
  assert.equal(withoutDashes("Пн–Пт 9:00 – 18:00"), "Пн-Пт 9:00-18:00");
  assert.equal(withoutDashes("Протезирование зубов - Ортопедическая стоматология"), "Протезирование зубов, Ортопедическая стоматология");
  assert.equal(withoutDashes("— Чистка зубов"), "Чистка зубов");
});

test("текст страницы — вместе с подписями, заголовком вкладки и строками скриптов, без кода", () => {
  const html = `<html><head><title>Клиника · запись</title><meta name="description" content="Запись онлайн"><style>.a{width:calc(100% - 20px)}</style></head>
<body><img alt="Врач на приёме"><script>const t = "Выберите время"; const w = a - b; /* тире — в комментарии */</script><p>Текст</p></body></html>`;
  const text = readableText(html);
  for (const part of ["Клиника · запись", "Запись онлайн", "Врач на приёме", "Выберите время", "Текст"]) assert.ok(text.includes(part), part);
  assert.equal(dashSpots(text).length, 0, "вычитание в стилях и в скрипте — не тире");
  assert.equal(dashInCode(html), false, "тире в комментарии клиент не читает");
  assert.equal(dashInCode('<style>.q::before{content:"—"}</style>'), true, "тире, нарисованное стилем, — на экране");
  assert.equal(pageProblems("<p>Сайт&nbsp;&mdash; это</p>")[0]?.code, "dash", "тире сущностью");
});

test("макет из панели: шаблон каждой ниши на обоих языках — без тире и штампов, тире компании чинится", () => {
  for (const niche of PROTO_NICHES) {
    for (const locale of ["ru", "uz"] as const) {
      for (const contact of [{ telegram: "@demo_uz" }, { phone: "+998901234567" }]) {
        const build = buildProto({
          ...emptyFacts("Demo — Studio", niche.key, "demo.uz"),
          locale,
          ...contact,
          hours: "Пн–Сб 9:00–19:00",
          services: [{ name: "Чистка — гигиена" }, { name: "Лечение" }, { name: "Диагностика", price: "100 000 – 150 000 сум" }],
        });
        assert.ok(build && build.html, `${niche.key}/${locale}: не собрался`);
        const plain = build.problems.filter((p) => p.code === "dash" || p.code === "ai");
        assert.deepEqual(plain, [], `${niche.key}/${locale}`);
        assert.ok(build.html.includes("Demo, Studio"), "название компании без тире");
      }
    }
  }
});

for (const name of BUNDLE_NAMES) {
  test(`${name}: ни на одной странице нет длинных тире и штампов ИИ-текста`, () => {
    const site = bundlePages(name);
    assert.ok(site);
    const all: Record<string, string> = { "": site.html, ...site.pages };
    const bad: string[] = [];
    for (const [path, page] of Object.entries(all)) {
      if (!/<html|<body|<div|<p\b/i.test(page)) continue; // манифест, service worker
      for (const problem of pageProblems(page)) bad.push(`/${path}: ${problem.text}`);
    }
    assert.deepEqual(bad, []);
  });
}
