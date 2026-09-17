/**
 * Вёрстка и следы раннего интернета.
 *
 * Проверяется поведение, а не слова: современный сайт не получает
 * претензий к вёрстке, сайт из 2006-го получает именно те, что видны
 * посетителю, а битые картинки считаются по статусам, а не угадываются.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { analyze } from "@/lib/audit/checks";
import {
  baseFontPx,
  copyrightYear,
  designEra,
  fontFamilies,
  forcedWidthPx,
  tablesLayout,
} from "@/lib/audit/design";
import {
  broken,
  decodeEntities,
  imageUrls,
  internalLinks,
  stylesheetUrls,
  type PageAssets,
  type PageProbe,
} from "@/lib/audit/fetch";
import { pitch } from "@/lib/audit/pitch";
import { lossFor } from "@/lib/razbor/forecast";

const NOW = new Date("2026-09-16T12:00:00Z");

const MODERN = `<!doctype html><html lang="ru"><head>
  <title>Мебель на заказ в Ташкенте</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Изготовление мебели">
  <meta property="og:image" content="/og.png">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/site.css">
  <link rel="alternate" hreflang="uz" href="https://mysite.uz/uz/">
  <script type="application/ld+json">{"@type":"LocalBusiness"}</script>
  <style>.grid{display:grid}@media (max-width:600px){.grid{display:block}}</style>
</head><body><h1>Мебель на заказ</h1>
  <a href="tel:+998901234567">+998 90 123-45-67</a>
  <a href="https://t.me/mysite">Telegram</a>
  <a href="/catalog">Каталог</a>
  <img src="/kitchen.jpg" alt="Кухня">
  <p>Кухня на заказ — от 12 000 000 сум</p>
  <footer>© 2026 Мебель</footer>
</body></html>`;

const ANCIENT = `<html><head><title>Главная</title>
  <meta name="viewport" content="width=device-width, user-scalable=no">
  <script src="/js/jquery-1.4.2.min.js"></script>
</head><body onload="alert('Добро пожаловать!')" bgcolor="#ffffff">
  <marquee>Сайт в разработке! Лучше всего просматривать в Internet Explorer</marquee>
  <table width="100%"><tr><td><table><tr><td><font face="Arial">Меню</font></td><td><font>О нас</font></td><td><font>Услуги</font></td></tr></table></td></tr>
  <tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td></tr></table>
  <object type="application/x-shockwave-flash" data="/intro.swf"></object>
  <bgsound src="/music.mid">
  <a href="tel:+998901234567">+998 90 123-45-67</a>
  <a href="https://t.me/x">Telegram</a> <p>Цена от 100 000 сум</p>
  <img src="//counter.yadro.ru/hit?t1" alt="">
  <p>Ваш текст здесь</p>
  <p>Copyright 2011-2013 Компания</p>
</body></html>`;

function probe(over: Partial<PageProbe> = {}): PageProbe {
  return {
    finalUrl: "https://mysite.uz/",
    status: 200,
    redirects: [],
    html: MODERN,
    truncated: false,
    headers: {},
    ttfbMs: 300,
    totalMs: 400,
    https: true,
    certDaysLeft: 90,
    ...over,
  };
}

const assets = (over: Partial<PageAssets> = {}): PageAssets => ({
  css: ".grid{display:grid}@media (max-width:600px){.grid{display:block}}",
  cssCount: 1,
  cssTruncated: false,
  favicon: true,
  checkedImages: 0,
  brokenImages: [],
  checkedLinks: 0,
  brokenLinks: [],
  contactsHtml: null,
  contactsUrl: null,
  ...over,
});

const DESIGN_CODES = [
  "ancient_layout", "dated_layout", "no_responsive_css", "zoom_locked", "frames", "flash", "marquee",
  "visitor_counter", "under_construction", "placeholder_text", "stale_copyright", "broken_images",
  "broken_links", "ie_only", "autoplay_sound", "popup_onload", "ancient_scripts", "no_favicon",
  "tiny_text", "font_zoo", "horizontal_scroll", "wall_of_text",
];

const designFindings = (report: ReturnType<typeof analyze>) =>
  report.findings.filter((f) => DESIGN_CODES.includes(f.code));

test("современный сайт не получает претензий к вёрстке", () => {
  const report = analyze(probe({ assets: assets() }), NOW);
  assert.deepEqual(designFindings(report).map((f) => f.code), []);
  assert.equal(report.facts.design?.era, "modern");
});

test("сайт из 2006-го: каждая находка — то, что посетитель видит сам", () => {
  const report = analyze(probe({ html: ANCIENT, assets: assets({ css: "", cssCount: 0, favicon: false }) }), NOW);
  const codes = new Set(designFindings(report).map((f) => f.code));
  for (const expected of [
    "ancient_layout", "zoom_locked", "flash", "marquee", "visitor_counter", "under_construction",
    "placeholder_text", "stale_copyright", "ie_only", "autoplay_sound", "popup_onload", "ancient_scripts", "no_favicon",
  ]) {
    assert.ok(codes.has(expected), `не найдено: ${expected}`);
  }
  assert.equal(report.facts.design?.era, "ancient");
  assert.equal(report.facts.design?.tablesLayout, true);
  // Древний сайт получает «древнюю» находку, а не обе сразу.
  assert.ok(!codes.has("dated_layout"));
  // Подвал: берётся поздний год из диапазона, а не первый.
  const footer = report.findings.find((f) => f.code === "stale_copyright")!;
  assert.match(footer.title, /2013/);
  assert.match(footer.impact, /13 лет/);
});

test("устаревшая вёрстка: флоаты без правил под телефон", () => {
  const html = MODERN.replace(/<style>[\s\S]*?<\/style>/, "");
  const css = ".col{float:left;width:33%}.col2{float:left}.col3{float:right}";
  const report = analyze(probe({ html, assets: assets({ css }) }), NOW);
  const codes = designFindings(report).map((f) => f.code);
  assert.ok(codes.includes("dated_layout"), codes.join());
  assert.ok(codes.includes("no_responsive_css"), codes.join());
  assert.equal(report.facts.design?.era, "dated");
});

test("о вёрстке не судим, если стилей не читали", () => {
  const html = MODERN.replace(/<style>[\s\S]*?<\/style>/, "");
  const report = analyze(probe({ html }), NOW);
  const codes = designFindings(report).map((f) => f.code);
  assert.ok(!codes.includes("dated_layout"), "без стилей вёрстка объявлена устаревшей");
  assert.ok(!codes.includes("no_responsive_css"));
  assert.equal(report.facts.design?.era, "unknown");
});

test("битые картинки и ссылки считаются по статусам, с числом в заголовке", () => {
  const report = analyze(
    probe({
      assets: assets({
        checkedImages: 6,
        brokenImages: ["https://mysite.uz/a.jpg", "https://mysite.uz/b.jpg"],
        checkedLinks: 5,
        brokenLinks: ["https://mysite.uz/uslugi"],
      }),
    }),
    NOW,
  );
  const images = report.findings.find((f) => f.code === "broken_images")!;
  const links = report.findings.find((f) => f.code === "broken_links")!;
  assert.equal(images.title, "2 картинки на главной не открываются");
  assert.match(images.impact, /Из первых 6 проверенных 2/);
  assert.equal(links.title, "1 ссылка с главной ведёт на несуществующие страницы");
  assert.equal(images.severity, "major");
});

test("видео без звука на фоне — не автозапуск звука", () => {
  const muted = MODERN.replace("<h1>", '<video autoplay muted loop src="/bg.mp4"></video><h1>');
  assert.ok(!analyze(probe({ html: muted, assets: assets() }), NOW).findings.some((f) => f.code === "autoplay_sound"));
  const loud = MODERN.replace("<h1>", '<video autoplay src="/bg.mp4"></video><h1>');
  assert.ok(analyze(probe({ html: loud, assets: assets() }), NOW).findings.some((f) => f.code === "autoplay_sound"));
});

test("подвал: год считается от переданного «сегодня», а не от часов машины", () => {
  const html = MODERN.replace("© 2026", "© 2024");
  assert.ok(!analyze(probe({ html, assets: assets() }), NOW).findings.some((f) => f.code === "stale_copyright"));
  assert.ok(analyze(probe({ html, assets: assets() }), new Date("2027-01-01")).findings.some((f) => f.code === "stale_copyright"));
  assert.equal(copyrightYear("© 2010–2015 Фирма"), 2015);
  assert.equal(copyrightYear("Copyright (c) 2019"), 2019);
  assert.equal(copyrightYear("без года"), null);
});

test("таблица данных внутри текста — не каркас из таблиц", () => {
  const withTable = MODERN.replace(
    "<p>Кухня",
    "<div><div><div><div><table><tr><td>Кухня</td><td>12 000 000</td></tr></table></div></div></div></div><p>Кухня",
  );
  assert.equal(tablesLayout(withTable), false);
  assert.equal(tablesLayout(ANCIENT), true);
});

test("эпоха по стилям: флексы и правила под телефон — современный", () => {
  assert.equal(designEra("<html></html>", ".a{display:flex}@media(max-width:600px){}", true).era, "modern");
  assert.equal(designEra("<html></html>", ".a{float:left}.b{float:left}.c{float:right}", true).era, "dated");
  assert.equal(designEra("<html></html>", "", false).era, "unknown");
  assert.equal(designEra("<html><frameset></frameset></html>", "", false).era, "ancient");
});

test("дотягиваем только своё: чужие хосты, данные и файлы не трогаем", () => {
  const base = new URL("https://mysite.uz/page/");
  const html = `
    <link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="https://cdn.other.com/b.css">
    <link rel="stylesheet" href="b.css"><link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="/c.css">
    <img src="/1.png"><img src="data:image/png;base64,xxx"><img src="https://mysite.uz/2.png"><img src="//evil.com/3.png">
    <a href="/uslugi"><a href="#top"><a href="mailto:a@b.c"><a href="/price.pdf"><a href="https://mysite.uz/page/"><a href="/kontakty#map">`;
  assert.deepEqual(stylesheetUrls(html, base).map((u) => u.href), ["https://mysite.uz/a.css", "https://mysite.uz/page/b.css"]);
  assert.deepEqual(imageUrls(html, base).map((u) => u.href), ["https://mysite.uz/1.png", "https://mysite.uz/2.png"]);
  assert.deepEqual(internalLinks(html, base).map((u) => u.href), ["https://mysite.uz/uslugi", "https://mysite.uz/kontakty"]);
});

test("у каждой новой находки есть заход на обоих языках и цена в прогнозе", () => {
  const report = analyze(
    probe({
      html: ANCIENT.replace("<table width", '<frameset><frame src="/a"></frameset><table width'),
      assets: assets({ css: "", cssCount: 0, favicon: false, checkedImages: 2, brokenImages: ["https://mysite.uz/x.jpg"], checkedLinks: 2, brokenLinks: ["https://mysite.uz/y"] }),
    }),
    NOW,
  );
  const dated = analyze(
    probe({ html: MODERN.replace(/<style>[\s\S]*?<\/style>/, ""), assets: assets({ css: ".a{float:left}.b{float:left}.c{float:left}" }) }),
    NOW,
  );
  const ugly = analyze(probe({ html: UGLY, assets: assets({ css: UGLY_CSS }) }), NOW);
  const all = [...designFindings(report), ...designFindings(dated), ...designFindings(ugly)];
  const seen = new Set(all.map((f) => f.code));
  for (const code of DESIGN_CODES) assert.ok(seen.has(code), `находка ${code} не воспроизведена`);

  for (const f of all) {
    const single = { ...report, findings: [f] };
    for (const locale of ["ru", "en"] as const) {
      const draft = pitch(single, "Компания", locale, "Данил");
      assert.ok(draft.ok, `${f.code}: нет захода (${locale})`);
      assert.ok(draft.text.length > 200, `${f.code}: заход короткий (${locale})`);
    }
    assert.ok(lossFor(f.code), `${f.code}: нет полосы потерь в прогнозе`);

    assert.ok(f.impact.length > 60, `${f.code}: последствие в одну фразу`);
    assert.ok(f.fix.length > 40, `${f.code}: «что делаем» не написано`);
    const text = `${f.title} ${f.impact} ${f.fix}`.toLowerCase();
    for (const leak of ["meta", "viewport", "og:", "h1", "ttfb", "ssl", "tls", "http", "dns", "seo", "css", "html", "alt=", "schema"]) {
      assert.ok(!text.includes(leak), `в находке ${f.code} жаргон «${leak}»`);
    }
  }
});

test("подвал: из нескольких знаков копирайта берётся поздний год", () => {
  assert.equal(copyrightYear("© 2011 Фирма. Дизайн © 2019 Студия"), 2019);
  assert.equal(copyrightYear("Дизайн © 2019 Студия. © 2011 Фирма"), 2019);
});

test("заглушки и «в разработке» ищутся в тексте страницы, а не в скриптах", () => {
  const html = MODERN.replace("<h1>", '<script>var s="сайт в разработке"; var t="lorem ipsum";</script><!-- ваш текст здесь --><h1>');
  const codes = analyze(probe({ html, assets: assets() }), NOW).findings.map((f) => f.code);
  assert.ok(!codes.includes("under_construction"), codes.join());
  assert.ok(!codes.includes("placeholder_text"), codes.join());
});

test("на странице ошибки о вёрстке, картинках и значке не судим", () => {
  const report = analyze(
    probe({ status: 503, html: "<html><body><table><tr><td>Service Unavailable</td></tr></table></body></html>", assets: assets({ favicon: false, brokenImages: ["https://mysite.uz/x.png"], checkedImages: 1 }) }),
    NOW,
  );
  assert.deepEqual(designFindings(report).map((f) => f.code), []);
  assert.equal(report.facts.design?.era, "unknown");
});

test("сущности разметки в адресах раскодируются, иначе картинки ложно битые", () => {
  const base = new URL("https://mysite.uz/");
  const html = '<img src="/_next/image?url=%2Flogo.png&amp;w=640&amp;q=75"><a href="/page?a=1&amp;b=2">x</a>';
  assert.deepEqual(imageUrls(html, base).map((u) => u.href), ["https://mysite.uz/_next/image?url=%2Flogo.png&w=640&q=75"]);
  assert.deepEqual(internalLinks(html, base).map((u) => u.href), ["https://mysite.uz/page?a=1&b=2"]);
  assert.equal(decodeEntities("a &amp; b &quot;c&quot; &#39;d&#39; &#x2F; &#47;"), "a & b \"c\" 'd' / /");
});

test("битый — это 404, 410 и падение сервера; 403 роботу — не битый", () => {
  assert.equal(broken(404), true);
  assert.equal(broken(410), true);
  assert.equal(broken(500), true);
  assert.equal(broken(503), true);
  assert.equal(broken(403), false);
  assert.equal(broken(401), false);
  assert.equal(broken(200), false);
  assert.equal(broken(null), false);
});

/* ── Глазами дизайнера ─────────────────────────────────────────────────── */

// Мелкий текст, зоопарк шрифтов, жёсткая ширина и стена текста — всё то,
// что видно глазами, а не инструментами.
const UGLY_CSS = `
  html{font-size:16px}
  body{font-size:11px;font-family:"PT Sans",sans-serif;min-width:1200px}
  h1{font-family:Georgia,serif}
  .promo{font-family:"Comic Sans MS",cursive}
  .note{font-family:Tahoma,sans-serif}
  .icon{font-family:FontAwesome}
  .grid{display:grid}
  @media (max-width:600px){.grid{display:block}}
`;

const UGLY = MODERN.replace(
  "<p>Кухня на заказ — от 12 000 000 сум</p>",
  `<p>${"Мы работаем на рынке мебели много лет и делаем кухни, шкафы, гардеробные и мебель для гостиных под заказ по вашим размерам. ".repeat(20)}</p>`,
).replace(/<style>[\s\S]*?<\/style>/, "");

test("глазами дизайнера: мелкий текст, зоопарк шрифтов, ширина под монитор, стена текста", () => {
  const codes = designFindings(analyze(probe({ html: UGLY, assets: assets({ css: UGLY_CSS }) }), NOW)).map((f) => f.code);
  for (const expected of ["tiny_text", "font_zoo", "horizontal_scroll", "wall_of_text"]) {
    assert.ok(codes.includes(expected), `не найдено: ${expected} (есть: ${codes.join(", ")})`);
  }
  // Современный образец ничего из этого не получает.
  assert.deepEqual(
    designFindings(analyze(probe({ assets: assets() }), NOW)).map((f) => f.code),
    [],
  );
});

test("размер текста берётся из правила для body, иконочные шрифты за шрифты не считаются", () => {
  assert.equal(baseFontPx("html{font-size:16px}body{font-size:12px}"), 12);
  assert.equal(baseFontPx("body,html{font-size:13px}"), 13);
  assert.equal(baseFontPx(".intro{font-size:11px}"), null, "правило не для body");
  assert.equal(baseFontPx("body{font-size:90%}"), null, "проценты не переводим в пиксели");
  // Последнее правило побеждает — как в браузере.
  assert.equal(baseFontPx("body{font-size:11px}body{font-size:16px}"), 16);

  assert.deepEqual(fontFamilies('a{font-family:"PT Sans",sans-serif}b{font-family:Georgia}'), ["pt sans", "georgia"]);
  assert.deepEqual(fontFamilies("i{font-family:FontAwesome}s{font-family:inherit}p{font-family:serif}"), []);
});

test("жёсткая ширина: под монитор — находка, защита от узких экранов — нет", () => {
  assert.equal(forcedWidthPx("", "body{min-width:1200px}"), 1200);
  assert.equal(forcedWidthPx("", ".container{min-width:980px}"), 980);
  assert.equal(forcedWidthPx("", "body{min-width:320px}"), null, "320 — это не макет под монитор");
  assert.equal(forcedWidthPx("", ".badge{min-width:1000px}"), null, "случайный блок — не макет");
  assert.equal(forcedWidthPx('<body style="min-width:1024px">', ""), 1024);
});
