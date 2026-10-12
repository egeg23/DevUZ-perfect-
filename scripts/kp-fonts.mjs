#!/usr/bin/env node
/**
 * Шрифты коммерческого предложения — рядом с документом, а не с Google.
 *
 *   node scripts/kp-fonts.mjs
 *   node scripts/kp-fonts.mjs coffee "Lora:wght@400;500;600" "Manrope:wght@400;500;600"
 *
 * Без аргументов собирает общий набор (Playfair Display и Inter) в
 * kp/fonts.css. С именем и семействами — свой набор под клиента в
 * kp/fonts-<имя>.css: КП верстается в регистре заказчика, а не студии, и
 * гарнитуры у разных клиентов разные. Файлы шрифтов лежат в одной kp/fonts/.
 *
 * КП открывают с телефона в дороге и печатают в отделе продаж. Документ,
 * набранный системной гарнитурой из-за отсутствия сети, выглядит не тем
 * документом, который отправляли. Снимок в PDF без сети тоже: браузер в
 * песочнице на fonts.googleapis.com не ходит.
 *
 * Берём только кириллицу и латиницу. Греческий, вьетнамский и расширенные
 * наборы Google отдаёт тем же запросом — это ещё полмегабайта, которых в
 * русском КП никто не увидит.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const [set, ...families] = process.argv.slice(2);
const FAMILIES = families.length
  ? families
  : ["Playfair Display:wght@400;500;600", "Inter:wght@400;500;600"];
const API = `https://fonts.googleapis.com/css2?${FAMILIES.map(
  (family) => `family=${family.replace(/ /g, "+")}`,
).join("&")}&display=swap`;
const CSS = set ? `fonts-${set}.css` : "fonts.css";
const KEEP = new Set(["cyrillic", "latin"]);
const OUT = "kp";

const grab = async (url) => {
  // Без браузерного User-Agent Google отдаёт ttf вместо woff2: шрифты те же,
  // а весят втрое больше.
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
};

const css = await (await grab(API)).text();
await mkdir(path.join(OUT, "fonts"), { recursive: true });

const faces = [];
let bytes = 0;
// Google отдаёт блоки парами «/* набор */ @font-face {…}» — по комментарию и
// отбираем: внутри самого правила название набора не указано.
for (const [, subset, face] of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)) {
  if (!KEEP.has(subset)) continue;
  const family = /font-family:\s*'([^']+)'/.exec(face)[1];
  const weight = /font-weight:\s*(\d+)/.exec(face)[1];
  const source = /url\((https:[^)]+)\)/.exec(face)[1];

  const name = `${family.toLowerCase().replace(/\s+/g, "-")}-${weight}-${subset}.woff2`;
  const file = Buffer.from(await (await grab(source)).arrayBuffer());
  await writeFile(path.join(OUT, "fonts", name), file);
  bytes += file.length;

  faces.push(face.replace(/url\(https:[^)]+\)/, `url("fonts/${name}")`).replace(/\s+/g, " ").trim());
}

await writeFile(
  path.join(OUT, CSS),
  `/* Собрано scripts/kp-fonts.mjs из Google Fonts. Правки — там. */\n\n${faces.join("\n\n")}\n`,
);

console.log(`${faces.length} начертаний, ${Math.round(bytes / 1024)} КБ`);
