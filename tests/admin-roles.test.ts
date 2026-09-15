import assert from "node:assert/strict";
import { test } from "node:test";

import { canEdit } from "@/lib/admin/ownership";
import {
  ASSIGNABLE_ROLES,
  ROLES,
  ROLE_TITLE,
  canSee,
  isAssignable,
  navFor,
  seesEveryone,
} from "@/lib/admin/roles";

/**
 * Три роли, и разница между ними — не в лидах, а в разделах.
 *
 * Руководитель проектов работает с чужими лидами наравне с администратором
 * и набирает себе менеджеров, поэтому команду он видит. Релизы, журнал и
 * партнёры остаются за владельцем: выложить файл, прочитать, кто что
 * открывал, и отправить деньги постороннему человеку — не его решения.
 *
 * Что именно он может внутри «Команды» — в tests/team-roles.test.ts: список
 * состава ему открыт целиком, а правка ролей, грейдов и отключение нет.
 */
test("разделы владельца скрыты от руководителя и менеджера", () => {
  for (const href of ["/admin/releases", "/admin/audit", "/admin/partners"]) {
    assert.equal(canSee("admin", href), true, `${href} у админа`);
    assert.equal(canSee("head", href), false, `${href} виден руководителю`);
    assert.equal(canSee("manager", href), false, `${href} виден менеджеру`);
  }
  // Команда — общая у владельца и руководителя, но не у менеджера.
  assert.equal(canSee("admin", "/admin/team"), true);
  assert.equal(canSee("head", "/admin/team"), true);
  assert.equal(canSee("manager", "/admin/team"), false, "/admin/team виден менеджеру");
  for (const href of ["/admin", "/admin/scout", "/admin/prospect", "/admin/stats", "/admin/finance"]) {
    for (const role of ROLES) assert.equal(canSee(role, href), true, `${href} скрыт от ${role}`);
  }
  assert.ok(navFor("admin").length > navFor("head").length, "у админа разделов больше");
});

/**
 * Администратор — только владелец.
 *
 * Тип AssignableRole не допускает admin на уровне компилятора, а эта
 * проверка — на уровне строки из формы: server action можно отправить
 * мимо кнопки, и «admin» в поле role не должен становиться ролью.
 */
test("админом через панель не стать", () => {
  assert.equal(isAssignable("admin"), false);
  assert.equal(isAssignable("head"), true);
  assert.equal(isAssignable("manager"), true);
  assert.ok(!(ASSIGNABLE_ROLES as readonly string[]).includes("admin"));
});

test("руководитель разгребает чужие лиды, менеджер — только свои", () => {
  const manager = {
    id: "s-1",
    telegram_user_id: 1,
    username: null,
    display_name: "Менеджер",
    role: "manager" as const,
  };
  const head = { ...manager, id: "s-2", role: "head" as const };

  assert.equal(seesEveryone("head"), true);
  assert.equal(seesEveryone("manager"), false);
  assert.equal(canEdit({ assigned_staff_id: "s-1" }, head), true, "руководитель и чужой лид");
  assert.equal(canEdit({ assigned_staff_id: null }, head), true, "руководитель и свободный лид");
  assert.equal(canEdit({ assigned_staff_id: "s-2" }, manager), false, "менеджер и лид руководителя");
});

test("у каждой роли есть человеческое имя", () => {
  for (const role of ROLES) {
    assert.ok(ROLE_TITLE[role], `нет названия для ${role}`);
    assert.ok(!/[a-z]/.test(ROLE_TITLE[role]), `название ${role} осталось внутренним`);
  }
});

/**
 * Путь к правилу «админ только у владельца».
 *
 * Роль admin нельзя выдать, но лишнего админа — того, кто им стал до этого
 * правила, — владелец может перевести в руководители. Себя — нет, и
 * последнего — нет: администратор должен остаться один, а не ноль. Само
 * действие ходит в базу, поэтому здесь проверяется его решающая часть —
 * та же, что стоит в setStaffRole.
 */
test("лишнего админа можно разжаловать, себя и последнего — нет", async () => {
  const { demotionVerdict } = await import("@/lib/admin/team");

  assert.equal(demotionVerdict({ targetId: "a2", actorId: "a1", activeAdmins: 2 }), "ok");
  assert.equal(demotionVerdict({ targetId: "a1", actorId: "a1", activeAdmins: 2 }), "self");
  assert.equal(demotionVerdict({ targetId: "a2", actorId: "a1", activeAdmins: 1 }), "last_admin");
});
