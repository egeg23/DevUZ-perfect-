/**
 * Скрытый отпечаток прототипа и проверка чужого сайта.
 *
 * Владелец, 03.10.2026: «маркеры, которые не будут видны, но в случае
 * разбирательств станут доказательствами нашей разработки», — обязательно для
 * всех макетов.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { protoNicheByKey } from "@/content/proto/models";
import { protoProblems } from "@/lib/proto/check";
import { emptyFacts } from "@/lib/proto/facts";
import { buildProto } from "@/lib/proto/render";
import { hslToRgb, stampHtml } from "@/lib/proto/stamp";
import { matchStamp, signalsOf } from "@/lib/proto/trace";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const facts = {
  ...emptyFacts("Smile Dent", "stomatologiya", "smile.uz"),
  services: [{ name: "Лечение кариеса" }, { name: "Имплантация" }, { name: "Отбеливание" }],
  telegram: "@smile_dent",
};
const base = buildProto(facts)!.html;
const css = (html: string) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const SEED_A = "a1".repeat(16);
const SEED_B = "b2".repeat(16);

test("отпечаток: свой у каждого, тот же при том же зерне, проверку прототипа не ломает", () => {
  const a = stampHtml(base, SEED_A);
  assert.deepEqual(stampHtml(base, SEED_A), a, "одно зерно — один отпечаток");
  assert.notDeepEqual(stampHtml(base, SEED_B).stamp.signals, a.stamp.signals);
  assert.ok(a.stamp.signals.length >= 15, `признаков мало: ${a.stamp.signals.length}`);
  assert.deepEqual(protoProblems({ html: a.html, facts, niche: protoNicheByKey("stomatologiya")! }), []);
  // Кегль не трогаем — его сверяет проверка со шкалой.
  const sizes = (h: string) => [...css(h).matchAll(/font-size:[^;}]+/g)].map((m) => m[0]).join("|");
  assert.equal(sizes(a.html), sizes(base));
  // Видимый текст тот же.
  const text = (h: string) => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.equal(text(a.html), text(base));
});

test("в странице нет ни слова об отпечатке — ни человеку в F12, ни нейросети", () => {
  const { html } = stampHtml(base, SEED_A);
  assert.doesNotMatch(html, /stamp|watermark|fingerprint|отпечат|seed|data-mark/i);
});

test("сдвиги незаметны: цвет — на единицы rgb, длины — на доли пикселя", () => {
  const { html } = stampHtml(base, SEED_A);
  const before = [...css(base).matchAll(/(--[a-z0-9-]+):\s*hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/g)];
  const after = new Map([...css(html).matchAll(/(--[a-z0-9-]+):\s*hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/g)].map((m) => [m[1], m]));
  assert.ok(before.length >= 8);
  for (const m of before) {
    const b = hslToRgb(Number(m[2]), Number(m[3]), Number(m[4]));
    const a2 = after.get(m[1])!;
    const s = hslToRgb(Number(a2[2]), Number(a2[3]), Number(a2[4]));
    const delta = Math.max(...b.map((v, i) => Math.abs(v - s[i])));
    assert.ok(delta >= 1 && delta <= 8, `${m[1]}: сдвиг ${delta} единиц rgb`);
  }
  const radius = Number(css(html).match(/--r:\s*([\d.]+)px/)![1]);
  assert.ok(radius > 14 && radius < 15, `скругление ${radius}`);
});

test("проверка находит наш макет после копирования через F12 и переписывания цветов в hex", () => {
  const { html, stamp } = stampHtml(base, SEED_A);
  // Копия: hsl переписаны в hex, как это делает нейросеть или «Copy styles».
  const copied = css(html).replace(/hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/g, (_m, h, s, l) =>
    `#${hslToRgb(Number(h), Number(s), Number(l)).map((v) => v.toString(16).padStart(2, "0")).join("")}`,
  );
  const match = matchStamp(stamp, signalsOf(copied));
  assert.equal(match.level, "strong");
  assert.equal(match.matched, stamp.signals.length);

  // Чистая страница без отпечатка — не наша.
  assert.equal(matchStamp(stamp, signalsOf(css(base))).level, "none");
  // Отпечаток другого клиента не выдаётся за этот.
  const other = matchStamp(stamp, signalsOf(css(stampHtml(base, SEED_B).html)));
  assert.ok(other.matched / other.total < 0.7, `чужой отпечаток совпал на ${other.matched}/${other.total}`);
});

test("отпечаток — у каждого нового и у старых прототипов; журнал показа; проверка в панели", () => {
  const store = read("lib/proto/store.ts");
  assert.match(store, /const stamped = stampHtml\(build\.html, newSeed\(\)\);\s*return \{ html: stamped\.html, stamp: stamped\.stamp \};/);
  // Старые — при первом открытии и из раздела.
  assert.match(store, /if \(!stamp \|\| stamp\.v < STAMP_VERSION\) \{/);
  assert.match(store, /\.from\("protos"\)\.select\("id, html, facts, stamp, pages"\)\.is\("stamp", null\)/);
  assert.match(read("app/admin/proto/page.tsx"), /after\(\(\) => upgradeAllProtos\(50\)/);
  // Журнал показа пишется вместе с открытием.
  assert.match(read("lib/proto/serve.ts"), /await logView\(page\.id, \{ ip, userAgent, referer, path \}\);/);
  // Обе дороги к прототипу — главная и страница внутри — идут через serveProto.
  assert.match(read("app/proto/[token]/route.ts"), /return serveProto\(request, token\);/);
  assert.match(read("app/proto/[token]/[...page]/route.ts"), /return serveProto\(request, token, path\);/);
  const migration = read("supabase/migrations/0080_proto_stamp.sql");
  assert.match(migration, /alter table public\.proto_views enable row level security;/);
  // «Проверить сайт» — GET-форма, результат по адресу.
  assert.match(read("app/admin/proto/page.tsx"), /const traced = check \? await traceSite\(check\) : null;/);
});
