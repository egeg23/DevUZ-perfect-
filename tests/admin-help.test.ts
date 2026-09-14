import assert from "node:assert/strict";
import { test } from "node:test";

import { HELP_LOCALES, helpCopy, isHelpLocale } from "@/content/admin-help";
import { ROLES, SECTIONS, canSee } from "@/lib/admin/roles";

/**
 * Инструкции должны описывать ту панель, которая есть, а не ту, что была.
 * Новая вкладка без описания — это пункт меню, про который новому человеку
 * никто ничего не сказал.
 */

test("у каждой вкладки меню есть описание на обоих языках", () => {
  for (const locale of HELP_LOCALES) {
    const { sections } = helpCopy(locale);
    for (const section of SECTIONS) {
      const entry = sections[section.href];
      assert.ok(entry, `${locale}: нет описания вкладки ${section.href} (${section.label})`);
      assert.ok(entry.what.length > 30, `${locale}: описание ${section.href} в два слова`);
    }
    // И наоборот: описание вкладки, которой нет, читатель искать не должен.
    const known = new Set(SECTIONS.map((s) => s.href));
    for (const href of Object.keys(sections)) {
      assert.ok(known.has(href), `${locale}: описана вкладка ${href}, которой нет в меню`);
    }
  }
});

test("каждый читает инструкцию только про свои вкладки", () => {
  const forRole = (role: (typeof ROLES)[number]) =>
    SECTIONS.filter((s) => canSee(role, s.href)).map((s) => s.href);

  assert.ok(forRole("manager").includes("/admin/help"), "менеджер не видит инструкций");
  assert.ok(!forRole("manager").includes("/admin/team"), "менеджер читает про чужую вкладку");
  assert.ok(!forRole("head").includes("/admin/partners"), "руководитель читает про партнёров");
  assert.ok(forRole("admin").length > forRole("manager").length, "у владельца вкладок не больше");
});

test("узбекский текст переведён, а не скопирован", () => {
  // Кириллица в узбекском допустима ровно в одном случае — это название
  // кнопки, которую человек видит на экране: панель русская, и «нажмите
  // Выплачено» ему надо найти глазами. Всё остальное должно быть переведено.
  const uz = helpCopy("uz");
  const strings = [
    uz.title,
    uz.lead,
    uz.sectionsTitle,
    uz.ownerOnly,
    uz.channelsTitle,
    uz.channelsLead,
    uz.rulesTitle,
    uz.askTitle,
    uz.ask,
    ...uz.rules,
    ...Object.values(uz.sections).flatMap((s) => [s.what, ...s.how]),
    ...uz.channels.flatMap((c) => [c.name, c.what, ...c.how]),
  ];

  assert.ok(strings.length > 40, `строк для проверки всего ${strings.length}`);
  for (const line of strings) {
    const withoutQuoted = line.replace(/«[^»]*»/g, "");
    assert.ok(
      !/[а-яё]/i.test(withoutQuoted),
      `не переведено на узбекский: ${line}`,
    );
  }
});

test("язык берётся только из своего списка", () => {
  assert.equal(isHelpLocale("uz"), true);
  assert.equal(isHelpLocale("ru"), true);
  assert.equal(isHelpLocale("en"), false, "английской инструкции нет — не притворяемся");
  assert.equal(isHelpLocale(undefined), false);
  assert.equal(isHelpLocale("<script>"), false);
});
