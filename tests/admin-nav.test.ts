import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminShell } from "@/components/admin/shell";
import { navGroupDict } from "@/content/admin-panel/shell";
import { PANEL_LOCALES, pick, type PanelLocale } from "@/lib/admin/i18n";
import { findSections, findable, foldName, isSingle, menuOf, parentsOf, tabsOf } from "@/lib/admin/nav";
import { NAV_GROUPS, ROLES, SECTIONS, navOf, type Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";

/**
 * Меню панели группами и быстрый переход.
 *
 * Владелец, 12.10.2026: «вкладок куча, пока в каждую задаешь — с ума
 * пойдешь». Тест держит: каждый раздел в какой-то группе, группы не
 * меняют, кому что открыто, группа из одного пункта — просто ссылка, и
 * «Найти раздел» находит раздел по началу названия на каждом языке.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("каждый раздел — в одной из групп меню, и у каждой группы есть название на трёх языках", () => {
  for (const section of SECTIONS) {
    assert.ok(NAV_GROUPS.includes(section.group), `${section.href}: группа «${section.group}» не из списка`);
  }
  for (const group of NAV_GROUPS) {
    assert.ok(SECTIONS.some((s) => s.group === group), `группа ${group} пустая у всех`);
    for (const locale of PANEL_LOCALES) assert.ok(navGroupDict[group][locale].trim(), `${group}: нет «${locale}»`);
  }
  // Инструкции — отдельно и одни: «всегда под рукой», ссылкой, а не списком.
  assert.deepEqual(
    SECTIONS.filter((s) => s.group === "help").map((s) => s.href),
    ["/admin/help"],
  );
});

test("группы и вкладки не меняют, что кому открыто: меню плюс вкладки — те же разделы, что navOf", () => {
  for (const role of ROLES) {
    const who = { role };
    const menu = menuOf(who);
    const flat = menu.flatMap((g) => g.sections.map((s) => s.href));
    const tabs = tabsOf(who).flatMap((family) => family.slice(1).map((s) => s.href));
    assert.equal(new Set([...flat, ...tabs]).size, flat.length + tabs.length, `${role}: раздел и в меню, и вкладкой`);
    assert.deepEqual([...flat, ...tabs].sort(), navOf(who).map((s) => s.href).sort(), `${role}: разделы в меню не те`);
    assert.ok(menu.every((g) => g.sections.length > 0), `${role}: пустая группа`);
    assert.deepEqual(
      menu.map((g) => g.group),
      NAV_GROUPS.filter((g) => menu.some((m) => m.group === g)),
      `${role}: группы не по порядку`,
    );
  }
  // У владельца разделов больше двадцати — а пунктов в меню 17, остальное вкладками.
  assert.ok(navOf({ role: "admin" }).length > 20);
  assert.equal(menuOf({ role: "admin" }).flatMap((g) => g.sections).length, 17);
  assert.equal(menuOf({ role: "admin" }).length, NAV_GROUPS.length);
});

/**
 * Владелец, 25.10.2026, на «какие разделы можно объединить»: «Погнали по
 * порядку». Редкое — вкладкой своего раздела, адреса и права прежние.
 */
test("вкладки: редкие разделы — над страницей своего, у каждого роль та же", () => {
  const family = (who: Parameters<typeof tabsOf>[0], href: string) =>
    tabsOf(who).find((f) => f[0].href === href)?.map((s) => s.href);
  const admin = { role: "admin" as const };
  assert.deepEqual(family(admin, "/admin/prospect"), ["/admin/prospect", "/admin/scout", "/admin/talks", "/admin/accounts"]);
  assert.deepEqual(family(admin, "/admin/mockups"), ["/admin/mockups", "/admin/proto"]);
  assert.deepEqual(family(admin, "/admin/projects"), ["/admin/projects", "/admin/contracts"]);
  assert.deepEqual(family(admin, "/admin/finance"), ["/admin/finance", "/admin/expenses"]);
  assert.deepEqual(family(admin, "/admin/orders"), ["/admin/orders", "/admin/releases"]);
  assert.deepEqual(family(admin, "/admin/traffic"), ["/admin/traffic", "/admin/ads"]);
  assert.deepEqual(family(admin, "/admin/team"), ["/admin/team", "/admin/candidates"]);
  assert.deepEqual(family(admin, "/admin/stats"), ["/admin/stats", "/admin/stages"]);
  assert.deepEqual(family(admin, "/admin/audit"), ["/admin/audit", "/admin/usage"]);
  // Менеджеру — только положенное: без «Аккаунтов», «Прототипов», «Расходов».
  const manager = { role: "manager" as const };
  assert.deepEqual(family(manager, "/admin/prospect"), ["/admin/prospect", "/admin/scout", "/admin/talks"]);
  assert.equal(family(manager, "/admin/mockups"), undefined, "одна вкладка — не выбор");
  assert.equal(family(manager, "/admin/finance"), undefined);
  // Вкладка у вкладки не бывает, и родитель — раздел из списка.
  for (const s of SECTIONS.filter((x) => x.parent)) {
    const parent = SECTIONS.find((x) => x.href === s.parent);
    assert.ok(parent && !parent.parent, `${s.href}: родитель ${s.parent}`);
    assert.equal(s.group, parent!.group, `${s.href}: группа не родителя`);
  }
  assert.equal(parentsOf(admin)["/admin/contracts"], "/admin/projects");
});

test("закрыт раздел — его вкладка встаёт в меню сама, а не теряется", () => {
  const who = { role: "manager" as const, section_access: { "/admin/prospect": false } };
  const prospect = menuOf(who).find((g) => g.group === "prospect");
  assert.deepEqual(prospect?.sections.map((s) => s.href), ["/admin/scout", "/admin/talks"]);
  assert.equal(tabsOf(who).find((f) => f[0].href === "/admin/prospect"), undefined);
});

test("группа, где у человека один раздел, — просто ссылка; закрытый раздел группу не рисует", () => {
  const manager = menuOf({ role: "manager" });
  // Ежедневное — прямой кнопкой: «Лиды», «Холодные касания», «Макеты» —
  // группы из одного раздела. Из «Маркетинга» менеджеру — ничего.
  for (const [group, href] of [["leads", "/admin"], ["prospect", "/admin/prospect"], ["mockups", "/admin/mockups"]] as const) {
    const g = manager.find((m) => m.group === group)!;
    assert.ok(isSingle(g), `${group}: не просто ссылка`);
    assert.equal(g.sections[0].href, href);
  }
  // «Ступени продажи» — вкладкой «Статистики»: в «Отчётах» у менеджера один пункт, и он ссылкой.
  assert.deepEqual(manager.find((g) => g.group === "reports")?.sections.map((s) => s.href), ["/admin/stats"]);
  assert.equal(manager.find((g) => g.group === "marketing"), undefined);
  // Обучение выключено для команды — «Команда» у менеджера пропадает целиком.
  const off = menuOf({ role: "manager", sections_off: ["/admin/learn"] });
  assert.equal(off.find((g) => g.group === "team"), undefined);
  assert.ok(isSingle(menuOf({ role: "admin" }).find((g) => g.group === "help")!));
});

test("галочка владельца кладёт открытый раздел в его группу", () => {
  const plain = menuOf({ role: "manager" });
  assert.ok(!plain.some((g) => g.sections.some((s) => s.href === "/admin/traffic")));
  const who = { role: "manager" as const, section_access: { "/admin/traffic": true, "/admin/talks": false } };
  const granted = menuOf(who);
  const marketing = granted.find((g) => g.group === "marketing");
  assert.deepEqual(marketing?.sections.map((s) => s.href), ["/admin/traffic"]);
  assert.ok(isSingle(marketing!), "один открытый раздел группы — ссылка");
  const prospect = tabsOf(who).find((f) => f[0].href === "/admin/prospect")!;
  assert.ok(!prospect.some((s) => s.href === "/admin/talks"), "закрытый галочкой раздел из вкладок ушёл");
});

const items = (locale: PanelLocale) =>
  SECTIONS.map((s) => findable(s, pick(navGroupDict, locale)[s.group], locale));

test("«Найти раздел» находит раздел по началу названия на каждом языке", () => {
  const first = (locale: PanelLocale, q: string) => findSections(q, items(locale))[0]?.href;
  assert.equal(first("ru", "дог"), "/admin/contracts");
  assert.equal(first("ru", "ДОГ"), "/admin/contracts");
  assert.equal(first("ru", "расх"), "/admin/expenses");
  assert.equal(first("ru", "ии"), "/admin/ai-staff");
  assert.equal(first("uz", "shart"), "/admin/contracts");
  assert.equal(first("uz", "yoriq"), "/admin/help", "o‘ без апострофа тоже находится");
  assert.equal(first("uz", "yo'riq"), "/admin/help");
  assert.equal(first("pl", "umo"), "/admin/contracts");
  assert.equal(first("pl", "zespol"), "/admin/team", "польские буквы можно не набирать");
  // Каждый раздел находится по своему названию на каждом языке.
  for (const locale of PANEL_LOCALES) {
    for (const section of SECTIONS) {
      assert.equal(first(locale, section.label[locale]), section.href, `${locale}: «${section.label[locale]}»`);
    }
  }
});

test("поиск: сначала начало названия, потом слово внутри, потом группа; пустой — все разделы", () => {
  const ru = items("ru");
  assert.equal(findSections("", ru).length, SECTIONS.length);
  assert.deepEqual(findSections("сотр", ru).map((i) => i.href), ["/admin/ai-staff"]);
  // «Деньги» — группа: находятся все её разделы, вкладки тоже.
  const money = findSections("деньг", ru).map((i) => i.href);
  for (const href of ["/admin/projects", "/admin/contracts", "/admin/finance", "/admin/expenses", "/admin/orders", "/admin/releases"]) {
    assert.ok(money.includes(href), href);
  }
  // Набрал на другом языке — тоже найдётся, но после своих.
  assert.equal(findSections("umowy", ru)[0]?.href, "/admin/contracts");
  assert.deepEqual(findSections("щщщ", ru), []);
  assert.equal(foldName("Yo‘riqnoma"), "yoriqnoma");
  assert.equal(foldName("Ёлка"), "елка");
});

const staff = (locale: PanelLocale, role: Role): Staff => ({
  id: "s-1",
  telegram_user_id: 1,
  username: null,
  display_name: "Тест",
  role,
  panel_locale: locale,
});

test("шапка владельца: группы вместо двадцати пунктов, открытая группа подсвечена", () => {
  globalThis.__pathname = "/admin/contracts/42";
  const html = renderToStaticMarkup(createElement(AdminShell, { staff: staff("ru", "admin"), children: "x" }));
  for (const group of ["Деньги", "Маркетинг", "Команда", "Отчёты"]) {
    assert.match(html, new RegExp(`aria-haspopup="true"[^>]*>${group}`), `нет группы «${group}»`);
  }
  assert.doesNotMatch(html, />Продажи</, "группа «Продажи» ушла: её разделы — вкладками");
  // Открытая группа — зелёная, рядом — открытая вкладка своим именем.
  assert.match(html, /border-green font-medium text-green[^"]*">Деньги<span[^>]*>· Договоры/);
  // Ежедневное — ссылками без списка, сразу за «Главной» и «Задачами».
  for (const [href, name] of [["/admin", "Лиды"], ["/admin/prospect", "Холодные касания"], ["/admin/mockups", "Макеты"]]) {
    assert.match(html, new RegExp(`href="${href}"[^>]*>${name}<`), `${name}: не прямая кнопка`);
  }
  // «Договоры» — вкладка «Проектов»: в списке группы горит «Проекты».
  assert.match(html, /aria-current="page"[^>]*>Проекты</);
  // В карточке договора строки вкладок нет — она только на страницах разделов.
  assert.doesNotMatch(html, /aria-label="Вкладки раздела"/);
  // Инструкции — ссылкой, без списка.
  assert.match(html, /href="\/admin\/help"[^>]*>Инструкции</);
  assert.match(html, /Найти раздел/);
  assert.match(html, />Меню</);
});

test("на странице вкладки — строка вкладок раздела, открытая подсвечена; в меню «как раньше» её нет", () => {
  globalThis.__pathname = "/admin/contracts";
  const html = renderToStaticMarkup(createElement(AdminShell, { staff: staff("ru", "admin"), children: "x" }));
  const tabs = /<nav aria-label="Вкладки раздела"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? "";
  assert.match(tabs, /href="\/admin\/projects"[^>]*>Проекты</);
  assert.match(tabs, /href="\/admin\/contracts"[^>]*aria-current="page"[^>]*>Договоры</);
  for (const [locale, name] of [["uz", "Bo‘lim yorliqlari"], ["pl", "Karty sekcji"]] as const) {
    const other = renderToStaticMarkup(createElement(AdminShell, { staff: staff(locale, "admin"), children: "x" }));
    assert.match(other, new RegExp(`aria-label="${name}"`));
  }
  const classic = renderToStaticMarkup(
    createElement(AdminShell, { staff: { ...staff("ru", "admin"), nav_classic: true }, children: "x" }),
  );
  assert.doesNotMatch(classic, /aria-label="Вкладки раздела"/);
});

test("Ctrl+K — по коду клавиши, чтобы работал и на русской раскладке; окна — через портал", () => {
  const menu = read("components/admin/nav-menu.tsx");
  assert.match(menu, /\(e\.ctrlKey \|\| e\.metaKey\) && e\.code === "KeyK"/);
  assert.match(menu, /e\.key === "Escape"/);
  assert.match(menu, /createPortal\(/);
  // Меню рисует только то, что дал сервер: своих списков разделов в нём нет.
  assert.doesNotMatch(menu, /SECTIONS|navOf/);
  assert.match(read("components/admin/shell.tsx"), /menuOf\(staff\)/);
});

declare global {
  var __pathname: string | undefined;
}

/**
 * Тумблер «Новое меню». Владелец, 13.10.2026: новое меню — всем, «но также
 * сделай возможность оставить как сейчас тумблером».
 */
test("тумблер: по умолчанию новое меню, выключен — меню одной строкой, как раньше", () => {
  globalThis.__pathname = "/admin/contracts";
  const fresh = renderToStaticMarkup(createElement(AdminShell, { staff: staff("ru", "manager"), children: "x" }));
  assert.match(fresh, /role="switch" aria-checked="true"/);
  assert.match(fresh, /aria-haspopup="true"/);
  assert.match(fresh, /name="classic" value="1"/, "щелчок по включённому — выключает");

  const classic = renderToStaticMarkup(
    createElement(AdminShell, { staff: { ...staff("ru", "admin"), nav_classic: true }, children: "x" }),
  );
  assert.match(classic, /role="switch" aria-checked="false"/);
  assert.match(classic, /name="classic" value="0"/);
  assert.doesNotMatch(classic, /aria-haspopup/, "в старом меню групп нет");
  // Все разделы — в одну строку, тем же набором, что navOf.
  const links = [...classic.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)][0][1].match(/href="[^"]+"/g) ?? [];
  assert.equal(links.length, navOf({ role: "admin" }).length);
  for (const locale of ["uz", "pl"] as const) {
    const html = renderToStaticMarkup(
      createElement(AdminShell, { staff: { ...staff(locale, "manager"), nav_classic: true }, children: "x" }),
    );
    assert.match(html, locale === "uz" ? />Yangi menyu</ : />Nowe menu</);
  }
});

test("тумблер меняет только своё и хранится в staff, колонка — с откатом", () => {
  const actions = read("app/admin/actions.ts");
  const fn = actions.slice(actions.indexOf("export async function setNavClassic"));
  assert.match(fn, /const staff = await currentStaff\(\);/);
  assert.match(fn, /setStaffNavClassic\(staff\.id, classic\)/);
  assert.doesNotMatch(fn.slice(0, fn.indexOf("\n}\n")), /formData\.get\("(staff|id)/);
  assert.match(read("lib/admin/session.ts"), /STAFF_COLUMNS = "[^"]*nav_classic/);
  assert.match(read("supabase/migrations/0156_nav_classic.sql"), /nav_classic boolean not null default false/);
  assert.match(read("supabase/migrations/0156_nav_classic.down.sql"), /drop column if exists nav_classic/);
});

test("меню как раньше на телефоне прокручивается только вбок, а не вверх-вниз", () => {
  // Владелец, 13.10.2026: «Когда я переключился на старое меню, я могу его
  // вверх вниз тянуть». Подчёркивание открытого пункта (-mb-px) выходило за
  // строку на пиксель — теперь у строки запас и запрет вертикальной прокрутки.
  const shell = read("components/admin/shell.tsx");
  assert.match(shell, /className="no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-px"/);
});

/**
 * Владелец, 23.10.2026, на разбор удобства панели: «Делаем все сразу».
 * Число на кнопке «Задачи» — свои открытые задачи, счётом базы без строк,
 * кто спрашивает — из куки.
 */
test("число на кнопке «Задачи»: свои открытые задачи, из куки, счётом базы", () => {
  const menu = read("components/admin/nav-menu.tsx");
  assert.match(menu, /only\.href === TASKS_HREF \? <TaskCount \/> : null/);
  const route = read("app/admin/tasks/count/route.ts");
  assert.match(route, /const staff = await currentStaff\(\);/);
  assert.match(route, /myTaskCounts\(staff\.id\)/);
  assert.doesNotMatch(route, /searchParams|request\.url/, "чужой id в запросе не принимается");
  const store = read("lib/admin/task-store.ts");
  const fn = store.slice(store.indexOf("export async function myTaskCounts"));
  assert.match(fn.slice(0, fn.indexOf("\n}\n")), /count: "exact", head: true/);
  assert.match(read("components/admin/task-count.tsx"), /fetch\("\/admin\/tasks\/count"/);
});

test("«Ступени продажи» — раздел в «Отчётах», старый адрес уводит туда", () => {
  assert.equal(SECTIONS.find((s) => s.href === "/admin/stages")?.group, "reports");
  assert.match(read("app/admin/stages/page.tsx"), /requireSection\("\/admin\/stages"\)/);
  assert.match(read("next.config.ts"), /source: "\/admin\/hq\/stages", destination: "\/admin\/stages"/);
});
