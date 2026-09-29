import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ROLE_TITLE,
  canSee,
  disables,
  hiredRoles,
  managesStaff,
  seesEveryone,
  seesOwnerMoney,
  tunesNotices,
} from "@/lib/admin/roles";

/**
 * Руководитель проектов.
 *
 * Роль задумана так: он ведёт команду — видит всех лидов, заводит себе
 * менеджеров, — но не распоряжается ни ролями, ни деньгами студии. Два
 * права здесь важнее прочих, и оба легко потерять при следующей правке:
 *
 *  1. он не видит, сколько остаётся владельцу;
 *  2. он не может завести второго руководителя, а через него — доступ к
 *     чужим клиентам в обход владельца.
 *
 * Первое типами не выражается: это условие в разметке, и достаточно
 * заменить `ownerMoney` на `isAdmin` обратно, чтобы колонка вернулась всем
 * администраторам. Поэтому ниже есть и проверки функций, и проверки
 * исходников.
 */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("долю владельца видит только владелец", () => {
  assert.equal(seesOwnerMoney("admin"), true);
  assert.equal(seesOwnerMoney("head"), false);
  assert.equal(seesOwnerMoney("manager"), false);
});

test("руководитель проектов заводит только менеджеров", () => {
  assert.deepEqual([...hiredRoles("head")], ["manager"]);
  assert.deepEqual([...hiredRoles("admin")], ["head", "manager"]);
  // Менеджер не заводит никого — но список у него всё равно спрашивают в
  // разметке, и пустым он быть не должен: сервер решает по requireRole.
  assert.ok(hiredRoles("manager").length > 0);
});

test("роли и грейды остаются за владельцем", () => {
  assert.equal(managesStaff("admin"), true);
  assert.equal(managesStaff("head"), false);
  assert.equal(managesStaff("manager"), false);
});

test("руководитель отключает менеджеров, но не руководителей и не владельца", () => {
  // Владелец, 28.09: «сделай Александру возможность удалять сотрудников».
  // Менеджеров — тех, кого он и заводит. Второго руководителя с командой
  // убирает только владелец.
  assert.equal(disables("head", "manager"), true);
  assert.equal(disables("head", "head"), false);
  assert.equal(disables("head", "admin"), false);
  assert.equal(disables("admin", "head"), true);
  assert.equal(disables("admin", "manager"), true);
  assert.equal(disables("manager", "manager"), false);
});

test("галочки уведомлений: владелец — всем, руководитель — менеджерам и себе", () => {
  assert.equal(tunesNotices("admin", "manager", false), true);
  assert.equal(tunesNotices("admin", "head", false), true);
  assert.equal(tunesNotices("admin", "admin", true), true);
  assert.equal(tunesNotices("head", "manager", false), true);
  assert.equal(tunesNotices("head", "head", true), true);
  assert.equal(tunesNotices("head", "head", false), false, "руководитель правит чужому руководителю");
  assert.equal(tunesNotices("head", "admin", false), false);
  // Менеджер себе не выключает очередь: иначе выйти из неё можно было бы
  // одним щелчком, никого не спросив.
  assert.equal(tunesNotices("manager", "manager", true), false);
});

test("команду видят владелец и руководитель, менеджер — нет", () => {
  assert.equal(canSee("admin", "/admin/team"), true);
  assert.equal(canSee("head", "/admin/team"), true);
  assert.equal(canSee("manager", "/admin/team"), false);
});

test("чужие лиды по-прежнему видит руководитель", () => {
  // Это право он не терял: иначе роль теряет смысл целиком.
  assert.equal(seesEveryone("head"), true);
  assert.equal(seesEveryone("manager"), false);
});

test("роль называется «руководитель проектов»", () => {
  assert.equal(ROLE_TITLE.head, "руководитель проектов");
});

test("журнал, релизы и партнёры остались только у владельца", () => {
  for (const href of ["/admin/audit", "/admin/releases", "/admin/partners"]) {
    assert.equal(canSee("head", href), false, `${href} открыт руководителю`);
  }
});

/* ── Проверки исходников ────────────────────────────────────────────────── */

test("колонка «Владельцу» стоит за seesOwnerMoney, а не за ролью по месту", () => {
  const finance = read("app/admin/finance/page.tsx");
  assert.match(finance, /const ownerMoney = seesOwnerMoney\(staff\.role\)/);
  assert.match(finance, /\{ownerMoney \? <th className=\{TH\}>\{t\.colToOwner\}<\/th> : null\}/);
  assert.ok(
    !/\{isAdmin \? <th className=\{TH\}>\{t\.colToOwner\}/.test(finance),
    "колонка владельца снова привязана к isAdmin",
  );

  const project = read("app/admin/projects/[id]/page.tsx");
  assert.match(project, /const ownerMoney = seesOwnerMoney\(staff\.role\)/);
  // Строка и её условие стоят рядом; между ними только открывающая разметка.
  const at = project.indexOf("{t.ownerLeft}");
  assert.ok(at > 0, "строка «Остаётся владельцу» пропала");
  const before = project.slice(Math.max(0, at - 220), at);
  assert.match(before, /\{ownerMoney \?/, "строка владельца не за ownerMoney");
});

test("каждое действие в команде проверяет права само", () => {
  const actions = read("app/admin/team/actions.ts");

  // Заводить, перевыдавать приглашение, отключать менеджеров и менять
  // галочки вправе оба; остальное — владелец. Кого именно руководитель
  // вправе отключить — проверяет disableStaff по роли цели (ниже).
  const shared = ["addStaff", "resend", "disable", "saveNotices"];
  const ownerOnly = ["changeRole", "assignHead", "setGrade"];

  for (const name of [...shared, ...ownerOnly]) {
    const at = actions.indexOf(`export async function ${name}(`);
    assert.ok(at > 0, `действие ${name} пропало`);
    const body = actions.slice(at, at + 400);
    const guard = shared.includes(name)
      ? /requireRole\("admin", "head"\)/
      : /requireAdmin\(\)/;
    assert.match(body, guard, `действие ${name} проверяет права не тем guard'ом`);
  }

  // Роль из формы сверяется со списком, а не «всё, что не head, — менеджер».
  assert.match(actions, /const allowed = hiredRoles\(actor\.role\)/);
  assert.match(actions, /if \(!allowed\.includes\(wanted\)\)/);

  // Галочки — по роли цели, а не по разметке страницы.
  assert.match(actions, /if \(!tunesNotices\(actor\.role, target\.role, target\.id === actor\.id\)\)/);

  // Отключение: роль цели проверяется в самом disableStaff, до записи.
  const team = read("lib/admin/team.ts");
  const at = team.indexOf("export async function disableStaff(");
  const body = team.slice(at, team.indexOf("export async function", at + 10));
  const check = body.indexOf("if (!disables(admin.role, target.role as Role))");
  assert.ok(check > 0, "disableStaff не сверяет, кого отключают");
  assert.ok(check < body.indexOf("is_active: false"), "роль цели проверяется после отключения");
});
