/**
 * Что аудит видит и о чём он поэтому имеет право говорить.
 *
 * Тест написан по живому случаю. Разбор akbar-rich.uz выдал владельцу письмо,
 * начинавшееся словами «на сайте не видно телефона», — а номер стоял у него в
 * шапке крупными цифрами, и кнопка «Связаться с нами» рядом. Опровергнуть это
 * адресат мог за секунду, просто взглянув на свой сайт.
 *
 * Регулярка была ни при чём. Сервер отдаёт двадцать килобайт разметки с
 * девятью словами видимого текста: всё остальное собирает браузер. Аудит
 * честно ничего не нашёл — и выдал это за свойство сайта.
 *
 * Здесь проверяется разделение, которое это чинит: «на сайте нет X» и «мы не
 * смогли увидеть X» — разные утверждения, и второе нельзя произносить первым.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyze, robotsBlocksAll } from "@/lib/audit/checks";
import { extractContacts } from "@/lib/audit/contacts";
import type { PageProbe } from "@/lib/audit/fetch";
import { whatWeSee } from "@/lib/audit/visible";

/** Оболочка SPA: много разметки, девять слов, данные в json. */
const SHELL = `<!doctype html><html lang="ru"><head>
  <title>Sifatli Eshiklar | Premium MDF Eshiklar | Akbar Rich</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Eshiklar">
  <meta property="og:image" content="/og.png">
  <link rel="canonical" href="https://doors.uz/">
  <script type="application/ld+json">${JSON.stringify({
    "@type": "LocalBusiness",
    name: "Akbar Rich",
    telephone: "+998 97 344 24 17",
    email: "akbar-rich@mail.ru",
    sameAs: ["https://t.me/akbarrich"],
  })}</script>
  <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { title: "Двери желаемого размера" } },
  })}</script>
</head><body><div id="__next"></div>
  <script src="/_next/static/chunks/main.js"></script>
  <script>${"/* ".padEnd(9000, "x")} */"}</script>
</body></html>`;

function probe(over: Partial<PageProbe> = {}): PageProbe {
  return {
    finalUrl: "https://doors.uz/",
    status: 200,
    redirects: [],
    html: SHELL,
    truncated: false,
    headers: {},
    ttfbMs: 300,
    totalMs: 400,
    https: true,
    certDaysLeft: 90,
    ...over,
  };
}

test("оболочка, которую собирает браузер, распознаётся по словам и по следу движка", () => {
  const seen = whatWeSee(SHELL);
  assert.equal(seen.clientRendered, true);
  assert.equal(seen.framework, "Next.js");
  assert.ok(seen.words < 30, `видимых слов ${seen.words}`);
});

test("короткая честная страница оболочкой не считается", () => {
  // Визитка на один экран: слов тоже мало, но и разметки мало, и скриптов
  // нет. Спутать её с пустой оболочкой — значит объявить «поисковик вас не
  // видит» тому, у кого всё в порядке.
  const card = `<!doctype html><html><body><h1>Ремонт обуви</h1>
    <p>Улица Навои 12, с 9 до 19. Телефон +998 90 123 45 67.</p></body></html>`;
  assert.equal(whatWeSee(card).clientRendered, false);
});

test("телефон из разметки для поисковика — это найденный телефон", () => {
  // Компания кладёт номер в ld+json намеренно и в чистом виде: это самый
  // надёжный источник контактов на современном сайте, и выбрасывать его
  // вместе со скриптами было дороже всего.
  const contacts = extractContacts(SHELL);
  assert.deepEqual(contacts.phones, ["+998973442417"]);
  assert.deepEqual(contacts.emails, ["akbar-rich@mail.ru"]);
  assert.deepEqual(contacts.telegram, ["@akbarrich"]);
});

test("на оболочке аудит не утверждает, что на сайте нет телефона, цен и заголовка", () => {
  const codes = analyze(probe()).findings.map((f) => f.code);

  // Именно эти четыре находки и ушли владельцу как претензии. Ни одной из
  // них мы доказать не можем: содержимое до нас не доехало.
  for (const code of ["no_phone", "no_messenger", "no_prices", "no_h1"]) {
    assert.ok(!codes.includes(code), `${code} утверждать нельзя — содержимого мы не видели`);
  }

  // Вместо них — то, что проверяется: сколько слов получил поисковик.
  assert.ok(codes.includes("client_rendered"));
});

test("находка про оболочку называет число и проверяется владельцем за минуту", () => {
  const found = analyze(probe()).findings.find((f) => f.code === "client_rendered");
  assert.ok(found);
  assert.match(found.title, /\d+ слов/, "в заголовке должно стоять измеренное число");
  assert.match(found.impact, /кода? страницы/i, "владелец должен знать, где это увидеть самому");
  // Движок назван: правка — это настройка того, что уже стоит, а не переделка.
  assert.match(found.fix, /Next\.js/);
});

test("обычная страница претензии про оболочку не получает", () => {
  const full = `<!doctype html><html lang="ru"><head><title>Двери</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="canonical" href="https://doors.uz/"></head><body>
    <h1>Двери на заказ</h1><p>${"Слово ".repeat(200)}</p>
    <a href="tel:+998901234567">+998 90 123 45 67</a></body></html>`;
  const codes = analyze(probe({ html: full })).findings.map((f) => f.code);
  assert.ok(!codes.includes("client_rendered"));
});

test("robots.txt: запрет всего сайта — находка, запрет чужому роботу — нет", () => {
  assert.equal(robotsBlocksAll("User-agent: *\nDisallow: /"), true);
  assert.equal(robotsBlocksAll("User-agent: *\nAllow: /"), false);
  // Правило для отдельного робота к видимости в Google отношения не имеет.
  assert.equal(robotsBlocksAll("User-agent: SemrushBot\nDisallow: /"), false);
  // Запрет разделов — это не запрет сайта.
  assert.equal(robotsBlocksAll("User-agent: *\nDisallow: /admin\nDisallow: /cart"), false);
  // Комментарии не мешают, и «можно всё» после запрета его снимает.
  assert.equal(robotsBlocksAll("# закрыли на ремонт\nUser-agent: *\nDisallow: /\nAllow: /"), false);
});

test("про карту сайта и robots.txt молчим, пока их не спросили", () => {
  // Отчёт, снятый до появления проверки, их не несёт. Находка «карты сайта
  // нет» на таком отчёте была бы выдумкой о сайте, которого мы в этой части
  // не смотрели.
  const codes = analyze(probe()).findings.map((f) => f.code);
  assert.ok(!codes.includes("no_sitemap"));
  assert.ok(!codes.includes("no_robots"));

  const asked = analyze(
    probe({
      assets: {
        css: "",
        cssCount: 0,
        cssTruncated: false,
        favicon: true,
        checkedImages: 0,
        brokenImages: [],
        checkedLinks: 0,
        brokenLinks: [],
        contactsHtml: null,
        contactsUrl: null,
        robots: null,
        sitemap: false,
      },
    }),
  ).findings.map((f) => f.code);
  assert.ok(asked.includes("no_sitemap"));
  assert.ok(asked.includes("no_robots"));
});

test("прямой запрет индексации — находка первой величины", () => {
  const noindex = analyze(
    probe({ html: SHELL.replace("<title>", '<meta name="robots" content="noindex,nofollow"><title>') }),
  ).findings.find((f) => f.code === "noindex");
  assert.ok(noindex);
  assert.equal(noindex.severity, "critical");

  // Тот же запрет заголовком ответа — его ставят на сервере и о нём забывают
  // ещё чаще, потому что в коде страницы его не видно.
  const header = analyze(probe({ headers: { "x-robots-tag": "noindex" } })).findings.map((f) => f.code);
  assert.ok(header.includes("noindex"));
});

test("страница ошибки разбирается как ошибка, а не как сайт", () => {
  // apex.uz отдавал 503, и аудит разобрал заглушку хостинга как главную:
  // тринадцать находок, из них двенадцать — к странице «сервис недоступен».
  const down = analyze(probe({ status: 503, html: "<html><body>Service Unavailable</body></html>" }));
  const codes = down.findings.map((f) => f.code);

  assert.deepEqual(codes, ["http_error"]);

  // И балл при этом ноль, а не 75. Одна находка по общей формуле дала бы
  // «почти всё в порядке» напротив сайта, который не открывается вовсе.
  assert.equal(down.score, 0);
});

test("маленькая оболочка Vite — тоже оболочка: пустой div и внешний скрипт", () => {
  // it-academy.uz, 05.10.2026: 1,5 КБ разметки, весь код — во внешнем
  // файле. Аудит решил, что это обычная страница, и написал владельцу «нет
  // телефона, нет Telegram, нет цены» — а всё это на сайте есть.
  const vite = `<!doctype html><html lang="ru"><head><meta charset="UTF-8" />
    <title>Онлайн IT курсы в Узбекистане – Программирование, Дизайн, Data Science</title>
    <script>!function(f,b,e){f.fbq=f.fbq||function(){}}(window,document,"script");fbq("init","1");</script>
    <script type="module" crossorigin src="/assets/index-GCzPPmey.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Bkn03CcN.css"></head>
    <body><noscript><img height="1" width="1" src="https://www.facebook.com/tr?id=1&ev=PageView&noscript=1"/></noscript>
    <div id="root"></div></body></html>`;
  assert.ok(Buffer.byteLength(vite) < 2000, "оболочка меньше старого порога");
  const seen = whatWeSee(vite);
  assert.equal(seen.clientRendered, true);
  assert.equal(seen.framework, "Vite");

  // Про содержимое такой страницы аудит не утверждает ничего.
  const codes = analyze(probe({ html: vite, finalUrl: "https://it-academy.uz/" })).findings.map((f) => f.code);
  for (const lie of ["no_phone", "no_messenger", "no_prices", "no_h1"]) {
    assert.ok(!codes.includes(lie), `ложная находка ${lie} на оболочке`);
  }
  assert.ok(codes.includes("client_rendered"), "вместо них — что поисковик видит пустую страницу");

  // Визитка с пустым div, но со своим текстом — не оболочка: текст есть.
  const card = `<!doctype html><html><body><h1>Ремонт обуви</h1><div id="app"></div>
    <p>${"Улица Навои 12, с 9 до 19, телефон +998 90 123 45 67. ".repeat(12)}</p>
    <script src="/widget.js"></script></body></html>`;
  assert.equal(whatWeSee(card).clientRendered, false);
});

test("robots.txt, на который сервер отдаёт страницу, — это отсутствие robots.txt", async () => {
  const { robotsText } = await import("@/lib/audit/fetch");
  assert.equal(robotsText(200, "<!doctype html>\n<html lang=\"ru\"><div id=\"root\"></div></html>"), null);
  assert.equal(robotsText(200, "  <html><body>404</body></html>"), null);
  assert.equal(robotsText(404, "User-agent: *"), null);
  assert.equal(robotsText(200, "User-agent: *\nDisallow: /admin\nSitemap: https://a.uz/sitemap.xml"), "User-agent: *\nDisallow: /admin\nSitemap: https://a.uz/sitemap.xml");
});
