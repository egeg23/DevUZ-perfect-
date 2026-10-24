/**
 * Пропуск кейса (lib/proto/case-link.ts, lib/proto/case-pass.ts).
 *
 * Владелец, 24.10.2026: Александр выдал пароль к SamAuto, и посетитель сайта,
 * нажавший «Открыть прототип» в кейсе, увидел окно пароля. «Я бы не хотел,
 * чтобы выданный пароль к самому макету ограничивал то, что видит
 * пользователь, когда он переходит в кейсы». Пароль закрывает прямую ссылку
 * клиента, кнопка открытого кейса пускает всегда, а гость сайта в журнал
 * показа как клиент не пишется.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cases } from "@/content/cases";
import { CASE_FROM, caseProtoHref } from "@/lib/proto/case-link";
import { caseCookieHeader, hasCaseCookie, isOpenCase, openCaseTokens, wantsCasePass } from "@/lib/proto/case-pass";
import { accessBy } from "@/lib/proto/serve";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const samauto = cases.find((c) => c.slug === "samauto")?.prototype;
const closedCase = cases.find((c) => c.prototype && !c.prototype.open)?.prototype;
const tokenOf = (href: string) => href.slice("/proto/".length);

test("кнопка: открытый кейс — с пропуском, кейс по паролю — прямо на пароль", () => {
  assert.ok(samauto?.open, "SamAuto в кейсах открыт без пароля");
  assert.equal(caseProtoHref(samauto), `${samauto.href}?from=${CASE_FROM}`);
  assert.ok(closedCase, "нет кейса с прототипом по паролю");
  assert.equal(caseProtoHref(closedCase), closedCase.href);
});

test("пропуск — только прототипам открытых кейсов", () => {
  assert.ok(samauto && closedCase);
  assert.ok(isOpenCase(tokenOf(samauto.href)));
  assert.ok(!isOpenCase(tokenOf(closedCase.href)), "кейс по паролю пропуска не даёт");
  assert.ok(!isOpenCase("A".repeat(43)));
  assert.deepEqual([...openCaseTokens([{ prototype: { href: "/proto/abc", teaser: "/cases/x/teaser" } }])], []);
  assert.ok(wantsCasePass(new URL(`https://devuz.studio${caseProtoHref(samauto)}`)));
  assert.ok(!wantsCasePass(new URL(`https://devuz.studio${samauto.href}`)));
});

test("кука пропуска — на адрес прототипа, без доступа из скриптов", () => {
  const token = "T".repeat(43);
  const set = caseCookieHeader(token);
  for (const part of ["proto_case=1", `Path=/proto/${token}`, "HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(set.includes(part), part);
  assert.ok(hasCaseCookie("a=b; proto_case=1"));
  assert.ok(!hasCaseCookie("proto_case=0"));
  assert.ok(!hasCaseCookie(null));
});

test("закрытый паролем прототип: с пропуском кейса открыт, без него — пароль", async () => {
  assert.ok(samauto && closedCase);
  const page = { id: "fc0236e7-af21-44f9-bf8d-b86a50f39392", lock: null, closed: true };
  assert.equal(await accessBy("proto_case=1", page, tokenOf(samauto.href)), "case");
  assert.equal(await accessBy(null, page, tokenOf(samauto.href)), null, "прямая ссылка клиента — по паролю");
  assert.equal(await accessBy("proto_case=1", page, tokenOf(closedCase.href)), null, "кука не открывает кейс по паролю");
});

test("сервер: пропуск до проверки пароля, гость кейса — не клиент, ключ сцены — тоже по пропуску", () => {
  const serve = read("lib/proto/serve.ts");
  const pass = serve.indexOf("wantsCasePass(new URL(request.url))");
  assert.ok(pass > 0 && pass < serve.indexOf("const access = await accessBy("), "пропуск выдаётся раньше формы пароля");
  assert.match(serve, /caseCookieHeader\(token\)/);
  assert.match(serve, /access !== "team" && access !== "case"/, "гость кейса пишется в журнал показа как клиент");
  assert.match(read("lib/proto/promo-store.ts"), /\{ id: String\(data\.id\), lock, closed \}, token\)\)/, "ключ сцены не видит пропуск кейса");
  assert.match(read("components/sections/proto-reel.tsx"), /href=\{caseProtoHref\(proto\)\}/, "ролик на главной ведёт мимо пропуска");
  // Клиентский модуль кнопки не тянет список кейсов и node.
  const link = read("lib/proto/case-link.ts");
  assert.doesNotMatch(link, /^import \{[^}]*\} from "@\/content\/cases"/m);
  assert.doesNotMatch(link, /node:/);
});
