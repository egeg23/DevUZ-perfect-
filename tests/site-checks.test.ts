import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { test } from "node:test";

import { LOCALE_SECTIONS } from "@/middleware";

/**
 * Замечания проверки сайта (sitechecker, 19.10.2026): скорость на
 * телефоне 45, страница ошибки отвечает редиректом, старые адреса главной
 * не ведут на главную, Open Graph «не найден», у картинки нет подписи.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("разделы, которые уводят на языковой адрес, — ровно папки app/[locale]", () => {
  const root = new URL("../app/[locale]/", import.meta.url);
  const dirs = readdirSync(root)
    .filter((name) => statSync(new URL(name, root)).isDirectory())
    .filter((name) => !name.startsWith("(") && !name.startsWith("_") && !name.startsWith("["))
    .sort();
  assert.deepEqual([...LOCALE_SECTIONS].sort(), dirs);
});

test("незнакомый адрес без языка — 404 сразу, без редиректа", () => {
  const mw = read("middleware.ts");
  const pass = mw.indexOf('if (pathname !== "/" && !SECTION_SET.has(pathname.split("/")[1] ?? "")) {');
  assert.ok(pass > 0, "проверка раздела пропала");
  assert.ok(pass < mw.indexOf("return NextResponse.redirect(url, 307);"), "проверка стоит после редиректа");
  // Язык посетителя доезжает до страницы 404.
  assert.match(mw.slice(pass, pass + 300), /headers\.set\(LOCALE_HEADER, locale \?\? defaultLocale\);/);
});

test("старые адреса главной — 301 на главную", () => {
  const config = read("next.config.ts");
  assert.match(config, /\{ source: "\/index\.:ext\(html\|htm\|php\)", destination: "\/", statusCode: 301 \}/);
  assert.match(config, /source: "\/:locale\(ru\|en\|uz\|zh\|uk\|pl\)\/index\.:ext\(html\|htm\|php\)", destination: "\/:locale", statusCode: 301/);
});

test("метаданные — в <head> всем, не потоком в body", () => {
  assert.match(read("next.config.ts"), /htmlLimitedBots: \/\.\*\/,/);
});

test("счётчики грузятся после страницы, а не вместе с первым экраном", () => {
  const analytics = read("components/layout/analytics.tsx");
  assert.doesNotMatch(analytics, /strategy="afterInteractive"/);
  assert.equal(analytics.match(/strategy="lazyOnload"/g)?.length, 3);
});

test("шрифты урезаны по толщинам, моноширинный без preload", () => {
  const fonts = read("app/fonts.ts");
  assert.match(fonts, /src: "\.\/fonts\/unbounded\.woff2",\s*weight: "500 800",/);
  assert.match(fonts, /src: "\.\/fonts\/inter\.woff2",\s*weight: "400 800",/);
  assert.match(fonts, /src: "\.\/fonts\/jetbrains-mono\.woff2",\s*weight: "400 700",[\s\S]{0,80}preload: false,/);
  const kb = (name: string) => statSync(new URL(`../app/fonts/${name}.woff2`, import.meta.url)).size / 1024;
  assert.ok(kb("unbounded") + kb("inter") + kb("jetbrains-mono") < 300, "шрифты снова тяжелее 300 КБ");
});

test("у обложки фильма есть подпись", () => {
  const film = read("components/sections/studio-film.tsx");
  assert.match(film, /src=\{POSTER\}\s*alt=\{t\(label, locale\)\}/);
  assert.doesNotMatch(film, /role="img"/);
});
