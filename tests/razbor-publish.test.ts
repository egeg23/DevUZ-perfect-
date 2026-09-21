import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { EVIDENCE_RULES, evidenceFor, shootableCodes } from "@/lib/razbor/evidence";
import { shotUrl, toItem } from "@/lib/razbor/store";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Кнопка «Опубликовать» и то, что она обещает.
 *
 * Разбор публиковался в базу и не появлялся на сайте: маршрут знал ровно те
 * адреса, которые были известны на сборке, а известны они были из файла,
 * пустого с самого начала. Кнопка честно писала строку, страница честно
 * отвечала 404, и обе были по-своему правы.
 */

test("страница разбора не отказывает адресу, которого не было на сборке", () => {
  const page = read("app/[locale]/razbor/[slug]/page.tsx");

  assert.ok(
    !/^\s*export const dynamicParams = false/m.test(page),
    "dynamicParams = false вернулся — всё опубликованное из панели снова будет 404",
  );
  assert.match(page, /export const revalidate = \d+/, "нет срока обновления — страница застынет на сборке");
  assert.match(
    page,
    /export async function generateStaticParams/,
    "список адресов должен строиться из базы, а значит асинхронно",
  );
  assert.match(page, /listRazbors/, "адреса снова берутся не из базы");
});

test("список раздела и карта сайта тоже обновляются без выкатки", () => {
  assert.match(read("app/[locale]/razbor/page.tsx"), /export const revalidate = \d+/);
  assert.match(read("app/sitemap.ts"), /export const revalidate = \d+/);
});

test("каждое действие над разбором сбрасывает кэш страниц", () => {
  const actions = read("app/admin/razbor/actions.ts");

  // Сброс собран в одну функцию нарочно: четыре действия меняют одно и то
  // же, и четыре списка путей разъехались бы на первом же новом действии.
  assert.match(actions, /function refresh\(/);
  for (const path of ["paths.ru", "paths.uz", '"/ru/razbor"', '"/uz/razbor"', '"/sitemap.xml"']) {
    assert.ok(actions.includes(`revalidatePath(${path})`), `не сбрасывается ${path}`);
  }
  for (const action of ["publishAction", "unpublishAction", "deleteAction", "rejectAction", "saveAction"]) {
    assert.match(actions, new RegExp(`export async function ${action}`), `нет действия ${action}`);
    }
});

test("правка не трогает адрес, запрос и цену", () => {
  const actions = read("app/admin/razbor/actions.ts");

  // Адрес опубликованного разбора уже стоит в поиске и в карте сайта.
  // Переименовать его тихо — значит потерять позицию и оставить битую
  // ссылку у всех, кто успел сослаться.
  assert.match(actions, /label: previous\.label/);
  assert.match(actions, /query: previous\.query/);
  assert.match(actions, /price: previous\.price/);
  assert.ok(!/slug_ru:/.test(actions), "правка меняет адрес страницы");
});

test("удаление требует слова, а не одной кнопки", () => {
  const actions = read("app/admin/razbor/actions.ts");
  assert.match(actions, /confirm !== "удалить"/);
  // Удаление сносит и отпечаток адреса, то есть возвращает сайт в очередь
  // ночной смены. Такое не должно случаться от промаха мимо кнопки.
  assert.match(read("app/admin/razbor/page.tsx"), /name="confirm"/);
});

test("панель показывает историю, а не только очередь на проверку", () => {
  const page = read("app/admin/razbor/page.tsx");
  assert.match(page, /history\(\)/);
  assert.match(page, /Опубликованы/);
  assert.match(page, /Снять с публикации/);
  assert.match(page, /admin\/razbor\/\$\{row\.id\}/, "нет ссылки на правку");
});

/* ── Снимки находок ─────────────────────────────────────────────────────── */

test("правило снимка знает, чем искать место", () => {
  for (const [code, rule] of Object.entries(EVIDENCE_RULES)) {
    if (rule.mode === "element") {
      assert.ok(rule.hunt, `${code}: обводить нечем — нет приёма поиска`);
    } else {
      assert.equal(rule.hunt, undefined, `${code}: снимок всего экрана не обводит элемент`);
    }
    for (const locale of ["ru", "uz"] as const) {
      assert.ok(rule.caption[locale]?.trim().length > 3, `${code}: пустая подпись на «${locale}»`);
    }
  }
});

test("подписи по-узбекски не переписаны с русских", () => {
  const same = Object.entries(EVIDENCE_RULES).filter(([, rule]) => rule.caption.ru === rule.caption.uz);
  assert.deepEqual(same.map(([code]) => code), [], "узбекская подпись совпадает с русской");
});

test("снимки обещаются только тем находкам, которые аудит действительно находит", () => {
  const sources = ["lib/audit/checks.ts", "lib/audit/design.ts", "lib/audit/deep.ts"].map(read).join("\n");
  const known = new Set(Array.from(sources.matchAll(/code: "([a-z0-9_]+)"/g)).map((m) => m[1]));

  for (const code of shootableCodes()) {
    assert.ok(known.has(code), `${code}: правило снимка есть, а такой находки не бывает`);
  }
});

test("приёмы поиска из правил реализованы в браузерном коде", () => {
  const inPage = read("lib/razbor/in-page.ts");
  for (const rule of Object.values(EVIDENCE_RULES)) {
    if (!rule.hunt) continue;
    assert.ok(inPage.includes(`"${rule.hunt}"`), `приём «${rule.hunt}» не реализован`);
  }
});

test("незнакомый код остаётся без снимка, а не получает чужой", () => {
  assert.equal(evidenceFor("no_sitemap"), null, "карту сайта нечем показать");
  assert.equal(evidenceFor(""), null);
  assert.equal(evidenceFor(undefined), null);
});

/* ── Как снимки доезжают до страницы ────────────────────────────────────── */

test("путь в бакете превращается в адрес, а готовый адрес не ломается", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  assert.equal(
    shotUrl("abc/before-desktop.png"),
    "https://example.supabase.co/storage/v1/object/public/razbor/abc/before-desktop.png",
  );
  // Снимки старых разборов лежат в репозитории. Переписать их путь значило
  // бы сломать страницы, которые уже в поиске.
  assert.equal(shotUrl("/razbor/foo/before.png"), "/razbor/foo/before.png");
  assert.equal(shotUrl("https://cdn.example/x.png"), "https://cdn.example/x.png");
  assert.equal(shotUrl(null), "");
});

test("испорченная запись снимка отбрасывается целиком", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  const item = toItem(
    {
      slug_ru: "a",
      slug_uz: "b",
      article_ru: { title: "t", findings: [{ code: "tiny_text", title: "x", impact: "y", fix: "z" }] },
      shot_findings: {
        tiny_text: { path: "id/f-tiny_text.png", width: 2880, height: 640 },
        // Без размеров рисовать нечем: высота выреза у каждого своя, и
        // подставленные наугад числа растянули бы доказательство.
        no_phone: { path: "id/f-no_phone.png" },
        marquee: { width: 10, height: 10 },
        font_zoo: "просто строка",
      },
    },
    "ru",
  );

  assert.ok(item);
  assert.deepEqual(Object.keys(item.shots.findings), ["tiny_text"]);
  assert.equal(item.findings[0].code, "tiny_text", "код находки не доехал до страницы");
});

test("страница переживает разбор без единого снимка", () => {
  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  // Пустая строка в src у next/image — исключение при отрисовке, то есть
  // пятисотая на странице, которая пришла из поиска.
  assert.match(page, /if \(!desktop && !mobile\) return null;/);
  assert.match(page, /item\.shots\.beforeDesktop \|\| item\.shots\.beforeMobile/);
  assert.match(page, /item\.shots\.afterDesktop \|\| item\.shots\.afterMobile/);
  assert.ok(!/image: \[`\$\{siteUrl\}/.test(page), "разметка обещает картинки, которых может не быть");
});

/* ── Смена приносит коды ────────────────────────────────────────────────── */

test("смена просит у модели код находки и не верит выдуманному", () => {
  const shift = read("lib/razbor/shift-run.ts");
  assert.match(shift, /required: \["code", "title", "impact", "fix"\]/);
  assert.match(shift, /\[\$\{f\.code\}\]/, "коды не показаны модели в списке находок");
  assert.match(
    shift,
    /codes\.has\(String\(f\.code\)\)/,
    "код принимается как есть — находка получит чужой снимок или никакой",
  );
});

test("съёмка идёт отдельным проходом и не тащит браузер в боевой образ", () => {
  const workflow = read(".github/workflows/razbor-shots.yml");
  // Браузер ставится один раз и живёт в кэше: скачивать сто семьдесят
  // мегабайт каждую ночь — это оплаченный трафик за ту же самую работу.
  assert.match(workflow, /ls -d "\$HOME"\/\.cache\/ms-playwright\/chromium\*/);
  assert.match(workflow, /scripts\/razbor-shots\.mjs/);

  const dockerfile = read("Dockerfile");
  assert.ok(!/playwright/i.test(dockerfile), "браузер уехал в боевой образ");
});

test("код находки из формы сверяется со списком, а не берётся как есть", () => {
  const actions = read("app/admin/razbor/actions.ts");
  // Форма приходит из браузера, то есть из рук кого угодно. Чужой код
  // поставил бы под находкой снимок другого места — с уверенной подписью,
  // которую страница возьмёт из правил.
  assert.match(actions, /const known = new Set\(shootableCodes\(\)\);/);
  assert.match(actions, /known\.has\(code\)/);
});

test("в правке выбирают только из находок этого сайта", () => {
  const page = read("app/admin/razbor/[id]/page.tsx");
  assert.match(page, /row\.auditCodes\.filter/);
  assert.match(page, /shootable\.has\(code\)/);
  // Прежний код остаётся в списке, даже если аудит его больше не выносит:
  // иначе открытие страницы правки молча отвязало бы снятую картинку.
  assert.match(page, /finding\.code \? \[finding\.code\] : \[\]/);
});

test("отчёт аудита не тащится в списки", () => {
  const store = read("lib/razbor/store.ts");
  // Он весит больше всего остального вместе взятого, а списку на сто
  // разборов не нужен ни разу.
  const columns = store.slice(store.indexOf("const ROW_COLUMNS =")).split(";")[0];
  assert.ok(columns.includes("article_ru"), "не нашёл набор колонок — проверка бессмысленна");
  assert.ok(!columns.includes("report"), "отчёт попал в общий набор колонок");
  assert.match(store, /\$\{ROW_COLUMNS\}, report/);
});
