import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import tailsFile from "@/content/proto-instant/tails.json" with { type: "json" };
import { buildInstant, normalizeSite } from "@/lib/proto/instant/build";
import { tailsIn } from "@/lib/proto/instant/check";
import { DENTAL_PHOTOS } from "@/lib/proto/instant/dental";
import { imageUrl } from "@/lib/proto/instant/safe";
import { emptySite, instantReady, type InstantSite } from "@/lib/proto/instant/types";
import { tails } from "../scripts/protos/instant/tails.mjs";
import { nekAssets } from "../scripts/protos/instant/nek-assets.mjs";
import assetsFile from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import { EXAMPLE } from "../scripts/protos/instant/preview-data.mjs";

/**
 * «Макет в боте» (CLAUDE.md): шаблон ниши из наших макетов, данные клиента —
 * экранированно, ни хвоста прошлого клиента, защита как у всех макетов.
 */

const example = EXAMPLE as InstantSite;
const SEED = "1".repeat(32);

test("макет в боте: пример выдуманной клиники собирается без замечаний", () => {
  const build = buildInstant(example, SEED);
  assert.deepEqual(build.problems, []);
  assert.ok(build.html.includes("Белая Лилия"));
  assert.ok(build.stamp.signals.length > 5, "отпечаток стоит");
});

test("макет в боте: защита — условия, видео DevUz, ловушки, метка числа", () => {
  const { html, stamp } = buildInstant(example, SEED);
  assert.ok(html.includes("/ru/mockup-terms"));
  assert.ok(html.includes('class="dz-vid"'));
  assert.ok(!/\[\[t:\d\]\]/.test(html), "ловушки заменены словами");
  assert.ok(!html.includes("/*~*/"), "метка числа снята");
  assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "два слова-ловушки, ru и lat");
  assert.ok(stamp.signals.some((s) => s.startsWith("js:")));
  assert.ok(html.includes('name="robots" content="noindex'));
  assert.doesNotMatch(html, /watermark|fingerprint/i);
  const other = buildInstant(example, "2".repeat(32));
  assert.notEqual(other.html, html, "отпечаток свой у каждого клиента");
});

test("макет в боте: узбекская страница — латиница, ловушки латиницей", () => {
  const { html, problems } = buildInstant({ ...example, locale: "uz", tagline: null, about: null }, SEED);
  assert.deepEqual(problems, []);
  assert.ok(html.includes('<html lang="uz"'));
  assert.ok(html.includes("/uz/mockup-terms"));
});

test("макет в боте: данные экранируются, чужие адреса выбрасываются", () => {
  const evil = {
    ...example,
    name: `<img src=x onerror=alert(1)>`,
    about: `"><script>alert(1)</script>`,
    logo: "javascript:alert(1)",
    photos: ["http://example.com/a.jpg", "https://ok.example/b.jpg"],
    services: [{ name: "<b>Чистка</b>", price: null }],
    telegram: "bad handle!",
  };
  const { html } = buildInstant(evil, SEED);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>alert"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("http://example.com"));
  assert.ok(html.includes("https://ok.example/b.jpg"));
  assert.ok(html.includes("&lt;b&gt;Чистка"));
  assert.equal(imageUrl("data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)>").toString("base64")), null);
});

test("макет в боте: пустое — без блока, цен не придумываем", () => {
  const site = { ...emptySite("stomatologiya", "ru", "Улыбка", "ответы в Telegram"), phone: "+998 90 111 22 33", services: [{ name: "Лечение", price: null }] };
  const { html, problems } = buildInstant(site, SEED);
  assert.deepEqual(problems, []);
  assert.ok(!html.includes('id="team"'), "врачей нет — блока нет");
  assert.ok(!html.includes('id="about"'));
  assert.ok(html.includes("Стоимость врач назовёт после осмотра"));
  assert.ok(!/\bсум\b/.test(html));
  assert.ok(html.includes(DENTAL_PHOTOS[0]), "своих фото нет — нейтральные фото ниши");
});

test("макет в боте: без названия или связи — не собирается", () => {
  const site = emptySite("stomatologiya", "ru", "", "x");
  const codes = buildInstant(site, SEED).problems.map((p) => p.code);
  assert.ok(codes.includes("missing:name"));
  assert.ok(codes.includes("missing:contact"));
});

test("макет в боте: хвост прошлого клиента — макет не отдаётся", () => {
  for (const tail of ["Nek Dental Studio", "Сияние Севера", "Реутов Евгений Александрович", "syanie-sewera.ru"]) {
    const build = buildInstant({ ...example, perks: [`Как в ${tail}`] }, SEED);
    // Своё имя клиента хвостом не считается — подставляем в чужое поле.
    assert.ok(build.problems.some((p) => p.code === "tail"), tail);
  }
  const phone = buildInstant({ ...example, about: "Звоните +7 382 227 00 77" }, SEED);
  assert.ok(phone.problems.some((p) => p.code === "tail"));
  assert.deepEqual(tailsIn(buildInstant(example, SEED).html), []);
});

test("макет в боте: список хвостов совпадает с data.mjs исходных макетов", () => {
  assert.deepEqual(tailsFile, tails(), "node scripts/protos/instant/tails.mjs");
  assert.ok(tailsFile.text.includes("Nek Dental Studio"));
  assert.ok(tailsFile.text.includes("Сияние Севера"));
});

test("макет в боте: числа и тире — только из данных клиента", () => {
  const dash = buildInstant({ ...example, about: "Лечим зубы — быстро" }, SEED);
  assert.ok(!dash.html.includes("—"), "тире из данных снимается");
  const numbers = buildInstant(example, SEED);
  assert.deepEqual(numbers.problems, []);
});

test("макет в боте: без сети, кроме шрифтов", () => {
  const { html } = buildInstant(example, SEED);
  assert.ok(!/<script[^>]+src=/i.test(html));
  assert.ok(!/<iframe/i.test(html));
  const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => new URL(m[1]).host);
  assert.ok(links.every((h) => h === "fonts.googleapis.com" || h === "fonts.gstatic.com"));
});

test("макет в боте: шаблон есть только у стоматологии, фото ниши лежат в репозитории", () => {
  assert.ok(instantReady("stomatologiya"));
  assert.ok(!instantReady("mebel"));
  for (const photo of DENTAL_PHOTOS) assert.ok(existsSync(`public${photo}`), photo);
});

test("макет в боте: длинные списки режутся, дубли убираются", () => {
  const many = { ...example, services: Array.from({ length: 30 }, (_, i) => ({ name: `Услуга ${String.fromCharCode(1040 + i)}`, price: null })) };
  assert.equal(normalizeSite(many).services.length, 12);
  const dup = { ...example, services: [{ name: "Чистка", price: null }, { name: "чистка", price: null }] };
  assert.equal(normalizeSite(dup).services.length, 1);
});

test("макет в боте: шаблон — стили и скрипт сайта нашего макета Nek, свежие", () => {
  assert.deepEqual(assetsFile, nekAssets(), "node scripts/protos/instant/nek-assets.mjs");
  const { html } = buildInstant(example, SEED);
  assert.ok(html.includes(assetsFile.css.slice(0, 200)), "стили Nek на странице");
  assert.ok(html.includes('id="im-data"'));
  for (const nek of ["Nek Dental", "Tbilisi", "Тбилиси", "Ваке", "Paliashvili", "/protos/nek/", "100doc", "+995"]) {
    assert.ok(!html.includes(nek), nek);
  }
});
