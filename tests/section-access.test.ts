import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { ALWAYS_OPEN, SECTIONS, accessFromForm, canSee, navOf, opens, sectionAccess } from "@/lib/admin/roles";

/**
 * Владелец, 11.10.2026: «отдельные настройки доступа, чтобы я мог через
 * галочки выдавать права на просмотр каждого раздела сотрудникам. А то
 * только через тебя сейчас это делается».
 */

test("без галочек всё как у роли, владельцу открыто всё", () => {
  for (const section of SECTIONS) {
    for (const role of ["head", "manager"] as const) {
      const expected = ALWAYS_OPEN.includes(section.href) || canSee(role, section.href);
      assert.equal(opens({ role }, section.href), expected, `${role} ${section.href}`);
    }
    assert.ok(opens({ role: "admin", section_access: { [section.href]: false } }, section.href), "владельца не закрыть");
  }
  assert.equal(opens({ role: "manager" }, "/admin/nowhere"), false);
});

test("галочка открывает раздел сверх роли и закрывает положенный", () => {
  const who = { role: "manager" as const, section_access: { "/admin/partners": true, "/admin/finance": false } };
  assert.ok(opens(who, "/admin/partners"));
  assert.ok(!opens(who, "/admin/finance"));
  const nav = navOf(who).map((s) => s.href);
  assert.ok(nav.includes("/admin/partners"));
  assert.ok(!nav.includes("/admin/finance"));
  // «Лиды» и «Инструкции» не закрываются ничем.
  assert.ok(opens({ role: "manager", section_access: { "/admin": false, "/admin/help": false } }, "/admin"));
  assert.ok(opens({ role: "manager", section_access: { "/admin/help": false } }, "/admin/help"));
});

test("сохраняется только отличие от роли, и форма читается обратно как была", () => {
  const checked = ["/admin/prospect", "/admin/partners", "/admin/orders"];
  const access = accessFromForm("manager", checked);
  for (const [href, on] of Object.entries(access)) assert.notEqual(on, canSee("manager", href), href);
  assert.equal(access["/admin/partners"], true);
  assert.equal(access["/admin/finance"], false);
  assert.ok(!("/admin/prospect" in access), "то, что и так у роли, не пишется");
  for (const section of SECTIONS) {
    if (ALWAYS_OPEN.includes(section.href)) continue;
    assert.equal(opens({ role: "manager", section_access: access }, section.href), checked.includes(section.href), section.href);
  }
  // Всё как у роли — пусто.
  const same = SECTIONS.filter((s) => canSee("head", s.href)).map((s) => s.href);
  assert.deepEqual(accessFromForm("head", same), {});
});

test("из базы берутся только известные разделы и только да/нет", () => {
  assert.deepEqual(sectionAccess({ "/admin/partners": true, "/admin/x": true, "/admin/finance": "yes", "/admin": false }), {
    "/admin/partners": true,
  });
  assert.deepEqual(sectionAccess(null), {});
  assert.deepEqual(sectionAccess(["/admin/partners"]), {});
});

/** Страницы панели: app/admin/<раздел>/…/page.tsx. */
function pages(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...pages(path));
    else if (name === "page.tsx") out.push(path);
  }
  return out;
}

test("каждая страница раздела проверяет доступ по галочкам, а не только по роли", () => {
  const sections = SECTIONS.map((s) => s.href).filter((href) => !ALWAYS_OPEN.includes(href));
  let checked = 0;
  for (const file of pages("app/admin")) {
    const route = "/" + file.replace(/\\/g, "/").replace(/^app\//, "").replace(/\/page\.tsx$/, "");
    const href = sections
      .filter((h) => route === h || route.startsWith(`${h}/`))
      .sort((a, b) => b.length - a.length)[0];
    if (!href) continue;
    const src = readFileSync(file, "utf8");
    assert.match(src, new RegExp(`requireSection\\("${href}"\\)`), `${file}: requireSection("${href}")`);
    assert.doesNotMatch(src, /await requireRole\(|await requireAdmin\(\)/, `${file}: страница не уводит по роли мимо галочек`);
    checked += 1;
  }
  assert.ok(checked >= 25, `проверено страниц: ${checked}`);
});

test("меню, проверка страницы и видео инструкций знают галочки", () => {
  assert.match(readFileSync("components/admin/shell.tsx", "utf8"), /navOf\(staff\)/);
  assert.match(readFileSync("lib/admin/guard.ts", "utf8"), /if \(!opens\(staff, href\)\) redirect\("\/admin"\)/);
  assert.match(readFileSync("app/admin/help/video/[id]/route.ts", "utf8"), /canWatchHelpVideo\(staff, video\.section\)/);
  // Галочки ставит только владелец — и в действии, и в хранилище.
  assert.match(readFileSync("app/admin/team/actions.ts", "utf8"), /export async function saveSections[\s\S]*?await requireAdmin\(\)/);
  assert.match(readFileSync("lib/admin/team.ts", "utf8"), /export async function setSections[\s\S]*?if \(actor\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/);
});
