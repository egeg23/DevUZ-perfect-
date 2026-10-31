/**
 * Ловушки в демо-данных и числа скриптов в отпечатке макета, месячная
 * проверка сайтов клиентов.
 *
 * Владелец, 30.10.2026: «Делаем и применяем ко всем будущим макетам. А раз в
 * месяц я хочу чтобы автоматически прогонялся клиент, для которого мы делали
 * макет и у него на сайте обнаружены наши наработки».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { BUNDLE_NAMES, bundlePages } from "@/lib/proto/bundles";
import { plainTraps, stampHtml, stampPages, trapWord } from "@/lib/proto/stamp";
import { matchStamp, scriptSignalsOf, signalsOf } from "@/lib/proto/trace";
import { sitesToScan, traceMonthText, type Finding } from "@/lib/proto/trace-month";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const SEED = "a7".repeat(16);
const STYLE = `<style>:root{--bg: hsl(210 40% 8%);--fg: hsl(0 0% 96%);--r: 12px}h1{letter-spacing:-0.02em;line-height:1.1}</style>`;
const SCRIPT = `<script>const k=/*~*/0.08,th=/*~*/0.2;const price=0.02;</script>`;
const page = (lang: string, body: string) =>
  `<!doctype html><html lang="${lang}"><head>${STYLE}</head><body>${body}${SCRIPT}</body></html>`;
const RU = page("ru", `<p>Аптека [[t:0]] · демо</p><p>ул. [[t:1]], 14</p>`);
const UZ = page("uz", `<p>[[t:0]] dorixonasi · demo</p><p>[[t:1]] ko‘chasi, 14</p>`);

test("слово-ловушка: своё у каждого зерна, без повторов, русское — кириллица, узбекское — латиница", () => {
  const words = Array.from({ length: 30 }, (_, n) => trapWord(SEED, n));
  assert.equal(new Set(words.map(([ru]) => ru)).size, 30);
  for (const [ru, uz] of words) {
    assert.match(ru, /^[А-ЯЁ][а-яё]+$/);
    assert.match(uz, /^[A-Z][a-z]+$/);
  }
  assert.deepEqual(trapWord(SEED, 3), trapWord(SEED, 3));
  assert.notDeepEqual(
    Array.from({ length: 5 }, (_, n) => trapWord(SEED, n)),
    Array.from({ length: 5 }, (_, n) => trapWord("b8".repeat(16), n)),
  );
});

test("отпечаток: ловушки и метки чисел уходят со страницы, слова — в признаки", () => {
  const ru = stampHtml(RU, SEED);
  const uz = stampHtml(UZ, SEED);
  for (const out of [ru.html, uz.html]) {
    assert.doesNotMatch(out, /\[\[t:|\/\*~\*\//);
  }
  const [w0ru, w0uz] = trapWord(SEED, 0);
  assert.ok(ru.html.includes(`Аптека ${w0ru}`));
  assert.ok(uz.html.includes(`${w0uz} dorixonasi`));
  assert.doesNotMatch(uz.html.replace(/<style[\s\S]*?<\/style>/, ""), /[А-Яа-яЁё]/);
  assert.ok(ru.stamp.signals.includes(`text:${w0ru}`) && ru.stamp.signals.includes(`text:${w0uz}`));
  // Число с меткой сдвинуто на десятитысячные, число без метки (цена) — нет.
  const k = ru.html.match(/const k=(\d*\.\d+)/)![1];
  assert.match(k, /^0\.08\d\d$/);
  assert.ok(ru.html.includes("const price=0.02;"));
  assert.ok(ru.stamp.signals.includes(`js:${k}`));
  // Страницы одного макета: те же слова и те же числа.
  const site = stampPages(RU, { uz: UZ }, SEED);
  assert.ok(site.pages.uz.includes(w0uz));
  assert.equal(site.html.match(/const k=(\d*\.\d+)/)![1], k);
});

test("ловушки и числа скриптов не сдвигают отпечаток стилей у макетов, записанных раньше", () => {
  const before = stampHtml(page("ru", "<p>Аптека</p>").replace(SCRIPT, ""), SEED).stamp.signals.filter(
    (s) => !s.startsWith("text:") && !s.startsWith("js:"),
  );
  const after = stampHtml(RU, SEED).stamp.signals.filter((s) => !s.startsWith("text:") && !s.startsWith("js:"));
  assert.deepEqual(after, before);
});

test("проверка сайта: два слова-ловушки — точно наш, одно — похоже, числа скрипта считаются", () => {
  const stamp = stampPages(RU, { uz: UZ }, SEED).stamp;
  const [a, b] = [trapWord(SEED, 0), trapWord(SEED, 1)];
  const none = new Set<string>();
  assert.equal(matchStamp(stamp, none, `<li>Аптека ${a[0]}</li><li>ул. ${b[0]}</li>`).level, "strong");
  assert.equal(matchStamp(stamp, none, `<li>${a[1]} dorixonasi</li>`).level, "likely");
  // Русское и узбекское написание одного слова — одно слово.
  assert.equal(matchStamp(stamp, none, `${a[0]} ${a[1]}`).level, "likely");
  assert.equal(matchStamp(stamp, none, "<p>Аптека №5</p>").level, "none");

  const stamped = stampHtml(RU, SEED).html;
  const found = signalsOf(stamped.match(/<style>([\s\S]*?)<\/style>/)![1]);
  for (const s of scriptSignalsOf(stamped.match(/<script>([\s\S]*?)<\/script>/)![1])) found.add(s);
  const match = matchStamp(stamp, found);
  assert.ok(match.hits.some((h) => h.startsWith("js:")));
  assert.notEqual(match.level, "none");
});

test("сборка без зерна (локальный показ): ловушки — словом, метки чисел убраны", () => {
  const out = plainTraps(RU);
  assert.doesNotMatch(out, /\[\[t:|\/\*~\*\//);
  assert.ok(out.includes("const k=0.08,"));
  assert.doesNotMatch(plainTraps(UZ).replace(/<style[\s\S]*?<\/style>/, ""), /[А-Яа-яЁё]/);
});

/**
 * Макеты, собранные до 30.10.2026: ловушек в них нет, отпечаток — стилями.
 * Новая сборка в этот список не добавляется: в ней не меньше двух
 * слов-ловушек в демо-данных и не меньше одного числа скрипта с меткой.
 */
const BEFORE_TRAPS = new Set([
  "bloger-agency", "automechanic", "shox-hospital", "shahar", "pkvesta", "aipply", "hop", "enotmebel",
  "giftora", "lider-prof", "intalim", "asmo", "europegas", "domtut", "inapp", "invis", "arhbyuro",
  "greenwell", "medikor", "sia", "amani", "vtashkente", "dilrabo", "karomat", "tovar", "soffice",
  "baldinini", "ighub", "syanie", "jiguli", "usemtau", "semtravel", "samauto", "chechfarm", "fintax",
  "cosmoworld", "neoline", "autopepe",
]);

test("каждая новая сборка — с ловушками в демо-данных и числом скрипта с меткой", () => {
  for (const name of BUNDLE_NAMES) {
    if (BEFORE_TRAPS.has(name)) continue;
    const raw = bundlePages(name)!;
    const all = [raw.html, ...Object.values(raw.pages)].join("\n");
    const traps = new Set([...all.matchAll(/\[\[t:(\d{1,3})\]\]/g)].map((m) => m[1]));
    assert.ok(traps.size >= 2, `${name}: нужно не меньше двух ловушек [[t:N]] в демо-данных`);
    assert.match(all, /\/\*~\*\/\d*\.?\d+/, `${name}: нужно число скрипта с меткой /*~*/`);
  }
});

test("месячная проверка: сайты своих макетов по одному на адрес, без ботовых и черновиков", () => {
  const sites = sitesToScan([
    { id: "1", name: "Oson Apteka", source: "https://osonapteka.uz", status: "ready" },
    { id: "2", name: "Oson Apteka 2", source: "https://www.osonapteka.uz/business", status: "ready" },
    { id: "3", name: "Авто", source: "https://auto.uz", auto: true, status: "ready" },
    { id: "4", name: "Черновик", source: "https://draft.uz", status: "draft" },
    { id: "5", name: "Ник", source: "@nick", status: "ready" },
    { id: "6", name: "Свой", source: "https://devuz.studio/cases", status: "ready" },
  ]);
  assert.deepEqual(sites, [{ id: "1", name: "Oson Apteka", url: "https://osonapteka.uz" }]);
});

test("месячный отчёт: нашли — с макетом, словами и ссылкой в панель; не нашли — одной строкой", () => {
  const panel = (url: string) => `https://devuz.studio/admin/proto?check=${encodeURIComponent(url)}`;
  const f: Finding = {
    site: "osonapteka.uz", client: "Oson Apteka", url: "https://osonapteka.uz", proto: "Oson Apteka",
    own: true, level: "strong", matched: 7, total: 9, traps: ["Ойдинсой"],
  };
  const text = traceMonthText("2026-11", 16, [f], ["dead.uz"], panel);
  assert.match(text, /ноябрь 2026/);
  assert.match(text, /Проверено сайтов клиентов, которым делали макет: 16/);
  assert.match(text, /точно наш макет «Oson Apteka», тот, что делали им; совпало 7 из 9, слова-ловушки: Ойдинсой/);
  assert.ok(text.includes(panel("https://osonapteka.uz")));
  assert.match(text, /Не открылись: dead\.uz/);
  assert.match(traceMonthText("2026-11", 16, [], [], panel), /Нашего не нашли\./);
});

test("месячная проверка стоит в свипе, отчёт — владельцу и руководителю под «Отчётами»", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /runTraceMonth\(new Date\(\)\)/);
  const store = read("lib/proto/trace-month-store.ts");
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/);
  assert.match(store, /wants\(.*"reports"\)/);
  assert.match(store, /QUIET_FROM_HOUR/);
  assert.match(store, /traceSite\(site\.url, \{ views: false \}\)/);
  assert.doesNotMatch(store, /anthropic|model/i);
});
