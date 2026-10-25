/**
 * «Лиды» доской (lib/admin/lead-board.ts, components/admin/lead-board.tsx).
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Kommo и Pipedrive»:
 * «Погнали по порядку». Колонки — ступени продажи, над колонкой — что бот
 * делает сам, отметка — кнопкой на карточке или переносом в колонку.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LeadBoard } from "@/components/admin/lead-board";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { homeDict } from "@/content/admin-panel/home";
import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import { BOARD_STAGES, MARKABLE, boardOf, columnOf, daysIn, nextMarks } from "@/lib/admin/lead-board";
import type { Deal } from "@/lib/admin/sales-stages";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

const deal = (key: string, at: Deal["at"], ownerId: string | null = "me", label = key): Deal => ({
  key,
  prospectId: key.startsWith("p:") ? key.slice(2) : null,
  leadId: key.startsWith("l:") ? key.slice(2) : null,
  label,
  ownerId,
  at,
  own: {},
  paidUsd: 0,
  priceUsd: null,
});

const DEALS: Deal[] = [
  deal("p:1", { written: "2026-10-20T08:00:00Z" }),
  deal("p:2", { written: "2026-10-20T08:00:00Z", replied: "2026-10-21T08:00:00Z" }),
  deal("l:3", { written: "2026-10-18T08:00:00Z", replied: "2026-10-19T08:00:00Z", interest: "2026-10-22T08:00:00Z", mockup: "2026-10-23T08:00:00Z" }, "other", "Сосед"),
  deal("l:4", { replied: "2026-10-24T08:00:00Z", interest: "2026-10-24T09:00:00Z" }, null, "Ничей"),
];

test("колонка — самая дальняя ступень; «написали» без ответа на доску не идёт", () => {
  assert.equal(columnOf(DEALS[0]), null);
  assert.equal(columnOf(DEALS[1]), "replied");
  assert.equal(columnOf(DEALS[2]), "mockup");
  assert.deepEqual(BOARD_STAGES, ["replied", "interest", "mockup", "shown", "priced", "paid"]);
});

test("менеджеру — только свои; руководителю — все и «Чьи»; поиск по названию", () => {
  const mine = boardOf(DEALS, { id: "me", everyone: false });
  assert.deepEqual(mine.columns.replied.map((c) => c.deal.key), ["p:2"]);
  assert.equal(mine.columns.mockup.length, 0, "чужое менеджеру не видно");
  assert.equal(mine.written, 1, "написали без ответа — числом, со ссылкой на касания");
  // Менеджер «Чьи» не выбирает: даже с owner=free — свои.
  assert.equal(boardOf(DEALS, { id: "me", everyone: false }, { owner: "free" }).columns.interest.length, 0);
  const all = boardOf(DEALS, { id: "me", everyone: true });
  assert.deepEqual(all.columns.mockup.map((c) => c.deal.key), ["l:3"]);
  assert.deepEqual(boardOf(DEALS, { id: "me", everyone: true }, { owner: "free" }).columns.interest.map((c) => c.deal.key), ["l:4"]);
  assert.deepEqual(boardOf(DEALS, { id: "me", everyone: true }, { owner: "other" }).columns.mockup.map((c) => c.deal.key), ["l:3"]);
  assert.deepEqual(boardOf(DEALS, { id: "me", everyone: true }, { q: "сос" }).columns.mockup.map((c) => c.deal.key), ["l:3"]);
});

test("руками — только интерес, показ и цена; макет и оплату база ставит сама", () => {
  assert.deepEqual([...MARKABLE], ["interest", "shown", "priced"]);
  assert.deepEqual(nextMarks("replied"), ["interest", "shown", "priced"]);
  assert.deepEqual(nextMarks("mockup"), ["shown", "priced"]);
  assert.deepEqual(nextMarks("priced"), []);
  assert.equal(daysIn("2026-10-20T08:00:00Z", Date.parse("2026-10-25T09:00:00Z")), 5);
});

const render = (locale: PanelLocale) =>
  renderToStaticMarkup(
    createElement(PanelLocaleProvider, {
      locale,
      children: createElement(LeadBoard, {
        board: boardOf(DEALS, { id: "me", everyone: true }),
        locale,
        names: { me: "Тест", other: "Тест" },
        showOwner: true,
        autopilotLink: true,
        now: Date.parse("2026-10-25T09:00:00Z"),
      }),
    }),
  );

test("доска рисуется на трёх языках: колонки, правила, отметки — кнопками карточки", () => {
  const ru = render("ru");
  for (const stage of BOARD_STAGES) assert.match(ru, new RegExp(`data-board-column="${stage}"`), stage);
  assert.match(ru, /Бот: кружок через 2 мин/);
  assert.match(ru, /Сама, без кнопки/);
  assert.match(ru, /data-board-mark="interest"[\s\S]*?Есть интерес/);
  assert.match(ru, /name="back" value="\/admin\?view=board"/);
  assert.match(ru, /Ещё 1 — написали, ответа нет/);
  for (const locale of ["uz", "pl"] as const) {
    const html = render(locale).replace(/Сосед|Ничей|Тест/g, "");
    const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
    assert.ok(!CYRILLIC.test(text.replace(/«[^»]*»/g, "")), `${locale}: русское «${text.match(/\S*[а-яё]\S*/i)}»`);
  }
  for (const locale of PANEL_LOCALES) for (const s of BOARD_STAGES) assert.ok(homeDict[`rule_${s}`][locale].trim());
});

test("страница: «Список / Доска», доска — из тех же сделок, отметка возвращает на доску", () => {
  const page = read("app/admin/page.tsx");
  assert.match(page, /board \? loadDeals\(\)\.catch\(\(\) => \[\]\) : Promise\.resolve\(\[\]\)/);
  assert.match(page, /boardOf\(deals, \{ id: staff\.id, everyone \}, \{ owner: params\.owner, q \}\)/);
  const actions = read("app/admin/hq/actions.ts");
  assert.match(actions, /if \(back === BOARD_HREF\) return back;/);
  assert.match(actions, /\$\{back\.includes\("\?"\) \? "&" : "\?"\}mk=\$\{result\}/);
  // Перенос нажимает кнопку карточки, своих правил не имеет.
  const drag = read("components/admin/board-drag.tsx");
  assert.match(drag, /mark\.querySelector\("form"\)\?\.requestSubmit\(\)/);
  assert.match(drag, /details\.open = true/);
});
