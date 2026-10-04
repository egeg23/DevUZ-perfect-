import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HelpView } from "@/components/admin/help-view";
import { FLASH_MS } from "@/components/admin/help-search";
import { HELP_LOCALES, helpCopy } from "@/content/admin-help";
import {
  HELP_SEARCH_HITS,
  anchorsFromReply,
  helpIndex,
  indexForModel,
  plainText,
  searchHelp,
  wordSearch,
} from "@/lib/admin/help-search";
import { ROLES, canSee } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";

/**
 * Поиск по инструкции своими словами: модель выбирает пункт, страница
 * прыгает к нему и подсвечивает его пять секунд.
 *
 * Сеть в тестах не трогается: ключа модели нет, и поиск идёт по словам —
 * ровно так, как он работает, когда модель недоступна.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

function staff(locale: "ru" | "uz" | "pl", role: (typeof ROLES)[number]): Staff {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role,
    display_name: "Тест",
    panel_locale: locale,
  } as unknown as Staff;
}

test("в списке для модели — только пункты, которые нарисованы у этой роли на странице", () => {
  for (const role of ROLES) {
    for (const locale of HELP_LOCALES) {
      const html = renderToStaticMarkup(createElement(HelpView, { staff: staff(locale, role), locale, role }));
      const index = helpIndex(locale, role);
      assert.ok(index.length > 10, `${locale} ${role}: пунктов слишком мало`);
      for (const entry of index) {
        assert.ok(html.includes(`id="${entry.anchor}"`), `${locale} ${role}: якоря ${entry.anchor} нет на странице`);
      }
    }
  }
  // Менеджеру не видно «Аккаунтов» — и модель о них не знает.
  assert.ok(!canSee("manager", "/admin/accounts"));
  assert.ok(!helpIndex("ru", "manager").some((e) => e.anchor.startsWith("accounts")));
  assert.ok(helpIndex("ru", "head").some((e) => e.anchor === "accounts-staff"));
});

test("текст пункта для модели — по роли читающего, без разметки", () => {
  const manager = helpIndex("ru", "manager").find((e) => e.anchor === "prospect-queue")!;
  const head = helpIndex("ru", "head").find((e) => e.anchor === "prospect-queue")!;
  assert.match(manager.text, /если руководитель отметил вас/);
  assert.match(head.text, /отмечаете вы или владелец/);
  assert.doesNotMatch(head.text, /\]\(|\*\*/);
  assert.equal(plainText("**«Найти»** и [пункт](#help-search) `X`"), "«Найти» и пункт X");
  const lines = indexForModel(helpIndex("ru", "manager")).split("\n");
  assert.ok(lines.every((line) => /^\[[a-z0-9-]+\] /.test(line)));
});

test("ответ модели: только якоря из списка, без повторов, не больше трёх", () => {
  const index = helpIndex("ru", "manager");
  assert.deepEqual(anchorsFromReply({ anchors: ["leads-transfer", "#leads-queue", "[leads-take]"] }, index), [
    "leads-transfer",
    "leads-queue",
    "leads-take",
  ]);
  // Пункт чужой роли и выдуманный якорь — мимо: прыгать некуда.
  assert.deepEqual(anchorsFromReply({ anchors: ["accounts-staff", "nope", "leads-transfer"] }, index), ["leads-transfer"]);
  assert.deepEqual(anchorsFromReply({ anchors: ["leads-take", "leads-take"] }, index), ["leads-take"]);
  assert.deepEqual(anchorsFromReply({ anchors: "leads-take, leads-queue" }, index), ["leads-take", "leads-queue"]);
  assert.deepEqual(anchorsFromReply(null, index), []);
  const many = index.slice(0, 6).map((e) => e.anchor);
  assert.equal(anchorsFromReply({ anchors: many }, index).length, HELP_SEARCH_HITS);
});

test("без модели — поиск по словам, и он ведёт в нужный пункт", async () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const index = helpIndex("ru", "manager");
    assert.equal(wordSearch("как передать лид другому менеджеру", index)[0], "leads-transfer");
    assert.equal(wordSearch("сменить язык панели", index)[0], "help-language");

    const found = await searchHelp({ question: "как передать лид коллеге", locale: "ru", role: "manager", useModel: true });
    assert.equal(found.by, "words");
    assert.equal(found.hits[0]?.anchor, "leads-transfer");
    assert.ok(found.hits[0]?.title);

    assert.deepEqual(await searchHelp({ question: "х", locale: "ru", role: "manager", useModel: true }), {
      hits: [],
      by: "none",
    });
    const nothing = await searchHelp({ question: "zzzzqx qqqqzz", locale: "ru", role: "manager", useModel: true });
    assert.equal(nothing.by, "none");
  } finally {
    if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved;
  }
});

test("модель — самая дешёвая, роль подменяет только владелец", () => {
  const lib = read("lib/admin/help-search.ts");
  assert.match(lib, /HELP_SEARCH_MODEL \|\| "claude-haiku-4-5"/);
  assert.match(lib, /anthropic\(\)/);
  assert.match(lib, /cache_control/);
  const action = read("app/admin/help/actions.ts");
  assert.match(action, /^"use server";/);
  assert.match(action, /requireStaff\(\)/);
  assert.match(action, /staff\.role === "admin" && as && isRole\(as\) \? as : staff\.role/);
  assert.match(action, /rateLimit\(/);
});

test("подсветка — пять секунд, и в стилях, и в коде", () => {
  assert.equal(FLASH_MS, 5000);
  const css = read("app/globals.css");
  const rule = /\.help-flash\s*\{\s*animation:\s*help-flash\s+([\d.]+)s[^;]*?\s(\d+);/.exec(css);
  assert.ok(rule, "нет правила .help-flash");
  assert.equal(Number(rule[1]) * Number(rule[2]), 5);
  assert.match(css, /prefers-reduced-motion[\s\S]*\.help-flash/);
});

test("поле поиска на странице на каждом языке, подписи из словаря инструкции", () => {
  for (const locale of HELP_LOCALES) {
    const t = helpCopy(locale).search;
    for (const value of Object.values(t)) assert.ok(value.trim(), `${locale}: пустая подпись поиска`);
    if (locale !== "ru") {
      for (const [key, value] of Object.entries(t)) {
        assert.doesNotMatch(value.replace(/«[^»]*»/g, ""), /[Ѐ-ӿ]/, `${locale}: кириллица в search.${key}`);
      }
    }
    for (const role of ROLES) {
      const html = renderToStaticMarkup(createElement(HelpView, { staff: staff(locale, role), locale, role }));
      assert.match(html, /role="search"/);
      assert.ok(html.includes(t.label), `${locale} ${role}: нет «${t.label}»`);
      assert.ok(html.includes(`id="help-search"`), `${locale} ${role}: нет пункта о поиске`);
    }
  }
});
