import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canSeeLead } from "@/lib/admin/ownership";
import type { Staff } from "@/lib/admin/session";
import { approves, needsApproval, transferButtons, transferVerdict } from "@/lib/admin/transfers";

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

test("руководитель решает просьбу кнопкой в Telegram, а не ищет лид в панели", () => {
  const id = "7993193e-a0ad-4b3e-80d5-677939a8324b";
  const rows = transferButtons(id, "lead-1");
  const [ok, no] = rows[0] as { text: string; callback_data: string }[];
  assert.equal(ok.callback_data, `tr:ok:${id}`);
  assert.equal(no.callback_data, `tr:no:${id}`);
  // Telegram обрезает callback_data длиннее 64 байт — кнопка молча ломается.
  for (const b of [ok, no]) assert.ok(Buffer.byteLength(b.callback_data) <= 64, b.callback_data);
  assert.deepEqual(rows[1], [{ text: "Открыть лид", panel: "/admin/leads/lead-1" }]);

  const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  const store = read("lib/admin/transfers.ts");
  // Просьба уходит с кнопками, и запоминается, куда ушла.
  assert.match(store, /sendRowsForId\(chat, text, transferButtons\(String\(created\.id\), leadId\)\)/);
  assert.match(store, /update\(\{ notices \}\)/);
  // После решения — и из панели, и из Telegram — кнопки у всех меняются на итог.
  assert.match(store, /closeNotices\(data\.notices, `✖ Отклонил/);
  assert.match(store, /closeNotices\(data\.notices, `✅ Подтвердил/);

  const hook = read("app/api/telegram/webhook/route.ts");
  // Только в личке нажавшего и только тем, кто решает.
  assert.match(hook, /if \(parts\[0\] === "tr"\) \{\s*if \(chatId === undefined \|\| chatId !== query\.from\?\.id\)/);
  assert.match(hook, /if \(!staff \|\| !approves\(staff\.role\)/);
  assert.match(hook, /await decideTransfer\(transferId, decision, staff, ""\)/);
  assert.match(read("supabase/migrations/0060_transfer_notices.sql"), /add column if not exists notices jsonb/);
});
