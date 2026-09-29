import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminShell } from "@/components/admin/shell";
import { HelpView } from "@/components/admin/help-view";
import { helpCopy } from "@/content/admin-help";
import {
  PANEL_LOCALES,
  defineDict,
  isPanelLocale,
  panelLocale,
  pick,
  type Msg,
  type PanelLocale,
  type Tr,
} from "@/lib/admin/i18n";
import { isByRole } from "@/lib/admin/help";
import { ROLES, ROLE_BADGE, SECTIONS, type Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";

/**
 * Панель на трёх языках: русском, узбекском (латиница) и польском.
 *
 * Словарь — единственный источник текста панели. Тест держит три вещи: у
 * каждого ключа есть все языки, узбекский и польский действительно
 * переведены (кириллицы нет), и страницы рисуются на каждом языке без
 * русских слов там, где перевод уже есть.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const CYRILLIC = /[а-яё]/i;

/** Все словари панели: content/admin-panel/*.ts плюс меню и роли. */
async function dictionaries(): Promise<Map<string, Record<string, Tr<Msg>>>> {
  const out = new Map<string, Record<string, Tr<Msg>>>();
  const dir = new URL("../content/admin-panel/", import.meta.url);
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".ts"))) {
    const mod = (await import(new URL(name, dir).href)) as Record<string, unknown>;
    for (const [key, value] of Object.entries(mod)) {
      if (value && typeof value === "object") out.set(`${name}:${key}`, value as Record<string, Tr<Msg>>);
    }
  }
  out.set("roles.ts:SECTIONS", Object.fromEntries(SECTIONS.map((s) => [s.href, s.label])));
  out.set("roles.ts:ROLE_BADGE", ROLE_BADGE);
  return out;
}

/** Строка записи: функцию вызываем с правдоподобными аргументами. */
function sample(msg: Msg): string {
  return typeof msg === "string" ? msg : (msg as (...a: unknown[]) => string)(3, "Имя", 5, 7);
}

/** Где в узбекском и польском можно кириллицу: имена и то, что не переводится. */
const CYRILLIC_OK = /Имя/g;

test("у каждого ключа словаря панели есть все три языка, и они не пустые", async () => {
  const dicts = await dictionaries();
  assert.ok(dicts.size >= 3, `словарей нашлось ${dicts.size}`);
  for (const [where, dict] of dicts) {
    for (const [key, entry] of Object.entries(dict)) {
      for (const locale of PANEL_LOCALES) {
        const value = entry[locale];
        assert.ok(value !== undefined, `${where}.${key}: нет «${locale}»`);
        assert.equal(typeof value, typeof entry.ru, `${where}.${key}: «${locale}» другого вида, чем ru`);
        assert.ok(sample(value).trim(), `${where}.${key}: «${locale}» пустой`);
      }
    }
  }
});

test("узбекский и польский переведены, а не скопированы с русского", async () => {
  for (const [where, dict] of await dictionaries()) {
    for (const [key, entry] of Object.entries(dict)) {
      for (const locale of ["uz", "pl"] as const) {
        const text = sample(entry[locale]).replace(CYRILLIC_OK, "");
        assert.ok(!CYRILLIC.test(text), `${where}.${key} (${locale}) с кириллицей: ${text}`);
      }
    }
  }
});

test("в узбекском словаре — узбекская латиница с o‘ и g‘, а не апострофы", async () => {
  for (const [where, dict] of await dictionaries()) {
    for (const [key, entry] of Object.entries(dict)) {
      const uz = sample(entry.uz);
      assert.ok(!/[og]['`ʻ]/.test(uz), `${where}.${key}: в «${uz}» o‘/g‘ пишутся через ‘`);
    }
  }
});

test("язык берётся только из своего списка, остальное — русский", () => {
  assert.deepEqual([...PANEL_LOCALES], ["ru", "uz", "pl"]);
  assert.equal(isPanelLocale("uz"), true);
  assert.equal(isPanelLocale("pl"), true);
  assert.equal(isPanelLocale("en"), false);
  assert.equal(panelLocale("<script>"), "ru");
  assert.equal(panelLocale(null), "ru");
  assert.equal(panelLocale("pl"), "pl");
});

test("pick достаёт язык, подстановки работают", () => {
  const dict = defineDict({
    hi: { ru: "Привет", uz: "Salom", pl: "Cześć" },
    left: { ru: (n: number) => `осталось ${n}`, uz: (n: number) => `${n} ta qoldi`, pl: (n: number) => `zostało ${n}` },
  });
  assert.equal(pick(dict, "uz").hi, "Salom");
  assert.equal(pick(dict, "pl").left(3), "zostało 3");
  assert.equal(pick(dict, "ru").left(2), "осталось 2");
});

test("язык панели в базе: колонка на три языка, по умолчанию русский", () => {
  const up = read("supabase/migrations/0069_panel_locale.sql");
  assert.match(up, /panel_locale text not null default 'ru'/);
  assert.match(up, /check \(panel_locale in \('ru', 'uz', 'pl'\)\)/);
  assert.match(read("supabase/migrations/0069_panel_locale.down.sql"), /drop column if exists panel_locale/);
  assert.match(read("lib/admin/session.ts"), /STAFF_COLUMNS = "[^"]*panel_locale/);
});

test("язык меняет себе только сам сотрудник — из сессии, а не из формы", () => {
  const actions = read("app/admin/actions.ts");
  const fn = actions.slice(actions.indexOf("export async function setPanelLocale"));
  assert.match(fn, /const staff = await currentStaff\(\);/);
  assert.match(fn, /setStaffLocale\(staff\.id, locale\)/);
  assert.match(fn, /if \(!isPanelLocale\(locale\)\) return;/);
  assert.doesNotMatch(fn, /formData\.get\("(staff|id)/);
});

const staff = (locale: PanelLocale, role: Role = "manager"): Staff => ({
  id: "s-1",
  telegram_user_id: 1,
  username: null,
  display_name: "Тест",
  role,
  panel_locale: locale,
});

/** Видимый текст разметки: без тегов, скриптов, атрибутов и имени сотрудника. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/Тест/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
}

/** Подписи из разметки: title, aria-label. */
function labels(html: string): string[] {
  return [...html.matchAll(/(?:title|aria-label)="([^"]*)"/g)].map((m) => m[1]);
}

test("каркас панели рисуется на каждом языке, и в узбекском и польском нет русского", () => {
  globalThis.__pathname = "/admin/prospect";
  for (const role of ROLES) {
    const ru = renderToStaticMarkup(createElement(AdminShell, { staff: staff("ru", role), children: "x" }));
    assert.match(ru, /Выйти/);
    assert.match(ru, />Касания</);
    for (const locale of ["uz", "pl"] as const) {
      const html = renderToStaticMarkup(createElement(AdminShell, { staff: staff(locale, role), children: "x" }));
      // Названия языков в переключателе — каждое на самом себе.
      const text = visibleText(html);
      assert.ok(!CYRILLIC.test(text), `${locale} ${role}: русское в шапке: ${text.match(/\S*[а-яё]\S*/i)}`);
      for (const label of labels(html).filter((l) => l !== "Русский")) {
        assert.ok(!CYRILLIC.test(label), `${locale} ${role}: русская подпись «${label}»`);
      }
      assert.match(html, locale === "uz" ? />Chiqish</ : />Wyloguj</);
      assert.match(html, locale === "uz" ? />Aloqalar</ : />Kontakty</);
    }
  }
});

test("переключатель показывает три языка и отмечает текущий", () => {
  for (const locale of PANEL_LOCALES) {
    const html = renderToStaticMarkup(createElement(AdminShell, { staff: staff(locale), children: "x" }));
    const current = /<span aria-current="true"[^>]*>([A-Z]{2})<\/span>/.exec(html);
    assert.equal(current?.[1], locale.toUpperCase());
    for (const other of PANEL_LOCALES.filter((l) => l !== locale)) {
      assert.match(html, new RegExp(`name="locale"[^>]*>${other.toUpperCase()}<|value="${other}"`));
    }
  }
});

test("«Как пользоваться разделом» ведёт в инструкцию на языке панели", () => {
  globalThis.__pathname = "/admin/prospect";
  const uz = renderToStaticMarkup(createElement(AdminShell, { staff: staff("uz"), children: "x" }));
  assert.match(uz, /href="\/admin\/help\?lang=uz#prospect"/);
  const ru = renderToStaticMarkup(createElement(AdminShell, { staff: staff("ru"), children: "x" }));
  assert.match(ru, /href="\/admin\/help#prospect"/);
  // Польской инструкции ещё нет — открывается русская, а не пустая страница.
  const pl = renderToStaticMarkup(createElement(AdminShell, { staff: staff("pl"), children: "x" }));
  assert.match(pl, /href="\/admin\/help#prospect"/);
});

test("инструкция рисуется на каждом языке для каждой роли", () => {
  for (const role of ROLES) {
    for (const locale of ["ru", "uz"] as const) {
      const html = renderToStaticMarkup(createElement(HelpView, { staff: staff(locale, role), locale, role }));
      assert.match(html, new RegExp(helpCopy(locale).title));
      const menu = SECTIONS.find((s) => s.href === "/admin/prospect")!;
      assert.match(html, new RegExp(`>${menu.label[locale]}<`), `${locale} ${role}: раздел не своим названием`);
    }
  }
});

/**
 * Узбекская инструкция называет кнопки так, как они написаны на узбекской
 * панели. Пока не весь текст панели в словаре, проверка такая: если
 * название в «ёлочках» — это русский текст из словаря, узбекская инструкция
 * обязана звать его по-узбекски, из того же словаря.
 *
 * Исключения — сообщения и кнопки бота: бот пишет по-русски, пока не научен
 * языку панели (отдельный этап), и человек ищет в Telegram русскую кнопку.
 */
const BOT_TEXT_IN_UZ: readonly string[] = ["«Команда» tugmasi bilan xabar keladi"];

test("узбекская инструкция зовёт кнопки так, как они написаны на узбекской панели", async () => {
  const ruToUz = new Map<string, string>();
  for (const dict of (await dictionaries()).values()) {
    for (const entry of Object.values(dict)) {
      if (typeof entry.ru === "string") ruToUz.set(entry.ru, entry.uz as string);
    }
  }
  const uz = helpCopy("uz");
  const texts = [
    uz.lead,
    ...uz.rules,
    ...Object.values(uz.sections).flatMap((s) => [
      s.what,
      ...s.items.flatMap((i) => [i.title, ...(isByRole(i.body) ? Object.values(i.body).flat() : i.body)]),
    ]),
    ...uz.channels.flatMap((c) => [c.what, ...c.how]),
  ];
  for (let text of texts) {
    for (const allowed of BOT_TEXT_IN_UZ) text = String(text).replace(allowed, "");
    for (const [, name] of String(text).matchAll(/«([^»]+)»/g)) {
      const want = ruToUz.get(name);
      assert.ok(!want, `в узбекской инструкции «${name}», а на узбекской панели — «${want}»: ${text.slice(0, 120)}`);
    }
  }
});

test("русская инструкция зовёт разделы так, как они написаны в русском меню", () => {
  const ru = read("content/admin-help-ru.ts");
  for (const [, name, href] of ru.matchAll(/\[«([^»]+)»\]\((\/admin[^)#]*)/g)) {
    const section = SECTIONS.find((s) => s.href === href);
    if (section) assert.equal(name, section.label.ru, `ссылка на ${href} названа «${name}»`);
  }
  const uz = read("content/admin-help-uz.ts");
  for (const [, name, href] of uz.matchAll(/\[«([^»]+)»\]\((\/admin[^)#]*)/g)) {
    const section = SECTIONS.find((s) => s.href === href);
    if (section) assert.equal(name, section.label.uz, `uz: ссылка на ${href} названа «${name}»`);
  }
});

declare global {
  var __pathname: string | undefined;
}

test("формы слова при числе: русский и польский считают по-разному", async () => {
  const { plural } = await import("@/lib/admin/i18n");
  const ru = (n: number) => plural("ru", n, "лид", "лида", "лидов");
  assert.deepEqual([1, 2, 5, 11, 21, 22, 25, 112].map(ru), ["лид", "лида", "лидов", "лидов", "лид", "лида", "лидов", "лидов"]);
  const pl = (n: number) => plural("pl", n, "lead", "leady", "leadów");
  assert.deepEqual([1, 2, 5, 12, 21, 22, 25, 0].map(pl), ["lead", "leady", "leadów", "leadów", "leadów", "leady", "leadów", "leadów"]);
});
