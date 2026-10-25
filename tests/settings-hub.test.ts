/**
 * «Настройки» — всё, что настраивают, одной страницей (lib/admin/settings.ts).
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». Своё — переключатели на странице, касаний и
 * команды — ссылками туда, где они живут, по роли и галочкам владельца.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { menuOf, tabsOf } from "@/lib/admin/nav";
import { ALWAYS_OPEN, SECTIONS, navOf, opens } from "@/lib/admin/roles";
import { SETTING_LINKS, sectionOfHref, settingsFor } from "@/lib/admin/settings";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ids = (who: Parameters<typeof settingsFor>[0]) => settingsFor(who).map((l) => l.id);

test("раздел «Настройки» — шестерёнкой в шапке: не в меню и не вкладкой, но в поиске и открыт всем", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/settings");
  assert.ok(section?.corner, "раздел в углу шапки");
  assert.ok(ALWAYS_OPEN.includes("/admin/settings"), "галочкой не закрывается");
  for (const role of ["admin", "head", "manager"] as const) {
    assert.ok(navOf({ role }).some((s) => s.href === "/admin/settings"), `${role}: в «Найти раздел»`);
    assert.ok(!menuOf({ role }).some((g) => g.sections.some((s) => s.href === "/admin/settings")), `${role}: не в меню`);
    assert.ok(!tabsOf({ role }).flat().some((s) => s.href === "/admin/settings"), `${role}: не вкладкой`);
    assert.ok(opens({ role, section_access: { "/admin/settings": false } }, "/admin/settings"), `${role}: закрыть нельзя`);
  }
  const shell = read("components/admin/shell.tsx");
  assert.match(shell, /href="\/admin\/settings"/);
  assert.match(read("app/admin/settings/page.tsx"), /requireSection\("\/admin\/settings"\)/);
});

test("адрес настройки — в свой раздел", () => {
  assert.equal(sectionOfHref("/admin/prospect/texts#hello"), "/admin/prospect");
  assert.equal(sectionOfHref("/admin/prospect#autopilot"), "/admin/prospect");
  assert.equal(sectionOfHref("/admin/accounts#circle-niches"), "/admin/accounts");
  assert.equal(sectionOfHref("/admin/team"), "/admin/team");
  assert.equal(sectionOfHref("/admin"), "/admin");
  for (const link of SETTING_LINKS) assert.ok(sectionOfHref(link.href), `${link.id}: адрес вне разделов`);
});

test("кому что: менеджер — тексты, руководитель — касания и уведомления, владелец — всё", () => {
  assert.deepEqual(ids({ role: "manager" }), ["texts"]);
  assert.deepEqual(ids({ role: "head" }), ["texts", "hello", "autopilot", "circles", "accounts", "notices"]);
  assert.deepEqual(ids({ role: "admin" }), SETTING_LINKS.map((l) => l.id));
});

test("галочки владельца: закрыт раздел — нет и его строки; открыт сверх роли — права роли не прибавляются", () => {
  assert.deepEqual(ids({ role: "manager", section_access: { "/admin/prospect": false } }), [], "касания закрыты");
  assert.ok(!ids({ role: "head", section_access: { "/admin/accounts": false } }).includes("circles"));
  assert.ok(!ids({ role: "head", section_access: { "/admin/accounts": false } }).includes("accounts"));
  // Менеджеру открыли «Аккаунты» — смотреть да, а кружки меняет руководитель.
  assert.ok(!ids({ role: "manager", section_access: { "/admin/accounts": true } }).includes("circles"));
});

test("свои переключатели — теми же действиями, что в шапке и на «Главной»", () => {
  const page = read("app/admin/settings/page.tsx");
  assert.match(page, /<LocaleSwitch \/>/);
  assert.match(page, /<NavToggle classic=/);
  assert.match(page, /<AppPush variant="row" \/>/);
  // Галочки бота менеджеру не правятся — только показ (saveNotices у владельца и руководителя).
  assert.match(page, /tunesNotices\(staff\.role, staff\.role, true\)/);
  assert.doesNotMatch(page, /saveNotices/);
});
