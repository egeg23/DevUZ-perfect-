/**
 * Акция 48 часов — только на макет самого клиента, не на пример чужого проекта
 * (foreignMockup в lib/admin/mockup-offer.ts, recordMockupSent).
 *
 * Владелец, 25.10.2026: «Не запускать акцию когда отправляем пример чужого
 * проекта». Повод: YANGI KUN mebel в пример прислали витрину Comfort Mebel, и
 * через 3 минуты клиенту ушли «Спецусловия по макету» на чужой макет.
 *
 * Пары ниже — из mockup_offers на 25.10.2026: свои должны остаться акцией,
 * чужие — нет.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { announceText, foreignMockup, type MockupClient, type MockupOwner } from "@/lib/admin/mockup-offer";

const proto = (names: string[], source: string, prospectId: string | null = null): MockupOwner => ({ prospectId, hosts: [source], names });
const showcase = (name: string): MockupOwner => ({ prospectId: null, hosts: [], names: [name] });
const client = (label: string | null, host: string | null, prospectId: string | null = "p1"): MockupClient => ({
  prospectId,
  host,
  names: label ? [label] : [],
});

test("пример чужого проекта — не макет клиента: акции нет", () => {
  assert.equal(foreignMockup(showcase("Comfort Mebel"), client("YANGI KUN mebel", null)), true);
  assert.equal(foreignMockup(showcase("Apollo Travel"), client("InApp Travel туристическое агентство", "inapp.uz")), true);
  assert.equal(foreignMockup(showcase("MAVERA"), client(null, "alihancompany.kz")), true);
  assert.equal(foreignMockup(proto(["Invis"], "2gis: Invis, игровой клуб"), client("CyberX Tashkent", null)), true);
});

test("свой макет — акция идёт: то же касание, тот же сайт или название", () => {
  assert.equal(foreignMockup(proto(["Karomat"], "https://www.karomat-restaurant.uz"), client("Karomat oilaviy restorani", "karomat-restaurant.uz")), false);
  assert.equal(foreignMockup(proto(["Enotmebel"], "enotmebel.uz"), client("БИН•БЭГ Enotmebel", null)), false);
  assert.equal(foreignMockup(proto(["inapp.uz"], "inapp.uz"), client("InApp Travel туристическое агентство", "inapp.uz")), false);
  assert.equal(foreignMockup(proto(["K Mediwell"], "www.kmediwell.uz"), client(null, "kmediwell.uz")), false);
  assert.equal(foreignMockup(proto(["SEM Travel · турагентство, Ташкент", "SEM Travel"], "https://semtravel.uz"), client("SEM TRAVEL", "semtravel.uz")), false);
  assert.equal(foreignMockup(proto(["vTashkente · главная для презентации"], "https://vtashkente.uz"), client("vTashkente.uz", null)), false);
  assert.equal(foreignMockup(proto(["Учебный центр"], "acupuncture.uz"), client("Учебный центр", null)), false);
  assert.equal(foreignMockup(showcase("MAVERA"), client("Mavera Residence", null)), false);
  // Собран под это касание — свой, как бы ни звался.
  assert.equal(foreignMockup(proto(["Главная для встречи"], "", "p1"), client("Что угодно", null, "p1")), false);
});

test("сверить не с чем — акция как раньше: только @ник или у макета ни сайта, ни названия", () => {
  assert.equal(foreignMockup(proto(["Invis"], "2gis: Invis, игровой клуб"), client(null, null, null)), false);
  assert.equal(foreignMockup({ prospectId: null, hosts: [], names: [] }, client("YANGI KUN mebel", null)), false);
});

test("сверка стоит в recordMockupSent до записи акции, @ник в названия не идёт", () => {
  const store = readFileSync(new URL("../lib/admin/mockup-offer-store.ts", import.meta.url), "utf8");
  const record = store.slice(store.indexOf("export async function recordMockupSent("));
  assert.ok(record.indexOf("foreignMockup(mockup.owner, who)") > 0);
  assert.ok(record.indexOf("foreignMockup(mockup.owner, who)") < record.indexOf('from("mockup_offers").insert('));
  assert.match(record, /names: input\.client \? \[input\.client\] : \[\]/);
});

test("срок в условиях — «48 часов», без ошибки в слове", () => {
  const ru = announceText("ru", "2026-10-27T09:51:20.990Z");
  assert.match(ru, /48 часов, до 27\.10 14:51 по Ташкенту/);
  assert.doesNotMatch(ru, /48 часа/);
});
