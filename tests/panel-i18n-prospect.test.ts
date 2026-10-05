import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MapsCampaigns } from "@/components/admin/maps-campaigns";
import { OutreachList } from "@/components/admin/outreach-list";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { ProspectRunner } from "@/components/admin/prospect-runner";
import { TouchLegend } from "@/components/admin/touch-legend";
import { reasonDict, touchErrorDict } from "@/content/admin-panel/prospect";
import { mapsDict } from "@/content/admin-panel/prospect-tools";
import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import type { Prospect } from "@/lib/admin/outreach-store";
import { BOT_BUTTON } from "@/lib/admin/portion";
import { TOUCH_ERRORS, parseTouchError, touchErrorParam } from "@/lib/admin/touch-errors";
import { EMPTY_CONTACTS } from "@/lib/audit/contacts";
import { queriesFor } from "@/lib/maps/places";

/**
 * Раздел «Касания» на трёх языках.
 *
 * Две вещи: каждый ответ действий раздела (`?e=…`, `?maps=…`) есть в
 * словаре — иначе узбекский менеджер увидит пустую плашку или код; и
 * компоненты, которые рисуются из пропсов, в узбекском и польском не
 * показывают русского — кроме данных (название компании, текст письма
 * клиенту) и кнопок бота, который пока пишет по-русски.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

/* ── Коды ответов действий ──────────────────────────────────────────── */

test("каждый ?maps= из действий автопоиска есть в словаре", () => {
  const actions = read("app/admin/prospect/actions.ts");
  const codes = new Set<string>();
  for (const [, code] of actions.matchAll(/maps=([a-z]+)/g)) codes.add(code);
  // `maps=${…}` и `code = …`: коды — строками в тернарниках.
  for (const line of actions.split("\n").filter((l) => /maps=\$\{|code = /.test(l))) {
    for (const [, code] of line.matchAll(/"([a-z]+)"/g)) codes.add(code);
  }
  for (const code of ["created", "invalid", "exists", "gone", "failed", "cap", "ran"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}» — действия поменялись, поправьте тест`);
  }
  for (const code of codes) {
    for (const locale of PANEL_LOCALES) {
      const entry = (mapsDict as Record<string, Record<PanelLocale, unknown>>)[code];
      assert.ok(entry?.[locale], `?maps=${code}: нет текста на «${locale}»`);
    }
  }
});

test("каждый отказ кнопок «Касаний» — кодом, и у кода есть текст на всех языках", () => {
  const actions = read("app/admin/prospect/actions.ts");
  const store = read("lib/admin/outreach-store.ts");
  // В адрес — только код, русский текст туда больше не кладётся.
  assert.doesNotMatch(actions, /encodeURIComponent\(result\.(why|reason)/);
  assert.equal((actions.match(/e=\$\{encodeURIComponent\(touchErrorParam\(result\)\)\}/g) ?? []).length, 5);

  const codes = new Set<string>();
  for (const src of [actions, store]) {
    for (const [, first, second] of src.matchAll(/code: (?:[^?\n,]*\? )?"([a-z_]+)"(?: as const)?(?: : "([a-z_]+)")?/g)) {
      codes.add(first);
      if (second) codes.add(second);
    }
  }
  // Отказы модели — `model_${kind}`, «писать нельзя» — `code: reason`.
  assert.match(store, /code: `model_\$\{trouble\.kind\}`/);
  for (const kind of ["billing", "auth", "limit", "down"]) codes.add(`model_${kind}`);
  assert.match(store, /code: reason/);
  for (const reason of ["no_way", "nothing_to_say", "already"]) codes.add(reason);
  assert.ok(codes.size >= 20, `нашлось кодов: ${codes.size}`);

  for (const code of codes) {
    assert.ok((TOUCH_ERRORS as readonly string[]).includes(code), `код «${code}» не заведён в TOUCH_ERRORS`);
  }
  for (const code of TOUCH_ERRORS) {
    const entry =
      (touchErrorDict as Record<string, Record<PanelLocale, unknown>>)[code] ??
      (reasonDict as Record<string, Record<PanelLocale, unknown>>)[code];
    for (const locale of PANEL_LOCALES) assert.ok(entry?.[locale], `отказ «${code}»: нет текста на «${locale}»`);
  }
});

test("проверка письма едет в адресе кодами с подстановками и возвращается как была", () => {
  const raw = touchErrorParam({
    code: "problems",
    problems: [
      { code: "short", text: "…", args: [40] },
      { code: "no_host", text: "…", args: ["mebel.uz"] },
    ],
  });
  assert.doesNotMatch(raw, /…/, "в адрес попал русский текст проблемы");
  assert.deepEqual(parseTouchError(raw), {
    code: "problems",
    problems: [
      { code: "short", args: [40] },
      { code: "no_host", args: ["mebel.uz"] },
    ],
    detail: "",
  });
  assert.equal(parseTouchError("gone")?.code, "gone");
  // Старая ссылка с русским текстом — не пустое место, а текст как есть.
  assert.deepEqual(parseTouchError("Какая-то старая причина."), {
    code: "defect",
    problems: [],
    detail: "Какая-то старая причина.",
  });
  assert.equal(parseTouchError(undefined), null);
});

/* ── Рендер на трёх языках ──────────────────────────────────────────── */

/** Видимый текст: без тегов и сущностей, плюс title / aria-label / placeholder. */
function visible(html: string): string {
  const attrs = [...html.matchAll(/(?:title|aria-label|placeholder)="([^"]*)"/g)].map((m) => m[1]);
  // Текст письма клиенту в textarea — не интерфейс.
  const body = html.replace(/<textarea[\s\S]*?<\/textarea>/g, " ");
  return [body.replace(/<[^>]+>/g, " "), ...attrs].join(" ").replace(/&[a-z#0-9]+;/g, " ");
}

/** Что в узбекском и польском остаётся по-русски: данные и кнопки бота. */
const ALLOWED: readonly string[] = [
  "Ромашка",
  "Текст письма клиенту",
  "Ответ модели клиенту",
  BOT_BUTTON.self,
  BOT_BUTTON.skip,
];

function assertNoRussian(html: string, where: string) {
  let text = visible(html);
  for (const allowed of ALLOWED) text = text.split(allowed).join(" ");
  assert.ok(!CYRILLIC.test(text), `${where}: русское на экране — ${text.match(/\S*[а-яё]\S*/i)?.[0]}`);
}

const row = (over: Partial<Prospect>): Prospect => ({
  id: "p-1",
  created_at: "2026-09-29T08:00:00Z",
  url: "https://acme.uz/",
  host: "acme.uz",
  label: "Ромашка",
  score: 52,
  findings: [],
  contacts: { ...EMPTY_CONTACTS, telegram: ["@acme"] },
  draft: null,
  message: "Текст письма клиенту",
  niche: null,
  walked: null,
  status: "contacting",
  target: null,
  target_kind: null,
  manual_note: null,
  claimed_by: "s-1",
  claimed_name: "Dilnoza",
  touched_by: null,
  touched_at: null,
  sent_at: null,
  delivered_at: null,
  delivery_note: null,
  failure: null,
  lead_id: null,
  closed_reason: null,
  closed_at: null,
  closed_name: null,
  proto_url: null,
  proto_note: null,
  proto_opens: 0,
  proto_opened_at: null,
  checked_at: new Date().toISOString(),
  check_dropped: [],
  ...over,
});

const ROWS: Prospect[] = [
  row({ id: "a", status: "new", message: null }),
  row({ id: "b" }),
  row({ id: "c", status: "sending", target: "@acme", target_kind: "handle", created_at: "2026-09-29T09:00:00Z" }),
  row({ id: "d", status: "sent", target: "@acme", target_kind: "handle", sent_at: "2026-09-29T09:00:00Z", touched_by: "s-1" }),
  row({
    id: "e",
    status: "sent",
    target: "+998901234567",
    target_kind: "manual",
    sent_at: "2026-09-29T09:00:00Z",
    closed_reason: "ignored",
    closed_name: "Dilnoza",
    closed_at: "2026-09-29T10:00:00Z",
  }),
  row({ id: "f", status: "manual", target: "+998901234567", target_kind: "manual", contacts: EMPTY_CONTACTS }),
  row({ id: "g", status: "new", url: null, host: null, niche: "stomatologiya", message: null, contacts: EMPTY_CONTACTS }),
  // Прототип, собранный заранее: открыт клиентом и ещё не собранный.
  row({
    id: "h",
    proto_url: "https://devuz.studio/proto/0f8fad5bd9cb469fa16570867728950e",
    proto_opens: 3,
    proto_opened_at: "2026-09-29T10:00:00Z",
  }),
  row({ id: "i", proto_url: "https://devuz.studio/proto/1f8fad5bd9cb469fa16570867728950e" }),
  row({ id: "j", proto_note: "services" }),
];

function list(locale: PanelLocale, extra: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(
    createElement(OutreachList, {
      rows: ROWS,
      hour: { count: 2, oldestAgoMs: 20 * 60_000 },
      viewer: { id: "s-1", role: "manager" },
      more: { hidden: 30, href: "/admin/prospect?more=40" },
      replies: { e: "Ответ модели клиенту" },
      sent: true,
      locale,
      ...extra,
    }),
  );
}

test("«Разобранные сайты» на трёх языках: кнопки по-своему, письма клиенту не тронуты", () => {
  const ru = list("ru");
  assert.match(ru, /Связался сам/);
  assert.match(ru, /Отправить в @acme|Связаться/);
  assert.match(ru, /Текст письма клиенту/, "письмо клиенту пропало из поля");
  assert.match(ru, /Прототип собран заранее/);
  assert.match(ru, /клиент открыл 3 раза/);
  assert.match(ru, /клиент ещё не открывал/);
  assert.match(ru, /Прототип заранее не собран: на сайте не нашлось трёх услуг/);
  for (const locale of ["uz", "pl"] as const) {
    const html = list(locale);
    assertNoRussian(html, `список ${locale}`);
    assert.match(html, /Текст письма клиенту/, `${locale}: письмо клиенту должно остаться как есть`);
    assert.match(html, locale === "uz" ? /O‘zim bog‘landim/ : /Skontaktowano samodzielnie/);
    assert.match(html, locale === "uz" ? /Tahlil qilingan saytlar/ : /Przeanalizowane strony/);
    assert.match(html, locale === "uz" ? /Javob bermayapti/ : /Ignoruje/);
  }
});

test("отказы кнопок рисуются на языке панели — каждый код", () => {
  const codes = [
    ...TOUCH_ERRORS.filter((c) => c !== "problems"),
    touchErrorParam({
      code: "problems",
      problems: [
        { code: "short", text: "", args: [40] },
        { code: "no_loss", text: "", args: [24, 48] },
        { code: "no_reference", text: "", args: ["USTA"] },
        { code: "banned", text: "" },
      ],
    }),
  ];
  for (const locale of ["uz", "pl"] as const) {
    for (const code of codes) {
      // Карточка открыта — отказ у кнопки; карточки нет — сверху списка.
      for (const open of ["b", "none"]) {
        const html = list(locale, { error: code, open });
        assertNoRussian(html, `${locale} ?e=${code} open=${open}`);
      }
    }
  }
  // Дефект показывается как есть: прятать текст исключения нельзя.
  assert.match(list("pl", { error: "defect:TypeError: x is undefined", open: "b" }), /TypeError: x is undefined/);
});

test("легенда цифр, автопоиск и прогон списка — на языке панели", () => {
  const render = (locale: PanelLocale, el: ReactElement) =>
    renderToStaticMarkup(createElement(PanelLocaleProvider, { locale, children: el }));
  for (const locale of ["uz", "pl"] as const) {
    assertNoRussian(render(locale, createElement(TouchLegend, { locale })), `легенда ${locale}`);
    for (const notice of ["created", "ran", "cap", "failed", "invalid", "gone", "exists"]) {
      const maps = render(
        locale,
        createElement(MapsCampaigns, {
          campaigns: [
            { id: "c1", created_at: "", niche: "stomatologiya", city: "Toshkent", active: true, variant: 0, exhausted: false, last_run_at: null, found: 40, added: 12 },
            { id: "c2", created_at: "", niche: "mebel", city: "Toshkent", active: false, variant: 0, exhausted: true, last_run_at: null, found: 5, added: 1 },
          ],
          configured: notice !== "failed",
          usage: 3,
          cap: 30,
          pending: 4,
          canEdit: true,
          notice,
          locale,
        }),
      );
      assertNoRussian(maps, `автопоиск ${locale} ${notice}`);
    }
    assertNoRussian(render(locale, createElement(ProspectRunner)), `прогон ${locale}`);
  }
  assert.match(renderToStaticMarkup(createElement(TouchLegend, { locale: "ru" })), /Как читать цифры/);
  // Ташкент по умолчанию узнаётся поиском по районам на любом языке.
  for (const locale of PANEL_LOCALES) {
    assert.ok(queriesFor("stomatologiya", mapsDict.cityDefault[locale]).length > 1, `${locale}: город по умолчанию без районов`);
  }
});
