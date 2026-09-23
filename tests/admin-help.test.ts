import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { HELP_LOCALES, helpCopy, isHelpLocale } from "@/content/admin-help";
import {
  PAGE_TOPICS,
  helpAnchor,
  helpTopicFor,
  isByRole,
  itemRoles,
  parseInline,
  sectionOfHref,
  type HelpItem,
  type Para,
} from "@/lib/admin/help";
import { ROLES, SECTIONS, canSee, type Role } from "@/lib/admin/roles";

/**
 * Инструкции должны описывать ту панель, которая есть, а не ту, что была.
 *
 * Правило владельца: у каждого раздела — подробная инструкция простыми
 * словами, своя для каждой роли, и из каждого раздела кнопка ведёт в нужный
 * пункт. Новая вкладка без описания — это пункт меню, про который новому
 * человеку никто ничего не сказал. Ссылка в инструкции на раздел, куда
 * читателя не пустят, — обещание, которое панель не выполнит.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** Кто читает этот абзац: роль варианта или все, кому виден пункт. */
function readers(item: HelpItem, sectionRoles: readonly Role[]): { role: Role; paras: readonly Para[] }[] {
  const roles = itemRoles(item, sectionRoles);
  return roles.map((role) => ({
    role,
    paras: isByRole(item.body) ? (item.body[role] ?? []) : item.body,
  }));
}

/** Все якоря инструкции и кому каждый виден. */
function anchors(locale: (typeof HELP_LOCALES)[number]): Map<string, Set<Role>> {
  const out = new Map<string, Set<Role>>();
  const { sections } = helpCopy(locale);
  for (const section of SECTIONS) {
    out.set(helpAnchor(section.href), new Set(section.roles));
    for (const item of sections[section.href]?.items ?? []) {
      out.set(helpAnchor(section.href, item.id), new Set(itemRoles(item, section.roles)));
    }
  }
  out.set("channels", new Set(ROLES));
  out.set("rules", new Set(ROLES));
  return out;
}

test("у каждого раздела меню есть инструкция на обоих языках", () => {
  for (const locale of HELP_LOCALES) {
    const { sections } = helpCopy(locale);
    for (const section of SECTIONS) {
      const entry = sections[section.href];
      assert.ok(entry, `${locale}: нет инструкции к разделу ${section.href} (${section.label})`);
      assert.ok(entry.what.length > 60, `${locale}: «что это» у ${section.href} в два слова`);
    }
    // И наоборот: инструкция к разделу, которого нет, читателя только запутает.
    const known = new Set(SECTIONS.map((s) => s.href));
    for (const href of Object.keys(sections)) {
      assert.ok(known.has(href), `${locale}: описан раздел ${href}, которого нет в меню`);
    }
  }
});

test("каждая роль, которая видит раздел, получает про него подробную инструкцию", () => {
  const { sections } = helpCopy("ru");
  for (const section of SECTIONS) {
    for (const role of section.roles) {
      const items = sections[section.href].items.filter((item) => itemRoles(item, section.roles).includes(role));
      assert.ok(items.length >= 2, `${section.href}: для роли ${role} меньше двух пунктов`);
      const words = items
        .flatMap((item) => readers(item, section.roles).find((r) => r.role === role)?.paras ?? [])
        .join(" ")
        .split(/\s+/).length;
      assert.ok(words >= 60, `${section.href}: для роли ${role} всего ${words} слов — это не подробно`);
      for (const item of items) {
        const own = readers(item, section.roles).find((r) => r.role === role);
        assert.ok(own && own.paras.length, `${section.href}#${item.id}: у роли ${role} пустой пункт`);
      }
    }
  }
});

test("пункты не обещают раздела тем, кто его не видит", () => {
  const { sections } = helpCopy("ru");
  for (const section of SECTIONS) {
    for (const item of sections[section.href].items) {
      const roles = item.roles ?? (isByRole(item.body) ? (Object.keys(item.body) as Role[]) : []);
      for (const role of roles) {
        assert.ok(
          section.roles.includes(role),
          `${section.href}#${item.id}: текст для роли ${role}, которую в раздел не пускают`,
        );
      }
    }
  }
});

test("якоря пунктов — латиница и не повторяются", () => {
  for (const locale of HELP_LOCALES) {
    const { sections } = helpCopy(locale);
    for (const section of SECTIONS) {
      const ids = sections[section.href].items.map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length, `${locale} ${section.href}: повтор якоря`);
      for (const id of ids) assert.match(id, /^[a-z][a-z0-9-]*$/, `${locale} ${section.href}: якорь «${id}»`);
    }
  }
});

test("узбекская инструкция — тот же набор пунктов, ролей и абзацев, что русская", () => {
  const ru = helpCopy("ru").sections;
  const uz = helpCopy("uz").sections;
  for (const section of SECTIONS) {
    const a = ru[section.href].items;
    const b = uz[section.href].items;
    assert.deepEqual(
      b.map((i) => i.id),
      a.map((i) => i.id),
      `${section.href}: пункты по-узбекски не те же, что по-русски`,
    );
    a.forEach((item, index) => {
      const other = b[index];
      assert.deepEqual(other.roles ?? null, item.roles ?? null, `${section.href}#${item.id}: другие роли`);
      for (const { role, paras } of readers(item, section.roles)) {
        const theirs = readers(other, section.roles).find((r) => r.role === role);
        assert.equal(
          theirs?.paras.length,
          paras.length,
          `${section.href}#${item.id} (${role}): по-узбекски другое число абзацев`,
        );
      }
    });
  }
});

test("ссылки в тексте ведут туда, куда читателя пустят", () => {
  for (const locale of HELP_LOCALES) {
    const { sections } = helpCopy(locale);
    const known = anchors(locale);
    for (const section of SECTIONS) {
      for (const item of sections[section.href].items) {
        for (const { role, paras } of readers(item, section.roles)) {
          for (const para of paras) {
            for (const part of parseInline(para)) {
              if (part.kind !== "link") continue;
              const where = `${locale} ${section.href}#${item.id} (${role}): ссылка ${part.href}`;
              if (part.href.startsWith("https://")) continue;
              if (part.href.startsWith("#")) {
                const seen = known.get(part.href.slice(1));
                assert.ok(seen, `${where} — такого пункта нет`);
                assert.ok(seen.has(role), `${where} — этой роли пункт не виден`);
                continue;
              }
              assert.ok(part.href.startsWith("/admin"), `${where} — ссылка не в панель`);
              const target = sectionOfHref(part.href);
              assert.ok(target, `${where} — раздела нет`);
              assert.ok(canSee(role, target), `${where} — раздел этой роли закрыт`);
              const hash = part.href.split("#")[1];
              if (hash && target === "/admin/help") {
                const seen = known.get(hash);
                assert.ok(seen?.has(role), `${where} — пункта нет или он не виден`);
              }
            }
          }
        }
      }
    }
  }
});

test("кнопка «Как пользоваться разделом» есть у каждого раздела и ведёт в существующий пункт", () => {
  // Кнопка живёт в шапке: новый раздел получает её без правки своей страницы.
  assert.match(read("components/admin/shell.tsx"), /<SectionHelpLink \/>/);

  const known = anchors("ru");
  for (const section of SECTIONS) {
    const href = helpTopicFor(section.href);
    if (section.href === "/admin/help") {
      assert.equal(href, null, "на странице инструкций кнопка ведёт сама в себя");
      continue;
    }
    assert.ok(href, `${section.href}: кнопке некуда вести`);
    assert.ok(known.has(href.split("#")[1]), `${section.href}: кнопка ведёт в пустоту (${href})`);
  }

  // Карточки внутри разделов — в свой пункт, и он виден всем, кто открывает карточку.
  for (const topic of PAGE_TOPICS) {
    const anchor = helpAnchor(topic.section, topic.item);
    const seen = known.get(anchor);
    assert.ok(seen, `${topic.prefix}: пункта ${anchor} нет`);
    const section = SECTIONS.find((s) => s.href === topic.section)!;
    for (const role of section.roles) assert.ok(seen.has(role), `${topic.prefix}: роль ${role} не видит ${anchor}`);
    assert.equal(helpTopicFor(`${topic.prefix}123`), `/admin/help#${anchor}`);
  }
  assert.equal(helpTopicFor("/admin/leads/abc"), "/admin/help#leads-card");
  assert.equal(helpTopicFor("/admin/prospect?tab=1"), "/admin/help#prospect");
});

test("«?» у блоков ведут в существующие пункты", () => {
  // Якорь пишется только через helpAnchor(): так его можно найти и сверить.
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name)) files.push(path);
    }
  };
  walk(new URL("../app/admin", import.meta.url).pathname);
  walk(new URL("../components/admin", import.meta.url).pathname);

  const known = anchors("ru");
  let hints = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/<HelpHint[^>]*topic=\{([^}]+)\}/g)) {
      hints += 1;
      const call = /^helpAnchor\("([^"]+)"(?:, "([^"]+)")?\)$/.exec(m[1].trim());
      assert.ok(call, `${file}: якорь «?» не через helpAnchor(): ${m[1]}`);
      const anchor = helpAnchor(call[1], call[2]);
      assert.ok(known.has(anchor), `${file}: «?» ведёт в несуществующий пункт ${anchor}`);
    }
  }
  assert.ok(hints >= 5, `«?» у блоков всего ${hints}`);
});

test("узбекский текст переведён, а не скопирован", () => {
  // Кириллица в узбекском допустима ровно в одном случае — это название
  // кнопки или блока, которое человек видит на экране: панель русская, и
  // «нажмите Выплачено» ему надо найти глазами. Всё остальное переведено.
  const uz = helpCopy("uz");
  const strings = [
    uz.title,
    uz.lead,
    uz.sectionsTitle,
    uz.contentsTitle,
    uz.openSection,
    uz.viewAs,
    ...Object.values(uz.roleNames),
    uz.ownerOnly,
    uz.channelsTitle,
    uz.channelsLead,
    uz.rulesTitle,
    uz.askTitle,
    uz.ask,
    ...uz.rules,
    ...Object.values(uz.sections).flatMap((s) => [
      s.what,
      ...s.items.flatMap((i) => [i.title, ...(isByRole(i.body) ? Object.values(i.body).flat() : i.body)]),
    ]),
    ...uz.channels.flatMap((c) => [c.name, c.what, ...c.how]),
  ];

  assert.ok(strings.length > 150, `строк для проверки всего ${strings.length}`);
  for (const line of strings) {
    const plain = String(line)
      .replace(/«[^»]*»/g, "")
      .replace(/\]\([^)]*\)/g, "]");
    assert.ok(!/[а-яё]/i.test(plain), `не переведено на узбекский: ${line}`);
  }
});

test("разметка абзаца: ссылки и выделение, остальное — текст", () => {
  assert.deepEqual(parseInline("Откройте [Касания](/admin/prospect#portion) и **нажмите**."), [
    { kind: "text", text: "Откройте " },
    { kind: "link", text: "Касания", href: "/admin/prospect#portion" },
    { kind: "text", text: " и " },
    { kind: "bold", text: "нажмите" },
    { kind: "text", text: "." },
  ]);
  assert.deepEqual(parseInline("без разметки"), [{ kind: "text", text: "без разметки" }]);
  assert.equal(sectionOfHref("/admin/leads/42"), "/admin");
  assert.equal(sectionOfHref("/admin/help#leads"), "/admin/help");
  assert.equal(sectionOfHref("/admin/nope"), null);
});

test("язык берётся только из своего списка", () => {
  assert.equal(isHelpLocale("uz"), true);
  assert.equal(isHelpLocale("ru"), true);
  assert.equal(isHelpLocale("en"), false, "английской инструкции нет — не притворяемся");
  assert.equal(isHelpLocale(undefined), false);
  assert.equal(isHelpLocale("<script>"), false);
});

test("смотреть инструкцию глазами другой роли может только владелец", () => {
  const page = read("app/admin/help/page.tsx");
  assert.match(page, /staff\.role === "admin" && as && isRole\(as\) \? as : staff\.role/);
});
