import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PROMO_MAX, promoOf, promosInText, wordCandidates, wordCode } from "@/lib/partners/rules";

/**
 * Промокод партнёра — слово, которое клиент называет вслух. Владелец,
 * 05.11.2026, на разбор «как мы поймём, что клиент от этого блогера»:
 * «Одну ссылку нет, но остальное да, делаем». Ссылка теряется, когда клиент
 * пишет менеджеру или звонит; слово — нет.
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("слово из имени: имя человека, название агентства, латиницей", () => {
  assert.equal(wordCode("Азиз Каримов"), "AZIZ");
  assert.equal(wordCode("Жасур"), "JASUR");
  assert.equal(wordCode("Хуршид Ғофуров"), "XURSHID");
  assert.equal(wordCode("G'ayrat"), "GAYRAT");
  assert.equal(wordCode("@dilnoza_blog"), "DILNOZA");
  assert.equal(wordCode("Media Pro Agency", "agency"), "MEDIAPRO");
  assert.equal(wordCode("ООО «Ромашка Плюс»", "agency"), "ROMASHKA");
});

test("короткое, служебное и студийное — не промокод", () => {
  assert.equal(wordCode("М"), "", "короче трёх букв — пробуют ник");
  assert.equal(wordCode("Ян"), "YAN", "три буквы латиницей — уже слово");
  assert.equal(wordCode("Admin"), "", "зарезервированное");
  assert.equal(wordCode("DevUz Client Manager", "agency"), "", "похоже на студию");
});

test("занято — AZIZ2, AZIZ3…, не длиннее предела", () => {
  const list = wordCandidates("AZIZ");
  assert.deepEqual(list.slice(0, 3), ["AZIZ", "AZIZ2", "AZIZ3"]);
  for (const w of wordCandidates("ABCDEFGHIJKL")) assert.ok(w.length <= PROMO_MAX, w);
  assert.deepEqual(wordCandidates(""), []);
});

test("промокод в тексте — только после слова «промокод/код/promo»", () => {
  assert.deepEqual(promosInText("Здравствуйте, промокод AZIZ, хочу сайт"), ["AZIZ"]);
  assert.deepEqual(promosInText("код: aziz"), ["AZIZ"]);
  assert.deepEqual(promosInText("promokod Azizbek"), ["AZIZBEK"]);
  assert.deepEqual(promosInText("Промо АЗИЗ"), ["AZIZ"], "кириллицей тоже");
  assert.deepEqual(promosInText("меня зовут Азиз"), [], "имя без слова «промокод» — не промокод");
  assert.deepEqual(promosInText("штрихкод ABC123"), [], "«код» внутри слова");
  assert.deepEqual(promosInText(null), []);
});

test("промокод — слово, а нет его — старый код", () => {
  assert.equal(promoOf({ promo: "AZIZ", code: "K7MP2QX" }), "AZIZ");
  assert.equal(promoOf({ promo: null, code: "K7MP2QX" }), "K7MP2QX");
});

test("слово узнаётся везде: ссылка, текст заявки, бот, чат, карточка лида", () => {
  const store = read("lib/partners/store.ts");
  const resolve = store.slice(store.indexOf("export async function resolveCode("), store.indexOf("export async function projectsOfPartners("));
  assert.match(resolve, /\.eq\("promo", code\)/, "ссылка ?ref=AZIZ не узнаёт промокод");
  assert.match(store, /if \(await codeTaken\(db, code, partner\.id\)\) return \{ ok: false, reason: "taken" \};/, "код ссылки может совпасть с чужим промокодом");
  assert.match(store, /if \(await codeTaken\(db, code\)\) return \{ ok: false, reason: "taken" \};/, "код руками может совпасть с чужим промокодом");

  const assign = store.slice(store.indexOf("export async function assignLeadPartner("), store.indexOf("export async function notifyPartner("));
  assert.match(assign, /if \(lead\.partner_id\) return \{ ok: false, reason: "already" \};/, "чужой лид перезапишется: клиент того, кто записан первым");
  assert.match(assign, /await attributeLead\(leadId, hit\.code,/, "проверки «клиент уже был у студии» нет");

  const attribute = read("lib/partners/attribute.ts");
  assert.match(attribute, /if \(!code && lead\.said\) \{/, "текст важнее ссылки");
  assert.match(attribute, /if \(word && !\(await leadHasPartner\(leadId\)\)\) \{/);

  assert.match(read("lib/qualify/engine.ts"), /\{ \.\.\.lead, said \}/, "бот и чат не передают слова клиента");
  assert.match(read("app/api/lead/route.ts"), /\{ \.\.\.lead, said: message \}/, "форма не передаёт текст заявки");
});

test("менеджер вписывает промокод: в карточке лида и при «Добавить лид вручную»", () => {
  const actions = read("app/admin/leads/[id]/actions.ts");
  const save = actions.slice(actions.indexOf("export async function savePartnerAction("));
  assert.match(save, /if \(!canEdit\(lead, staff\)\) redirect/, "вписать может кто угодно");
  assert.match(save, /assignAndNotify\(leadId/);
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /mine && !lead\.partner_id \? \(/, "поле у чужого или уже записанного лида");
  assert.match(page, /action=\{savePartnerAction\}/);
  assert.match(read("components/admin/lead-add.tsx"), /name="promo"/);
  assert.match(read("app/admin/actions.ts"), /assignAndNotify\(result\.id, promo, staff/);
});

test("партнёр видит свой промокод и выбирает скидку по нему", () => {
  const view = read("components/partners/cabinet-view.tsx");
  assert.match(view, /id="promo-code"/);
  assert.match(view, /action=\{actions\.setPromoPerk\}/);
  assert.match(view, /botLink\(company\.telegram, promoOf\(partner\)\)/, "в ссылке на бота старый код");
  assert.match(read("lib/partners/bot.ts"), /promoOf\(partner\),\n\s*\)/, "бот не называет промокод");
  const migration = read("supabase/migrations/0178_partner_promo.sql");
  assert.match(migration, /create unique index if not exists partners_promo_key/);
});
