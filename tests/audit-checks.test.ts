/**
 * Тесты разбора страницы.
 *
 * Проверяется не «нашлось ли слово viewport», а поведение, ради которого
 * аудитор существует: здоровый сайт не должен получать претензий, а больной —
 * должен получать именно те, что есть, и в правильном порядке важности.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyze, detectPlatform, looksLikeShop, unreachable } from "@/lib/audit/checks";
import type { PageProbe } from "@/lib/audit/fetch";

function probe(over: Partial<PageProbe> = {}): PageProbe {
  return {
    finalUrl: "https://mysite.uz/",
    status: 200,
    redirects: [],
    // Здоровый сайт — не «страница без ошибок разметки», а такой, с которого
    // клиент может позвонить, написать и узнать цену. Поэтому в образце есть
    // всё это: иначе половина проверок молча ругалась бы на эталон.
    html: `<!doctype html><html lang="ru"><head>
      <title>Мебель на заказ в Ташкенте</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="description" content="Изготовление мебели">
      <meta property="og:image" content="/og.png">
      <link rel="alternate" hreflang="uz" href="https://mysite.uz/uz/">
      <script type="application/ld+json">{"@type":"LocalBusiness"}</script>
    </head><body><h1>Мебель на заказ</h1>
      <a href="tel:+998901234567">+998 90 123-45-67</a>
      <a href="https://t.me/mysite">Telegram</a>
      <p>Кухня на заказ — от 12 000 000 сум</p>
    </body></html>`,
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

/**
 * У каждой находки три части — что не так, чем оборачивается, что делаем, —
 * и все три на языке владельца бизнеса. Слова из головы разработчика в
 * находку не попадают: их адресат не поймёт, а значит, и не исправит.
 */
test("у каждой находки есть последствие и «что делаем», без жаргона", () => {
  const broken = analyze(probe({
    status: 500, https: false, ttfbMs: 4000, certDaysLeft: null,
    html: "<html><body>пусто</body></html>",
  }));
  const cert = analyze(probe({ certDaysLeft: 5 }));
  const all = [...broken.findings, ...cert.findings, ...unreachable("https://x.uz/", "домен не найден").findings];

  const codes = new Set(all.map((f) => f.code));
  for (const expected of ["http_error", "no_https", "no_viewport", "slow", "no_title", "no_description", "no_og", "no_h1", "cert_expiring", "unreachable"]) {
    assert.ok(codes.has(expected), `не покрыта находка ${expected}`);
  }

  for (const f of all) {
    assert.ok(f.title.length > 10, `${f.code}: заголовок пустой`);
    assert.ok(f.impact.length > 60, `${f.code}: последствие в одну фразу`);
    assert.ok(f.fix.length > 40, `${f.code}: «что делаем» не написано`);

    const text = `${f.title} ${f.impact} ${f.fix}`.toLowerCase();
    for (const leak of ["meta", "viewport", "og:", "h1", "ttfb", "ssl", "tls", "http", "dns", "seo"]) {
      assert.ok(!text.includes(leak), `в находке ${f.code} жаргон «${leak}»`);
    }
    for (const promise of ["в топ", "гарантируем", "первое место", "% продаж"]) {
      assert.ok(!text.includes(promise), `в находке ${f.code} обещание «${promise}»`);
    }
  }
});

test("причина недоступности попадает в находку словами, а не кодом", () => {
  const [finding] = unreachable("https://x.uz/", "домен не найден").findings;
  assert.equal(finding.severity, "critical");
  assert.ok(finding.impact.includes("домен не найден"));
  assert.ok(!finding.impact.includes("ENOTFOUND"));
});

/* ── Путь клиента ───────────────────────────────────────────────────────────
 *
 * Эти проверки появились после того, как двадцать пять живых сайтов подряд
 * получили вердикт «разбирать нечего». HTTPS, мобильная вёрстка и заголовок
 * сегодня есть у всех — а дозвониться, написать и узнать цену можно далеко
 * не везде. Аудит, который этого не видит, хвалит сайт, теряющий клиентов.
 */

/** Страница без единого способа связаться и без цен. */
const mute = `<!doctype html><html lang="ru"><head>
  <title>Мебель</title>
  <meta name="viewport" content="width=device-width">
  <meta name="description" content="Мебель">
  <meta property="og:image" content="/og.png">
  <link rel="alternate" hreflang="uz" href="/uz/">
  <script type="application/ld+json">{"@type":"LocalBusiness"}</script>
</head><body><h1>Мебель</h1></body></html>`;

test("сайт, с которого нельзя позвонить, — это критическая находка", () => {
  const codes = analyze(probe({ html: mute })).findings.map((f) => f.code);
  assert.ok(codes.includes("no_phone"));
  assert.equal(
    analyze(probe({ html: mute })).findings.find((f) => f.code === "no_phone")?.severity,
    "critical",
  );
});

test("номер текстом — это отдельная находка, а не отсутствие номера", () => {
  // Номер есть, нажать нельзя. Претензия должна смениться, а не исчезнуть.
  const withText = mute.replace("<h1>Мебель</h1>", "<h1>Мебель</h1><p>+998 90 123-45-67</p>");
  const codes = analyze(probe({ html: withText })).findings.map((f) => f.code);
  assert.ok(!codes.includes("no_phone"), "номер не увиден");
  assert.ok(codes.includes("phone_not_clickable"));
});

test("отсутствие мессенджера и цен замечается по отдельности", () => {
  const codes = analyze(probe({ html: mute })).findings.map((f) => f.code);
  assert.ok(codes.includes("no_messenger"));
  assert.ok(codes.includes("no_prices"));

  const priced = mute.replace("<h1>Мебель</h1>", "<h1>Мебель</h1><p>Кухня от 9 500 000 сум</p>");
  assert.ok(!analyze(probe({ html: priced })).findings.some((f) => f.code === "no_prices"));

  // Узбекская запись цены и доллары читаются так же.
  for (const price of ["12 000 000 so'm", "$450", "3 200 000 сўм"]) {
    const html = mute.replace("<h1>Мебель</h1>", `<h1>Мебель</h1><p>${price}</p>`);
    assert.ok(
      !analyze(probe({ html })).findings.some((f) => f.code === "no_prices"),
      `цена «${price}» не распознана`,
    );
  }
});

test("на обрезанной странице про цены не судим", () => {
  // До цены мы могли просто не дочитать: 512 КБ кончились раньше.
  const codes = analyze(probe({ html: mute, truncated: true })).findings.map((f) => f.code);
  assert.ok(!codes.includes("no_prices"), "претензия по обрезанному HTML");
  assert.ok(codes.includes("no_phone"), "остальные проверки должны работать");
});

test("ссылка наружу по незащищённому адресу — не смешанный контент", () => {
  // Регрессия. Первая версия проверки ловила <a href="http://t.me/…"> и
  // выдавала салону красоты претензию на ровном месте: браузер такую ссылку
  // не загружает, он по ней переходит.
  const link = mute.replace("<h1>Мебель</h1>", '<h1>Мебель</h1><a href="http://t.me/shop">Telegram</a>');
  assert.ok(!analyze(probe({ html: link })).findings.some((f) => f.code === "mixed_content"));

  // А вот картинка по незащищённому адресу — именно он.
  const img = mute.replace("<h1>Мебель</h1>", '<h1>Мебель</h1><img src="http://cdn.uz/a.jpg" alt="а">');
  assert.ok(analyze(probe({ html: img })).findings.some((f) => f.code === "mixed_content"));
});

test("картинки без подписей считаются, а не угадываются", () => {
  const imgs = (n: number, withAlt: number) =>
    Array.from({ length: n }, (_, i) =>
      i < withAlt ? `<img src="/${i}.jpg" alt="кухня ${i}">` : `<img src="/${i}.jpg">`,
    ).join("");

  // Четыре картинки — ещё не система, претензии нет даже без подписей.
  assert.ok(!analyze(probe({ html: mute.replace("</body>", imgs(4, 0) + "</body>") }))
    .findings.some((f) => f.code === "img_no_alt"));

  // Десять, из них подписаны шесть — большинство в порядке, молчим.
  assert.ok(!analyze(probe({ html: mute.replace("</body>", imgs(10, 6) + "</body>") }))
    .findings.some((f) => f.code === "img_no_alt"));

  const bad = analyze(probe({ html: mute.replace("</body>", imgs(10, 2) + "</body>") }))
    .findings.find((f) => f.code === "img_no_alt");
  assert.ok(bad, "восемь неподписанных из десяти прошли молча");
  assert.match(bad.title, /8 картинок из 10/);
});

test("новые находки говорят на языке владельца, а не разработчика", () => {
  // `mute` несёт разметку организации и связку языков, поэтому эти две
  // находки берём с голой страницы — иначе они бы молчали, и тест
  // проверял бы три текста вместо пяти, ничего об этом не сообщая.
  const bare = mute
    .replace(/<link rel="alternate"[^>]*>/, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  const fresh = analyze(probe({ html: bare })).findings.filter((f) =>
    ["no_phone", "no_messenger", "no_prices", "no_schema", "one_language"].includes(f.code),
  );
  assert.equal(fresh.length, 5, "часть новых находок не сработала");

  for (const f of fresh) {
    assert.ok(f.impact.length > 60, `${f.code}: последствие в одну фразу`);
    assert.ok(f.fix.length > 40, `${f.code}: «что делаем» не написано`);
    const text = `${f.title} ${f.impact} ${f.fix}`.toLowerCase();
    for (const leak of ["schema", "alt", "hreflang", "ld+json", "meta", "seo", "http"]) {
      assert.ok(!text.includes(leak), `в находке ${f.code} жаргон «${leak}»`);
    }
  }
});
