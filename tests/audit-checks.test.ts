/**
 * Тесты разбора страницы.
 *
 * Проверяется не «нашлось ли слово viewport», а поведение, ради которого
 * аудитор существует: здоровый сайт не должен получать претензий, а больной —
 * должен получать именно те, что есть, и в правильном порядке важности.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyze, detectPlatform, looksLikeShop } from "@/lib/audit/checks";
import type { PageProbe } from "@/lib/audit/fetch";

function probe(over: Partial<PageProbe> = {}): PageProbe {
  return {
    finalUrl: "https://mysite.uz/",
    status: 200,
    redirects: [],
    html: `<!doctype html><html lang="ru"><head>
      <title>Мебель на заказ в Ташкенте</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="description" content="Изготовление мебели">
      <meta property="og:image" content="/og.png">
    </head><body><h1>Мебель на заказ</h1></body></html>`,
    truncated: false,
    headers: {},
    ttfbMs: 300,
    totalMs: 400,
    https: true,
    certDaysLeft: 90,
    ...over,
  };
}

test("здоровый сайт не получает выдуманных претензий", () => {
  const report = analyze(probe());
  assert.deepEqual(report.findings, []);
  assert.equal(report.score, 100);
});

test("сайт без HTTPS и без мобильной вёрстки — две критические", () => {
  const report = analyze(probe({
    https: false,
    html: "<html><head><title>Т</title></head><body><h1>Т</h1></body></html>",
  }));
  const codes = report.findings.map((f) => f.code);
  assert.ok(codes.includes("no_https"));
  assert.ok(codes.includes("no_viewport"));
  assert.ok(report.score < 50, `балл ${report.score}`);
});

test("истёкший сертификат критичнее истекающего", () => {
  const expired = analyze(probe({ certDaysLeft: -3 }));
  const soon = analyze(probe({ certDaysLeft: 5 }));
  assert.equal(expired.findings[0].severity, "critical");
  assert.equal(soon.findings[0].severity, "major");
  // Свежий сертификат претензии не порождает вовсе.
  assert.equal(analyze(probe({ certDaysLeft: 200 })).findings.length, 0);
});

test("медленный ответ измеряется, а не оценивается на глаз", () => {
  assert.equal(analyze(probe({ ttfbMs: 900 })).findings.length, 0);
  assert.equal(analyze(probe({ ttfbMs: 2000 })).findings[0].code, "slow");
  assert.equal(analyze(probe({ ttfbMs: 4000 })).findings[0].severity, "major");
});

test("ошибка сервера — самое тяжёлое, что может быть", () => {
  const report = analyze(probe({ status: 503 }));
  assert.equal(report.findings[0].code, "http_error");
  assert.equal(report.findings[0].severity, "critical");
});

test("балл не уходит ниже нуля даже когда сломано всё", () => {
  const report = analyze(probe({
    status: 500, https: false, ttfbMs: 9000, certDaysLeft: null,
    html: "<html><body>пусто</body></html>",
  }));
  assert.ok(report.score >= 0, `балл ${report.score}`);
});

test("движок опознаётся по следам в разметке", () => {
  assert.equal(detectPlatform('<link href="/wp-content/x.css">', {}), "WordPress");
  assert.equal(detectPlatform('<script src="//tildacdn.com/a.js">', {}), "Tilda");
  assert.equal(detectPlatform("<html></html>", { "x-powered-by": "Next.js" }), "Next.js");
  assert.equal(detectPlatform("<html></html>", {}), null);
});

test("магазин отличается от визитки по корзине", () => {
  assert.equal(looksLikeShop("<a>Корзина</a><button>В корзину</button>"), true);
  assert.equal(looksLikeShop("<a>Savat</a><button>Savatga qo'shish</button>"), true);
  // Слово «корзина» в тексте про мусорные корзины магазином не делает.
  assert.equal(looksLikeShop("<p>Продаём корзины плетёные</p>"), false);
});
