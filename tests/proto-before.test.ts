/**
 * Сайт клиента — снимок до макета (CLAUDE.md, владелец, 03.11.2026: «Да,
 * сохрани и сделай правило»).
 *
 * После «Украли визуал и цвета с прототипа» про Optimal Prime их сайт
 * оказался своим и старым, но показать, как он выглядел до макета, было
 * нечем. Теперь каждая новая сборка руками начинается со снимка
 * (`scripts/protos/site-before.mjs`): `BEFORE.md` с хешами, снимки и код под
 * шифром. Сайта нет — `BEFORE.md` со строкой «Сайта нет: …».
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { BUNDLE_NAMES } from "@/lib/proto/bundles";

const path = (file: string) => new URL(`../${file}`, import.meta.url);
const read = (file: string) => readFileSync(path(file), "utf8");

/**
 * Сборки до 03.11.2026: снимка их сайта до макета нет. Новая сборка в этот
 * список не добавляется: снимок делается первым шагом, до макета.
 */
const BEFORE_SNAPSHOT = new Set([
  "agora", "aipply", "amani", "arhbyuro", "asmo", "automechanic", "autopepe", "baldinini", "bloger-agency",
  "cargopro", "chechfarm", "cosmoworld", "dilrabo", "domtut", "enotmebel", "europegas", "fintax", "giftora",
  "greenwell", "hop", "ighub", "inapp", "intalim", "invis", "jiguli", "karomat", "lider-prof", "medikor",
  "neoline", "osonapteka", "pkvesta", "samauto", "semtravel", "shahar", "shox-hospital", "sia", "soffice",
  "syanie", "tovar", "usemtau", "vtashkente",
]);

test("каждая новая сборка — со снимком сайта клиента до макета (BEFORE.md)", () => {
  for (const name of BUNDLE_NAMES) {
    if (BEFORE_SNAPSHOT.has(name)) continue;
    const file = `scripts/protos/${name}/BEFORE.md`;
    assert.ok(existsSync(path(file)), `${name}: нет ${file} — node scripts/protos/site-before.mjs ${name} <сайт>`);
    const md = read(file);
    if (/^Сайта нет: \S/m.test(md)) continue;
    assert.match(md, /^Снято: \d{4}-\d{2}-\d{2}T/m, `${name}: в BEFORE.md нет времени снимка`);
    assert.match(md, /\| страница \| https?:\/\/\S+ \| 200 \| \d+ \| `[0-9a-f]{64}` \|/, `${name}: нет хеша главной`);
    const shots = [...md.matchAll(/`(docs\/screens\/[^`]+\.webp)`/g)].map((m) => m[1]);
    assert.ok(shots.length >= 2, `${name}: нужны снимки на 1440 и 390`);
    for (const shot of shots) assert.ok(existsSync(path(shot)), `${name}: нет снимка ${shot}`);
    const code = md.match(/`(docs\/screens\/[^`]+\/code-\d{4}-\d{2}-\d{2}\.enc)`/)?.[1];
    assert.ok(code && existsSync(path(code)), `${name}: нет кода под шифром`);
    assert.match(md, /`app\.SITE_BEFORE_[A-Z0-9_]+_\d{8}`/, `${name}: не названо, где ключ`);
  }
});

test("код клиента открытым и ключ в git не идут", () => {
  assert.match(read(".gitignore"), /^scripts\/protos\/\*\/\.before\/$/m);
  const script = read("scripts/protos/site-before.mjs");
  assert.match(script, /aes-256-gcm/);
  assert.match(script, /key\.sql/);
  // Ключ не печатается: в выводе скрипта только итог.
  for (const m of script.matchAll(/console\.log\(([^\n]*)\)/g)) assert.doesNotMatch(m[1], /key/i);
});

test("Optimal Prime: снимок их сайта 03.11.2026 на месте", () => {
  const md = read("scripts/protos/optimalprime/BEFORE.md");
  assert.match(md, /optimal-prime\.uz/);
  assert.match(md, /`#c8963e`/);
  assert.match(md, /`#0f1f3d`/);
});
