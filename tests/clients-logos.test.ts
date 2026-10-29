/**
 * «Делали для» — логотипы клиентов двумя лентами под первым экраном
 * (content/clients.ts, components/sections/clients.tsx).
 *
 * Логотип на сайте — маска цвета темы, поэтому файл обязан быть прозрачным,
 * а его пропорции — совпадать с `ratio`, по которому считается размер.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { clientRows, logoBox } from "@/content/clients";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";

const all = clientRows.flat();

/** Пропорции файла: viewBox у SVG, заголовок VP8L у WebP без потерь. */
function fileRatio(path: string): number {
  const buf = readFileSync(path);
  if (path.endsWith(".webp")) {
    assert.equal(buf.toString("ascii", 12, 16), "VP8L", `${path}: ждём WebP без потерь`);
    const bits = buf.readUInt32LE(21);
    return ((bits & 0x3fff) + 1) / (((bits >>> 14) & 0x3fff) + 1);
  }
  const box = buf.toString("utf8").match(/viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
  assert.ok(box, `${path}: нет viewBox`);
  return Number(box[3]) / Number(box[4]);
}

test("«Делали для»: два ряда, у каждого бренда имя и свой файл", () => {
  assert.equal(clientRows.length, 2);
  for (const row of clientRows) assert.ok(row.length >= 8, `в ряду ${row.length} логотипов: лента выйдет короче экрана`);
  const slugs = all.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length, "бренд в двух местах");
  for (const c of all) {
    assert.ok(c.name.trim(), c.slug);
    assert.match(c.logo, /^\/clients\/logos\/[a-z0-9-]+\.(svg|webp)$/);
  }
});

test("«Делали для»: файл на месте, пропорции совпадают, в SVG нет кода и чужих ссылок", () => {
  for (const c of all) {
    const path = join("public", c.logo);
    assert.ok(existsSync(path), `${c.slug}: нет ${path}`);
    assert.ok(statSync(path).size <= 40_000, `${c.slug}: файл тяжелее 40 КБ — вся лента грузится с главной`);
    const ratio = fileRatio(path);
    assert.ok(Math.abs(ratio - c.ratio) / ratio < 0.03, `${c.slug}: ratio ${c.ratio}, у файла ${ratio.toFixed(3)}`);
    if (path.endsWith(".svg")) {
      const svg = readFileSync(path, "utf8");
      assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+\s*=|href\s*=\s*"(https?:|\/\/)/i, `${c.slug}: код или внешняя ссылка в SVG`);
    }
  }
});

test("«Делали для»: размер по площади, ни один логотип не крупнее и не мельче других на глаз", () => {
  for (const c of all) {
    const { width, height } = logoBox(c.ratio);
    assert.ok(width <= 220 && height <= 52, `${c.slug}: ${width}x${height}`);
    assert.ok(height >= 14, `${c.slug}: высота ${height}`);
  }
});

test("«Делали для»: сразу под первым экраном и подписано на каждом языке сайта", () => {
  const page = readFileSync("app/[locale]/page.tsx", "utf8");
  assert.match(page, /<CompileScene[^>]*\/>\s*<ClientsSection/);
  for (const locale of locales) {
    const title = getDictionary(locale).clients.title;
    assert.ok(title.trim(), locale);
    assert.doesNotMatch(title, /[—–]/, locale);
  }
});
