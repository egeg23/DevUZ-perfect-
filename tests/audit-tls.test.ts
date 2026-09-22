/**
 * Неполная цепочка сертификата — не «сайт не отвечает».
 *
 * Смена разборов раз за разом писала «aic.uz: unable to verify the first
 * certificate» и считала сайт недоступным. Браузер такой сайт открывает —
 * достраивает цепочку сам, — а письмо в касании сказало бы владельцу, что
 * его работающий сайт не открывается.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { analyze, unreachable } from "@/lib/audit/checks";
import { incompleteChain, type PageProbe } from "@/lib/audit/fetch";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const err = (code: string) => Object.assign(new Error(code), { code });

test("неполная цепочка — только эти два кода, настоящие ошибки — нет", () => {
  assert.equal(incompleteChain(err("UNABLE_TO_VERIFY_LEAF_SIGNATURE")), true);
  assert.equal(incompleteChain(err("UNABLE_TO_GET_ISSUER_CERT_LOCALLY")), true);
  // Их браузер тоже не пропустит — перечитывать без проверки нельзя.
  assert.equal(incompleteChain(err("CERT_HAS_EXPIRED")), false);
  assert.equal(incompleteChain(err("ERR_TLS_CERT_ALTNAME_INVALID")), false);
  assert.equal(incompleteChain(err("DEPTH_ZERO_SELF_SIGNED_CERT")), false);
  assert.equal(incompleteChain(new Error("timeout")), false);
});

const page = (patch: Partial<PageProbe> = {}): PageProbe => ({
  finalUrl: "https://aic.uz/",
  status: 200,
  redirects: [],
  html: "<html><head><title>AIC</title><meta name=viewport content=width=device-width></head><body><h1>AIC</h1></body></html>",
  truncated: false,
  headers: {},
  ttfbMs: 300,
  totalMs: 400,
  https: true,
  certDaysLeft: 200,
  ...patch,
});

test("сайт с неполной цепочкой разбирается, а не объявляется мёртвым", () => {
  const report = analyze(page({ tlsIssue: "chain" }));
  const codes = report.findings.map((f) => f.code);
  assert.ok(codes.includes("cert_chain"), "находки про цепочку нет");
  assert.ok(!codes.includes("unreachable"), "сайт с неполной цепочкой назван недоступным");
  assert.ok(!analyze(page()).findings.some((f) => f.code === "cert_chain"), "находка без причины");
});

test("настоящая ошибка сертификата — предупреждение браузера, а не «не отвечает»", () => {
  const cert = unreachable("https://x.uz", "сертификат просрочен — браузер покажет предупреждение").findings[0];
  assert.equal(cert.title, "Вместо сайта — предупреждение браузера");
  const down = unreachable("https://x.uz", "домен не найден").findings[0];
  assert.equal(down.title, "Сайт не отвечает");
});

test("без проверки цепочки — только повторно, только на её ошибке и того же хоста", () => {
  const fetch = read("lib/audit/fetch.ts");
  assert.match(fetch, /new https\.Agent\(\{ keepAlive: false, rejectUnauthorized: false \}\)/);
  assert.match(fetch, /chainHosts\.has\(url\.hostname\) \? lenientAgent : httpsAgent/);
  const probe = fetch.slice(fetch.indexOf("export async function probe("));
  // Адрес проверяется до любого запроса — и до повторного тоже.
  assert.ok(probe.indexOf("resolveSafely(url)") < probe.indexOf("rememberChain(url.hostname)"));
  assert.match(probe, /!incompleteChain\(error\)[\s\S]{0,80}throw error/);
});
