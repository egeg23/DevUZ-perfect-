/**
 * Прототип из нескольких страниц: адреса внутри ссылки и один отпечаток на
 * все страницы.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PROTO_BASE, protoPagePath, withBase } from "@/lib/proto/pages";
import { stampHtml, stampPages } from "@/lib/proto/stamp";
import { matchStamp, signalsOf } from "@/lib/proto/trace";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const STYLE = `<style>:root{--bg: hsl(100 30% 6%);--fg: hsl(90 20% 92%);--lime: hsl(86 100% 63%);--r: 14px}
h1{letter-spacing:-0.01em;line-height:1.05}p{line-height:1.6}.c{border-radius:24px}</style>`;
const page = (title: string) =>
  `<!doctype html><html><head><title>${title}</title>${STYLE}</head><body><a href="${PROTO_BASE}/kurs/python">Python</a></body></html>`;
const SEED = "c3".repeat(16);

test("адрес страницы: только латиница, цифры и дефис, не глубже трёх уровней", () => {
  assert.equal(protoPagePath(["kurs", "python"]), "kurs/python");
  assert.equal(protoPagePath(["uz", "kurs", "data-science"]), "uz/kurs/data-science");
  for (const bad of [[], [".."], ["kurs", "..", "x"], ["Kurs"], ["a", "b", "c", "d"], ["kurs%2f"], ["-x"], ["x--y"], ["a".repeat(41)]]) {
    assert.equal(protoPagePath(bad), null, JSON.stringify(bad));
  }
});

test("ссылки между страницами получают токен при показе", () => {
  const html = withBase(page("Главная"), "T".repeat(43));
  assert.ok(!html.includes(PROTO_BASE));
  assert.match(html, /href="\/proto\/T{43}\/kurs\/python"/);
});

test("отпечаток: одно зерно на все страницы, одинаковые стили — одинаковые сдвиги", () => {
  const site = stampPages(page("Главная"), { "kurs/python": page("Python"), uz: page("Bosh sahifa") }, SEED);
  const style = (html: string) => html.match(/<style>[\s\S]*?<\/style>/)![0];
  assert.equal(style(site.pages["kurs/python"]), style(site.html));
  assert.equal(style(site.pages.uz), style(site.html));
  assert.notEqual(style(site.html), STYLE, "страница без отпечатка");
  // Тот же набор, что у одной главной: страницы его не раздувают.
  assert.deepEqual(site.stamp.signals.sort(), stampHtml(page("Главная"), SEED).stamp.signals.sort());
  // И по любой странице макет узнаётся.
  assert.equal(matchStamp(site.stamp, signalsOf(style(site.pages["kurs/python"]))).level, "strong");
});

test("страницы лежат в той же записи и проходят тот же журнал показа", () => {
  const migration = read("supabase/migrations/0088_proto_pages.sql");
  assert.match(migration, /add column if not exists pages jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /alter table public\.proto_views\s+add column if not exists path text/);
  const store = read("lib/proto/store.ts");
  assert.match(store, /const stamped = stampPages\(base, pages, newSeed\(\)\);/);
  assert.match(store, /const page = path \? pages\[path\] : html;/);
  const route = read("app/proto/[token]/[...page]/route.ts");
  assert.match(route, /const path = protoPagePath\(page\);\s*if \(!path\) return new Response\(null, \{ status: 404 \}\);/);
  // noindex — заголовком, на каждой странице прототипа.
  assert.match(read("lib/proto/serve.ts"), /"X-Robots-Tag": "noindex, nofollow, noarchive"/);
});

test("ссылка на прототип не уезжает в языковой редирект", () => {
  // Было: /proto/<токен> → 307 на /ru/proto/<токен>, где маршрута нет, — и
  // клиент по ссылке из переписки видел 404. Ни один отправленный прототип
  // так и не открылся. Исключение стоит до языкового редиректа.
  const middleware = read("middleware.ts");
  const skip = middleware.indexOf('if (pathname.startsWith("/proto/")) return NextResponse.next();');
  assert.ok(skip > 0, "в middleware нет исключения для /proto/");
  assert.ok(skip < middleware.indexOf("return NextResponse.redirect(url, 307);"));
});
