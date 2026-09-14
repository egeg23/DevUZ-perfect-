import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canSeeLead } from "@/lib/admin/ownership";
import type { Staff } from "@/lib/admin/session";
import { approves, needsApproval, transferVerdict } from "@/lib/admin/transfers";

/**
 * Правила владельца: «менеджерам не надо видеть чужих лидов после взятия в
 * работу; сотрудник может передать его другому сотруднику с подтверждением
 * руководителя или мной».
 */

const OWNER = "egor";
const HEAD = "alex";
const MANAGER = "dilnoza";
const OTHER = "timur";

const staff = (id: string, role: Staff["role"]): Staff =>
  ({ id, role, display_name: id, username: null, telegram_user_id: 1 }) as Staff;

test("менеджер видит свободных и своих, чужих взятых — нет", () => {
  const me = staff(MANAGER, "manager");
  assert.equal(canSeeLead({ assigned_staff_id: null }, me), true, "свободный не виден");
  assert.equal(canSeeLead({ assigned_staff_id: MANAGER }, me), true, "свой не виден");
  assert.equal(canSeeLead({ assigned_staff_id: OTHER }, me), false, "виден чужой взятый");
});

test("руководитель и владелец видят всё — это их работа", () => {
  for (const role of ["head", "admin"] as const) {
    const who = staff(role === "head" ? HEAD : OWNER, role);
    assert.equal(canSeeLead({ assigned_staff_id: OTHER }, who), true, `${role} не видит чужого`);
    assert.equal(canSeeLead({ assigned_staff_id: null }, who), true);
  }
});

test("решают руководитель и владелец, просит менеджер", () => {
  assert.equal(approves("admin"), true);
  assert.equal(approves("head"), true);
  assert.equal(approves("manager"), false);

  assert.equal(needsApproval("manager"), true);
  assert.equal(needsApproval("head"), false, "руководитель просил бы сам у себя");
  assert.equal(needsApproval("admin"), false);
});

test("передаёт тот, у кого лид, — либо руководитель и владелец", () => {
  const base = {
    holderId: MANAGER,
    targetId: OTHER,
    targetActive: true,
    hasPending: false,
  };

  assert.equal(transferVerdict({ ...base, actor: { id: MANAGER, role: "manager" } }), "ok");
  assert.equal(
    transferVerdict({ ...base, actor: { id: OTHER, role: "manager" } }),
    "not_mine",
    "чужой лид передал посторонний менеджер",
  );
  assert.equal(transferVerdict({ ...base, actor: { id: HEAD, role: "head" } }), "ok");
  assert.equal(transferVerdict({ ...base, actor: { id: OWNER, role: "admin" } }), "ok");
});

test("свободный лид берут, а не передают", () => {
  assert.equal(
    transferVerdict({
      actor: { id: OWNER, role: "admin" },
      holderId: null,
      targetId: OTHER,
      targetActive: true,
      hasPending: false,
    }),
    "free",
  );
});

test("не передают тому же, отключённому и поверх открытой просьбы", () => {
  const actor = { id: MANAGER, role: "manager" as const };

  assert.equal(
    transferVerdict({ actor, holderId: MANAGER, targetId: MANAGER, targetActive: true, hasPending: false }),
    "self",
  );
  assert.equal(
    transferVerdict({ actor, holderId: MANAGER, targetId: OTHER, targetActive: false, hasPending: false }),
    "gone",
  );
  // Открытая просьба важнее всего: иначе руководитель решал бы по лиду,
  // которого у просившего уже нет.
  assert.equal(
    transferVerdict({ actor, holderId: MANAGER, targetId: OTHER, targetActive: true, hasPending: true }),
    "pending",
  );
});

/**
 * Круг видимости держится не только страницей, но и самим запросом: список
 * лидов читается одним запросом на всех, и без условия в нём менеджер
 * получил бы чужие карточки, даже не открывая их.
 */

test("круг превращается в условие запроса, а не в доверие к странице", async () => {
  const { scopeFilter, scopeFor } = await import("@/lib/admin/leads");

  assert.equal(scopeFilter("all"), null, "у владельца условия быть не должно");
  assert.equal(
    scopeFilter({ staffId: MANAGER }),
    `assigned_staff_id.is.null,assigned_staff_id.eq.${MANAGER}`,
  );

  assert.equal(scopeFor(staff(OWNER, "admin")), "all");
  assert.equal(scopeFor(staff(HEAD, "head")), "all");
  assert.deepEqual(scopeFor(staff(MANAGER, "manager")), { staffId: MANAGER });
});

test("запрос лидов действительно сужается этим условием", () => {
  // Проверка по исходнику: мутация «убрать условие из запроса» выглядит
  // безобидно и не ломает ни типы, ни остальные тесты — а показывает
  // менеджеру чужих клиентов.
  const code = readFileSync(new URL("../lib/admin/leads.ts", import.meta.url), "utf8");
  const body = code.slice(code.indexOf("export async function listLeads"), code.indexOf("export async function leadById"));

  assert.match(body, /scopeFilter\(scope\)/, "listLeads больше не применяет круг");
  assert.match(body, /query\s*=\s*query\.or\(/, "условие круга не попадает в запрос");
});
